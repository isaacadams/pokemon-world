import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface PokemonWorldStackProps extends cdk.StackProps {
   environmentName: string;
   vpcId: string;
   subnetId: string;
}

// Keep logical IDs stable (and short) regardless of construct nesting.
function pin(construct: Construct, logicalId: string) {
   const cfn = (construct.node.defaultChild ?? construct) as cdk.CfnElement;
   cfn.overrideLogicalId(logicalId);
}

// Pinned on purpose: al2023-ami-2023.12.20261102.0-kernel-6.18-x86_64 (us-east-1, owner amazon).
// AWS deprecates it 2027-01-28. To bump, pick the newest image from
//   aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64
// (AWS's default kernel; 6.18 as of this pin). Changing it replaces the instance;
// it reinstalls releases/latest on boot.
export const AMI_ID = "ami-0c230065b91270bc6";

interface UserDataProps {
   artifactBucket: string;
   region: string;
   clientUrl: string;
   secretParameter: string;
}

// Boots the instance: installs Node, systemd units for both servers, and
// `pokemon-world-deploy`, which installs a release from S3 and restarts them.
// Releases are pushed with `bun run release` (see infra/scripts/release.ts).
function userData({ artifactBucket, region, clientUrl, secretParameter }: UserDataProps) {
   return `#!/bin/bash
set -euxo pipefail

# The Elastic IP is associated after launch; wait for outbound access.
for i in $(seq 60); do curl -sf -o /dev/null https://rpm.nodesource.com && break; sleep 5; done

# Security/bug fixes within the AMI's locked AL2023 release version.
dnf update -y

curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

mkdir -p /opt/pokemon-world/releases /etc/pokemon-world

cat > /usr/local/bin/pokemon-world-deploy <<'EOF'
#!/bin/bash
# Usage: pokemon-world-deploy [release]  (defaults to releases/latest)
set -euo pipefail
bucket=${artifactBucket}
region=${region}
release=\${1:-}
if [ -z "$release" ]; then
   release=$(aws s3 cp "s3://$bucket/releases/latest" - --region "$region" 2>/dev/null || true)
fi
if [ -z "$release" ]; then
   echo "no release published yet"
   exit 0
fi

dir=/opt/pokemon-world/releases/$release
mkdir -p "$dir"
aws s3 cp --recursive "s3://$bucket/releases/$release/" "$dir/" --region "$region"
touch "$dir" # newest mtime, so the prune below never removes the live release

secret=$(aws ssm get-parameter --name "${secretParameter}" --with-decryption --query Parameter.Value --output text --region "$region" 2>/dev/null || true)
install -m 600 /dev/null /etc/pokemon-world/auth.env
printf 'CLIENT_URL=%s\\nSLACK_CLIENT_SECRET=%s\\n' "${clientUrl}" "$secret" > /etc/pokemon-world/auth.env

ln -sfn "$dir" /opt/pokemon-world/current
systemctl restart pokemon-wss pokemon-auth

# Keep the five most recent releases for rollback.
ls -1dt /opt/pokemon-world/releases/* | tail -n +6 | xargs -r rm -rf
echo "deployed $release"
EOF
chmod 755 /usr/local/bin/pokemon-world-deploy

cat > /etc/systemd/system/pokemon-wss.service <<'EOF'
[Unit]
Description=Pokemon World WebSocket server
After=network-online.target
ConditionPathExists=/opt/pokemon-world/current/server.js

[Service]
DynamicUser=yes
Environment=PORT=8080
ExecStart=/usr/bin/node /opt/pokemon-world/current/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/pokemon-auth.service <<'EOF'
[Unit]
Description=Pokemon World auth server
After=network-online.target
ConditionPathExists=/opt/pokemon-world/current/auth.js

[Service]
DynamicUser=yes
EnvironmentFile=-/etc/pokemon-world/auth.env
ExecStart=/usr/bin/node /opt/pokemon-world/current/auth.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable pokemon-wss pokemon-auth
/usr/local/bin/pokemon-world-deploy
`;
}

export class PokemonWorldStack extends cdk.Stack {
   constructor(scope: Construct, id: string, props: PokemonWorldStackProps) {
      super(scope, id, { analyticsReporting: false, ...props });
      const { environmentName, vpcId, subnetId } = props;

      const gameBucket = new s3.Bucket(this, "GameBucket", {
         bucketName: `my-game-client-${environmentName}-${this.account}`,
         websiteIndexDocument: "index.html",
         websiteErrorDocument: "index.html",
         cors: [{ allowedHeaders: ["*"], allowedMethods: [s3.HttpMethods.GET], allowedOrigins: ["*"], maxAge: 3000 }],
         objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
         blockPublicAccess: new s3.BlockPublicAccess({
            blockPublicAcls: false,
            ignorePublicAcls: false,
            blockPublicPolicy: false,
            restrictPublicBuckets: false
         }),
         publicReadAccess: true
      });
      pin(gameBucket, "GameBucket");
      pin(gameBucket.policy!, "GameBucketPolicy");

      const artifactBucket = new s3.Bucket(this, "ServerArtifactBucket", {
         bucketName: `my-game-server-artifacts-${environmentName}-${this.account}`,
         objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
         blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
         enforceSSL: true,
         lifecycleRules: [{ prefix: "releases/", expiration: cdk.Duration.days(90) }]
      });
      pin(artifactBucket, "ServerArtifactBucket");

      // No SSH: shell access and deploys go through SSM (Session Manager / Run Command).
      const securityGroup = new ec2.CfnSecurityGroup(this, "WebSocketSecurityGroup", {
         groupDescription: "Allow WebSocket (8080) and auth (3000) traffic",
         vpcId,
         securityGroupIngress: [8080, 3000].map(port => ({
            ipProtocol: "tcp",
            fromPort: port,
            toPort: port,
            cidrIp: "0.0.0.0/0"
         }))
      });
      pin(securityGroup, "WebSocketSecurityGroup");

      const secretParameter = `/pokemon-world/${environmentName}/slack-client-secret`;
      const role = new iam.Role(this, "WebSocketServerRole", {
         assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
         managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")]
      });
      artifactBucket.grantRead(role, "releases/*");
      role.addToPolicy(
         new iam.PolicyStatement({
            actions: ["ssm:GetParameter"],
            resources: [this.formatArn({ service: "ssm", resource: "parameter", resourceName: secretParameter.slice(1) })]
         })
      );
      pin(role, "WebSocketServerRole");
      const instanceProfile = new iam.CfnInstanceProfile(this, "WebSocketServerInstanceProfile", {
         roles: [role.roleName]
      });
      pin(instanceProfile, "WebSocketServerInstanceProfile");

      const instance = new ec2.CfnInstance(this, "WebSocketServerInstance", {
         instanceType: "t3.micro",
         // t3 defaults to "unlimited" credits (surplus CPU is billed); standard throttles instead.
         creditSpecification: { cpuCredits: "standard" },
         imageId: AMI_ID,
         iamInstanceProfile: instanceProfile.ref,
         securityGroupIds: [securityGroup.ref],
         subnetId,
         tags: [{ key: "Name", value: "WebSocketServer" }],
         userData: cdk.Fn.base64(
            userData({
               artifactBucket: artifactBucket.bucketName,
               region: this.region,
               clientUrl: gameBucket.bucketWebsiteUrl,
               secretParameter
            })
         )
      });
      pin(instance, "WebSocketServerInstance");
      const eip = new ec2.CfnEIP(this, "WebSocketServerEIP", { domain: "vpc" });
      pin(eip, "WebSocketServerEIP");

      const eipAssociation = new ec2.CfnEIPAssociation(this, "WebSocketServerEIPAssociation", {
         instanceId: instance.ref,
         allocationId: eip.attrAllocationId
      });
      pin(eipAssociation, "WebSocketServerEIPAssociation");

      new cdk.CfnOutput(this, "GameSiteUrl", {
         description: "URL of the static game site",
         value: gameBucket.bucketWebsiteUrl
      });
      new cdk.CfnOutput(this, "GameBucketName", {
         description: "S3 bucket the client build is synced to",
         value: gameBucket.bucketName
      });
      new cdk.CfnOutput(this, "ArtifactBucketName", {
         description: "S3 bucket server releases are uploaded to",
         value: artifactBucket.bucketName
      });
      new cdk.CfnOutput(this, "WebSocketServerUrl", {
         description: "URL of the WebSocket server",
         value: `ws://${eip.attrPublicIp}:8080`
      });
      new cdk.CfnOutput(this, "AuthServerUrl", {
         description: "URL of the auth server",
         value: `http://${eip.attrPublicIp}:3000`
      });
      new cdk.CfnOutput(this, "EC2InstanceId", {
         description: "ID of the EC2 instance running the WebSocket server",
         value: instance.ref
      });
      new cdk.CfnOutput(this, "SlackSecretParameter", {
         description: "SSM SecureString holding the auth server's SLACK_CLIENT_SECRET",
         value: secretParameter
      });
   }
}
