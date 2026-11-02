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
    bun run --filter @pokemon-world/game build
    aws s3 sync apps/client/dist/ s3://my-game-client-dev-389616631340/
}

# nu commands.nu upload server wss
def "main upload server" [name: string] {
    match $name {
        # authentication for slack, runs on port 3000
        "auth" => {
            #scp -r auth pokemon-world:/home/ec2-user/auth
            rsync -avz --exclude 'node_modules' apps/auth/ pokemon-world:/home/ec2-user/auth
            ssh pokemon-world "cd /home/ec2-user/auth && npm i && mv .env.production .env && (tmux has-session -t auth 2>/dev/null && tmux kill-session -t auth || true) && tmux new-session -d -s auth 'node server.js'"
        }
        # websocket, port: 8000
        "wss" => {
            #aws s3 cp apps/server/server.js s3://my-game-server-artifacts-dev-389616631340/
            rsync -avz --exclude 'node_modules' apps/server/ pokemon-world:/home/ec2-user/wss
            ssh pokemon-world "cd /home/ec2-user/wss && npm i && (tmux has-session -t wss 2>/dev/null && tmux kill-session -t wss || true) && PORT=8080 tmux new-session -d -s wss 'node server.js'"
        }
    }
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

def "main dst" [] {
    docker build -t pokemon-world -f dockerfile.dst .
    #docker run -v $(pwd):/app pokemon-world
    docker run pokemon-world
}
