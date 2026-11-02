@repo/infra (AWS CDK)
====================

CDK app for the `pokemon-world` stack: S3 website bucket, server artifact bucket, and an EC2 WebSocket server with an Elastic IP.

Commands (from `infra/`):
```bash
bun run synth    # cdk synth
bun run diff     # cdk diff
bun run deploy   # cdk deploy
bun test         # stack assertions
```

Notes:
- Settings (`environmentName`, `vpcId`, `subnetId`, `keyPairName`) live in `cdk.json` context. Override with `-c key=value`.
- Uses `CliCredentialsStackSynthesizer`: deploys with your own credentials. No `cdk bootstrap` needed.
- Logical IDs match the old SAM template.
- Pick credentials with `AWS_PROFILE=spot-dev`.
