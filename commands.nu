$env.AWS_PROFILE = "spot-dev"

def main [] {
    try {
        tmux kill-server
    } catch {}

    # start auth server
    tmux new-session -d -s auth "cd auth && npm i && node server.js"
    # start websocket server
    tmux new-session -d -s wss "cd server && npm i && node server.js"
    # start client
    tmux new-session -d -s client "npm i && npm run dev"
}

def "main deploy" [] {
    sam deploy
}

def "main upload client" [] {
    npm run build
    aws s3 sync dist/ s3://my-game-client-dev-389616631340/
}

def "main upload server" [] {
    aws s3 cp server/server.js s3://my-game-server-artifacts-dev-389616631340/
    #scp -r auth pokemon-world:/home/ec2-user/auth
    rsync -avz --exclude 'node_modules' auth/ pokemon-world:/home/ec2-user/auth
    ssh pokemon-world "cd /home/ec2-user/auth && npm i && mv .env.production .env && tmux new-session -d -s auth 'node server.js'"
    #firewall-cmd --add-port=3000/tcp --permanent
    #firewall-cmd --reload
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