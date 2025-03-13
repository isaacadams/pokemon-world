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