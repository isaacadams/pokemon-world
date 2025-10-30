## Pokemon World (Monorepo)

Terse quickstart for getting the app running locally.

### Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm 10+ (`corepack enable` or `npm i -g pnpm`)

### Install
```bash
pnpm install
```

### Run (development)
- Client (PixiJS game):
```bash
pnpm --filter @pokemon-world/game dev
```
  - Opens dev server via webpack-dev-server.

- Server (WebSocket):
```bash
node apps/server/server.js
```

### Build
```bash
pnpm build
```
Uses Turborepo to build all packages/apps.

### Repo structure
- `apps/client`: browser client (webpack, PixiJS)
- `apps/server`: Node WebSocket server (`ws`)
- `apps/auth`: Express auth prototype
- `packages/core`: shared game/core logic
 - `packages/dst`: deterministic simulation testing (DST)

### Docs
- DST: packages/dst/README.md
- Client: apps/client/README.md
- Server: apps/server/README.md
- Auth: apps/auth/README.md
- Core: packages/core/README.md

### Common issues
- If deps look odd: `pnpm run fresh-install`
- Port conflicts: stop prior webpack/dev servers

### Deployed demo
site: http://my-game-client-dev-389616631340.s3-website-us-east-1.amazonaws.com

### Deploy (infra + client)

1) Deploy infrastructure (S3 website + EC2 WebSocket server) with SAM
```bash
sam deploy
```

2) Build the client and upload to the S3 website bucket
```bash
pnpm -F @pokemon-world/game build
aws s3 sync apps/client/dist/ s3://my-game-client-dev-389616631340/ --delete
```

- You are hitting the S3 Website endpoint directly, so no CloudFront invalidation is needed.
- Shortcut (Nushell):
```bash
nu -c 'use ./commands.nu *; main upload client'
```

---

## Sprites / Tilesets

places to look for more sprites and tilesets:

- https://drive.google.com/drive/folders/17Q_B4Si4YbED5MV72EPd8MaleGLayxXM
- https://msikma.github.io/pokesprite/overview/dex-gen7.html

## TODO

- when walking into a barrier, animation should still play
- new remote player appears to spawn in top left corner
- when direction is changed while holding down a different moving key, animation breaks
- tops of trees & top of pokemon center needs to go on layer 3 and are not impassable

## tmux

| command     | description        | example                                             |
| ----------- | ------------------ | --------------------------------------------------- |
| ls          | view sessions      | `tmux ls`                                           |
| new-session | create and execute | `tmux new-session -d -s websocket "node server.js"` |
| attach      | attach to existing | `tmux attach -t websocket`                          |
| kill        | kill session       | `tmux kill-session -t websocket`                    |

- When tmux is opened, type `ctrl+b` and then type `s` to switch between active sessions
- `ctrl+b` then `:` to type commands
   - `new` for a new session
   - `switch -t <name>` to switch
