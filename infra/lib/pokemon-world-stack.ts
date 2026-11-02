import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface PokemonWorldStackProps extends cdk.StackProps {
   environmentName: string;
   vpcId: string;
   subnetId: string;
   keyPairName: string;
}

// Logical IDs match the original SAM template so deploying over the existing
// `pokemon-world` stack updates resources in place instead of replacing them.
function pin(construct: Construct, logicalId: string) {
   const cfn = (construct.node.defaultChild ?? construct) as cdk.CfnElement;
   cfn.overrideLogicalId(logicalId);
}

const userData = `#!/bin/bash
dnf update -y
yum update -y

curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# need to ensure that this rule is also added to the security group
dnf install -y firewalld
systemctl start firewalld
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --reload

dnf install tmux -y

mkdir -p /home/ec2-user/websocket-server
cd /home/ec2-user/websocket-server
aws s3 cp s3://\${ServerArtifactBucket}/server.js .
npm init -y
npm install ws

tmux new-session -d -s pokemon_world "node server.js"
`;

export class PokemonWorldStack extends cdk.Stack {
   constructor(scope: Construct, id: string, props: PokemonWorldStackProps) {
      super(scope, id, { analyticsReporting: false, ...props });
      const { environmentName, vpcId, subnetId, keyPairName } = props;

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
         objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
      });
      pin(artifactBucket, "ServerArtifactBucket");

      const securityGroup = new ec2.CfnSecurityGroup(this, "WebSocketSecurityGroup", {
         groupDescription: "Allow WebSocket traffic on port 8080",
         vpcId,
         securityGroupIngress: [8080, 3000, 22].map(port => ({
            ipProtocol: "tcp",
            fromPort: port,
            toPort: port,
            cidrIp: "0.0.0.0/0"
         }))
      });
      pin(securityGroup, "WebSocketSecurityGroup");

      const instance = new ec2.CfnInstance(this, "WebSocketServerInstance", {
         instanceType: "t2.micro",
         imageId: "ami-0ebfd941bbafe70c6",
         keyName: keyPairName,
         securityGroupIds: [securityGroup.ref],
         subnetId,
         tags: [{ key: "Name", value: "WebSocketServer" }],
         // `${ServerArtifactBucket}` resolves via Fn::Sub to the pinned logical ID above.
         userData: cdk.Fn.base64(cdk.Fn.sub(userData))
      });
      pin(instance, "WebSocketServerInstance");

      const eip = new ec2.CfnEIP(this, "WebSocketServerEIP", { domain: "vpc" });
      pin(eip, "WebSocketServerEIP");

      const eipAssociation = new ec2.CfnEIPAssociation(this, "WebSocketServerEIPAssociation", {
         instanceId: instance.ref,
         eip: eip.ref
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
      new cdk.CfnOutput(this, "WebSocketServerUrl", {
         description: "URL of the WebSocket server",
         value: `ws://${eip.attrPublicIp}:8080`
      });
      new cdk.CfnOutput(this, "EC2InstanceId", {
         description: "ID of the EC2 instance running the WebSocket server",
         value: instance.ref
      });
   }
}
