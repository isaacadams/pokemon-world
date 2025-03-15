$env.AWS_PROFILE = "spot-dev"

def main [] {}

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