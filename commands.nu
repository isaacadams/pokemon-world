$env.AWS_PROFILE = "spot-dev"

def main [] {
    try {
        tmux kill-server
    } catch {}

    # start auth server
    pnpm i
    tmux new-session -d -s auth "cd apps/auth && node server.js"
    # start websocket server
    tmux new-session -d -s wss "cd apps/server && node server.js"
    # start client
    tmux new-session -d -s client "cd apps/client && npm run dev"
}

def "main deploy" [] {
    sam deploy
}

def "main upload client" [] {
    pnpm -F @pokemon-world/game build
    aws s3 sync apps/client/dist/ s3://my-game-client-dev-389616631340/
}

def "main upload server" [name: string] {
    match $name {
        # authentication for slack, runs on port 3000
        "auth" => {
            #scp -r auth pokemon-world:/home/ec2-user/auth
            rsync -avz --exclude 'node_modules' apps/auth/ pokemon-world:/home/ec2-user/auth
            ssh pokemon-world "cd /home/ec2-user/auth && npm i && mv .env.production .env && tmux kill-session -t auth && tmux new-session -d -s auth 'node server.js'"
        }
        # websocket, port: 8000
        "wss" => {
            #aws s3 cp apps/server/server.js s3://my-game-server-artifacts-dev-389616631340/
            rsync -avz --exclude 'node_modules' apps/server/ pokemon-world:/home/ec2-user/wss
            ssh pokemon-world "cd /home/ec2-user/wss && npm i && tmux kill-session -t wss && tmux new-session -d -s wss 'node server.js'"
        }
    }
}

def "main env" [] {
    let outputs = sam list stack-outputs --stack-name pokemon-world --output json --region us-east-1 
        | from json 
        | select OutputKey OutputValue 
        | transpose -r 
        | into record

    $"WEBSOCKET_URL=($outputs.WebSocketServerUrl)" | save --append .env
    print $"game can be played @ ($outputs.GameSiteUrl)"
}

def "main resources" [] {
    let outputs = sam list resources --stack-name pokemon-world --output json --region us-east-1 
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