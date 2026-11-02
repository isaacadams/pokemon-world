import { describe, expect, test } from "bun:test";
import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { AMI_ID, PokemonWorldStack } from "../lib/pokemon-world-stack";

const app = new cdk.App();
const stack = new PokemonWorldStack(app, "Test", {
   env: { account: "123456789012", region: "us-east-1" },
   environmentName: "dev",
   vpcId: "vpc-0123456789abcdef0",
   subnetId: "subnet-0123456789abcdef0"
});
const template = Template.fromStack(stack);

describe("PokemonWorldStack", () => {
   test("game bucket is a public website", () => {
      template.hasResourceProperties("AWS::S3::Bucket", {
         BucketName: "my-game-client-dev-123456789012",
         WebsiteConfiguration: { IndexDocument: "index.html", ErrorDocument: "index.html" }
      });
      template.hasResourceProperties("AWS::S3::BucketPolicy", {
         Bucket: { Ref: "GameBucket" },
         PolicyDocument: { Statement: [{ Action: "s3:GetObject", Effect: "Allow", Principal: { AWS: "*" } }] }
      });
   });

   test("only ports 8080 and 3000 are open (no SSH)", () => {
      const sg = template.findResources("AWS::EC2::SecurityGroup").WebSocketSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress.map((r: { FromPort: number }) => r.FromPort)).toEqual([8080, 3000]);
      template.hasResourceProperties("AWS::EC2::Instance", { KeyName: Match.absent() });
   });

   test("instance uses the pinned AMI", () => {
      template.hasResourceProperties("AWS::EC2::Instance", { ImageId: AMI_ID });
      expect(AMI_ID).toMatch(/^ami-[0-9a-f]{17}$/);
   });

   test("instance is a t3.micro with standard (capped) CPU credits", () => {
      template.hasResourceProperties("AWS::EC2::Instance", {
         InstanceType: "t3.micro",
         CreditSpecification: { CPUCredits: "standard" }
      });
   });

   test("EIP is associated by allocation ID", () => {
      template.hasResourceProperties("AWS::EC2::EIPAssociation", {
         AllocationId: { "Fn::GetAtt": ["WebSocketServerEIP", "AllocationId"] },
         EIP: Match.absent()
      });
   });

   test("instance is managed by SSM and can read releases and its secret", () => {
      template.hasResourceProperties("AWS::EC2::Instance", {
         IamInstanceProfile: { Ref: "WebSocketServerInstanceProfile" }
      });
      const role = template.findResources("AWS::IAM::Role").WebSocketServerRole;
      expect(JSON.stringify(role.Properties.ManagedPolicyArns)).toContain("AmazonSSMManagedInstanceCore");
      const policy = JSON.stringify(template.findResources("AWS::IAM::Policy"));
      expect(policy).toContain("parameter/pokemon-world/dev/slack-client-secret");
      expect(policy).toContain("/releases/*");
   });
});
