$env.AWS_PROFILE = "spot-dev"

# start auth, wss and client dev servers in tmux sessions
def main [] {
    cd $env.FILE_PWD
    for session in [auth wss client] {
        try { tmux kill-session -t $session }
    }

    bun install
    tmux new-session -d -s auth "cd apps/auth && bun server.js"
    tmux new-session -d -s wss "cd apps/server && bun server.js"
    tmux new-session -d -s client "cd apps/client && bun run dev"
}

# cdk deploy the pokemon-world stack
def "main deploy" [] {
    cd $env.FILE_PWD
    bun run deploy
}

# build the client against the stack's URLs and sync it to S3
def "main upload client" [] {
    cd $env.FILE_PWD
    bun run release --only client
}

# wss + auth: upload to S3, install on EC2 via SSM Run Command
def "main upload server" [] {
    cd $env.FILE_PWD
    bun run release --only server
}

# shell on the EC2 instance via SSM Session Manager (needs session-manager-plugin)
def "main shell" [] {
    let id = aws cloudformation describe-stacks --stack-name pokemon-world --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='EC2InstanceId'].OutputValue" --output text
    aws ssm start-session --target $id --region us-east-1
}

# store the auth server's Slack secret; picked up on the next release
def "main secret" [value: string] {
    aws ssm put-parameter --name /pokemon-world/dev/slack-client-secret --type SecureString --overwrite --value $value --region us-east-1
}

# point local production builds (apps/client/.env) at the deployed servers
def "main env" [] {
    let outputs = aws cloudformation describe-stacks --stack-name pokemon-world --region us-east-1 --query "Stacks[0].Outputs" --output json
        | from json
        | select OutputKey OutputValue
        | transpose -r
        | into record

    [
        $"WEBSOCKET_URL=($outputs.WebSocketServerUrl)"
        $"AUTH_SERVER_URL=($outputs.AuthServerUrl)"
    ] | str join "\n" | save --force ($env.FILE_PWD | path join apps/client/.env)
    print $"game can be played @ ($outputs.GameSiteUrl)"
}

# stack resources as { logical_id: physical_id }
def "main resources" [] {
    aws cloudformation list-stack-resources --stack-name pokemon-world --region us-east-1 --query "StackResourceSummaries" --output json
        | from json
        | select LogicalResourceId PhysicalResourceId
        | update LogicalResourceId { |r| $r.LogicalResourceId | str snake-case }
        | transpose -r
        | into record
}

# system libraries for Playwright browsers (DST + E2E tests)
def "main linux dependencies" [] {
    cd ($env.FILE_PWD | path join packages/dst)
    bunx playwright install --with-deps chromium webkit
}
