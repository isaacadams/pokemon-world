@repo/infra (AWS CDK)
====================

CDK app for the `pokemon-world` stack: S3 website bucket, release artifact bucket, and an EC2 instance running the WebSocket and auth servers behind an Elastic IP.

Commands (from `infra/`):
```bash
bun run synth     # cdk synth
bun run diff      # cdk diff
bun run deploy    # cdk deploy
bun run release   # ship server/auth/client (see below)
bun test          # stack assertions
```

Settings
--------

- `environmentName`, `vpcId`, `subnetId` live in `cdk.json` context. Override with `-c key=value`.
- Uses `CliCredentialsStackSynthesizer`: deploys with your own credentials. No `cdk bootstrap` needed.
- Pick credentials with `AWS_PROFILE=spot-dev`.

Releases
--------

`scripts/release.ts` replaces rsync/ssh:

1. `bun build` bundles `apps/server` and `apps/auth` into single files (no `npm install` on the box).
2. Uploads them to `s3://<artifacts>/releases/<git sha>/`.
3. Runs `pokemon-world-deploy <sha>` on the instance via SSM Run Command, then waits and prints its output.
4. Points `releases/latest` at the sha. New instances install it on boot.
5. Builds the client against the stack's URLs and syncs it to the website bucket.

On the instance:
- `pokemon-wss` (8080) and `pokemon-auth` (3000) are systemd services.
- `/opt/pokemon-world/current` symlinks to the live release. The last 5 are kept.
- Roll back: `aws ssm send-command --instance-ids <id> --document-name AWS-RunShellScript --parameters 'commands=["/usr/local/bin/pokemon-world-deploy <old sha>"]'`.

Access and secrets
------------------

- No SSH (port 22 closed, no key pair). Shell in with `aws ssm start-session --target <instance id>`.
- Auth secret: SSM SecureString `/pokemon-world/<env>/slack-client-secret`. Set it once:
  ```bash
  aws ssm put-parameter --name /pokemon-world/dev/slack-client-secret --type SecureString --value '...'
  ```
- `CLIENT_URL` for auth is the website bucket URL.
- CI credentials need `ssm:SendCommand`, `ssm:GetCommandInvocation`, S3 write on both buckets, and CloudFormation read.
