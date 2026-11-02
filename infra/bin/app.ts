import * as cdk from "aws-cdk-lib";
import { PokemonWorldStack } from "../lib/pokemon-world-stack";

const app = new cdk.App();

// Override any of these with `-c key=value` (defaults live in cdk.json).
const ctx = (key: string) => {
   const value = app.node.tryGetContext(key);
   if (!value) throw new Error(`missing CDK context value: ${key}`);
   return String(value);
};

new PokemonWorldStack(app, "PokemonWorld", {
   stackName: "pokemon-world",
   // us-east-1 only: the pinned AMI and the VPC/subnet context are region-specific.
   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
   // Deploy with the caller's credentials, like `sam deploy`; no `cdk bootstrap` needed (the stack has no assets).
   synthesizer: new cdk.CliCredentialsStackSynthesizer(),
   environmentName: ctx("environmentName"),
   vpcId: ctx("vpcId"),
   subnetId: ctx("subnetId")
});
