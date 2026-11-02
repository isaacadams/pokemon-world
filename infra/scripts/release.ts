// Builds and ships a release without SSH:
//   server/auth -> s3://<artifacts>/releases/<sha>/, installed on EC2 via SSM Run Command
//   client      -> built against the stack's URLs, synced to the website bucket
// Usage: bun scripts/release.ts [--only server|client]
import { $ } from "bun";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ args: Bun.argv.slice(2), options: { only: { type: "string" } } });
const root = path.resolve(import.meta.dir, "../..");
const stackName = "pokemon-world";

const outputs: { OutputKey: string; OutputValue: string }[] =
   await $`aws cloudformation describe-stacks --stack-name ${stackName} --query Stacks[0].Outputs --output json`.json();
const output = (key: string) => {
   const value = outputs.find(o => o.OutputKey === key)?.OutputValue;
   if (!value) throw new Error(`stack output ${key} not found`);
   return value;
};

async function releaseServer() {
   // The checked-out commit, not GITHUB_SHA: a manual deploy of an older tag runs with GITHUB_SHA = main.
   const release = (await $`git -C ${root} rev-parse HEAD`.text()).trim().slice(0, 12);
   const prefix = `s3://${output("ArtifactBucketName")}/releases`;
   const instanceId = output("EC2InstanceId");

   await $`bun run build`.cwd(path.join(root, "apps/server"));
   await $`bun run build`.cwd(path.join(root, "apps/auth"));
   await $`aws s3 cp ${path.join(root, "apps/server/dist/server.js")} ${prefix}/${release}/server.js`;
   await $`aws s3 cp ${path.join(root, "apps/auth/dist/auth.js")} ${prefix}/${release}/auth.js`;

   const parameters = JSON.stringify({ commands: [`/usr/local/bin/pokemon-world-deploy ${release}`] });
   const commandId = (
      await $`aws ssm send-command --instance-ids ${instanceId} --document-name AWS-RunShellScript --comment ${`pokemon-world ${release}`} --parameters ${parameters} --query Command.CommandId --output text`.text()
   ).trim();
   console.log(`release ${release}: SSM command ${commandId} on ${instanceId}`);

   // `wait` exits non-zero on failure; the invocation below has the details either way.
   await $`aws ssm wait command-executed --command-id ${commandId} --instance-id ${instanceId}`.nothrow();
   const invocation = await $`aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId} --output json`.json();
   console.log(invocation.StandardOutputContent);
   if (invocation.Status !== "Success") {
      console.error(invocation.StandardErrorContent);
      throw new Error(`release ${release} failed on ${instanceId}: ${invocation.Status}`);
   }

   // New instances install whatever `latest` points at on boot.
   await $`echo ${release} | aws s3 cp - ${prefix}/latest`;
}

async function releaseClient() {
   await $`bun run build`.cwd(path.join(root, "apps/client")).env({
      ...process.env,
      WEBSOCKET_URL: output("WebSocketServerUrl"),
      AUTH_SERVER_URL: output("AuthServerUrl")
   });
   await $`aws s3 sync ${path.join(root, "apps/client/dist")}/ s3://${output("GameBucketName")}/ --delete`;
   console.log(`client: ${output("GameSiteUrl")}`);
}

if (values.only !== "client") await releaseServer();
if (values.only !== "server") await releaseClient();
