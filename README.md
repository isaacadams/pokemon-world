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

### Common issues
- If deps look odd: `pnpm run fresh-install`
- Port conflicts: stop prior webpack/dev servers

### Deployed demo
site: http://my-game-client-dev-389616631340.s3-website-us-east-1.amazonaws.com

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
