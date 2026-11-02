import { describe, expect, test } from "bun:test";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { PokemonWorldStack } from "../lib/pokemon-world-stack";

const app = new cdk.App();
const stack = new PokemonWorldStack(app, "Test", {
   env: { account: "123456789012", region: "us-east-1" },
   environmentName: "dev",
   vpcId: "vpc-0123456789abcdef0",
   subnetId: "subnet-0123456789abcdef0",
   keyPairName: "default"
});
const template = Template.fromStack(stack);

describe("PokemonWorldStack", () => {
   test("keeps the SAM template's logical IDs", () => {
      expect(Object.keys(template.toJSON().Resources).sort()).toEqual([
         "GameBucket",
         "GameBucketPolicy",
         "ServerArtifactBucket",
         "WebSocketSecurityGroup",
         "WebSocketServerEIP",
         "WebSocketServerEIPAssociation",
         "WebSocketServerInstance"
      ]);
   });

   test("game bucket is a public website", () => {
      template.hasResourceProperties("AWS::S3::Bucket", {
         BucketName: "my-game-client-dev-123456789012",
         WebsiteConfiguration: { IndexDocument: "index.html", ErrorDocument: "index.html" }
      });
      template.hasResourceProperties("AWS::S3::BucketPolicy", {
         PolicyDocument: { Statement: [{ Action: "s3:GetObject", Effect: "Allow", Principal: { AWS: "*" } }] }
      });
   });

   test("websocket server opens ports 8080, 3000 and 22", () => {
      const sg = template.findResources("AWS::EC2::SecurityGroup").WebSocketSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress.map((r: { FromPort: number }) => r.FromPort)).toEqual([8080, 3000, 22]);
   });
});
