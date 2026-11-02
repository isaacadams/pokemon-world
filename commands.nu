$env.AWS_PROFILE = "spot-dev"

def main [] {
    try {
        tmux kill-server
    } catch {}

    # start auth server
    bun install
    tmux new-session -d -s auth "cd apps/auth && bun server.js"
    # start websocket server
    tmux new-session -d -s wss "cd apps/server && bun server.js"
    # start client
    tmux new-session -d -s client "cd apps/client && bun run dev"
}

def "main deploy" [] {
    cd infra; bunx cdk deploy
}

def "main upload client" [] {
    bun run release --only client
}

# wss + auth: upload to S3, install on EC2 via SSM Run Command
def "main upload server" [] {
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

def "main env" [] {
    let outputs = aws cloudformation describe-stacks --stack-name pokemon-world --region us-east-1 --query "Stacks[0].Outputs" --output json
        | from json
        | select OutputKey OutputValue 
        | transpose -r 
        | into record

    $"WEBSOCKET_URL=($outputs.WebSocketServerUrl)" | save --append .env
    print $"game can be played @ ($outputs.GameSiteUrl)"
}

def "main resources" [] {
    let outputs = aws cloudformation list-stack-resources --stack-name pokemon-world --region us-east-1 --query "StackResourceSummaries" --output json
        | from json
        | select LogicalResourceId PhysicalResourceId 
        | update LogicalResourceId { |r| $r.LogicalResourceId | str snake-case }
        | transpose -r 
        | into record

    $outputs
}

def "main linux dependencies" [] {
    sudo apt update
    sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev libpng-dev pkg-config libuuid1 uuid-dev libfreetype6-dev librsvg2-dev libgdk-pixbuf2.0-dev
}
