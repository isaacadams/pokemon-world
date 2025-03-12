$env.AWS_PROFILE = "spot-dev"

def main [] {}

def "main deploy" [] {
    sam deploy
}

def "main upload" [] {
    aws s3 cp server/server.js s3://my-game-server-artifacts-dev-389616631340/
    npm run build
    aws s3 sync dist/ s3://my-game-client-dev-389616631340/
}
