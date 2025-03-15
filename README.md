site: http://my-game-client-dev-389616631340.s3-website-us-east-1.amazonaws.com

## Sprites / Tilesets

places to look for more sprites and tilesets:

- https://drive.google.com/drive/folders/17Q_B4Si4YbED5MV72EPd8MaleGLayxXM
- https://msikma.github.io/pokesprite/overview/dex-gen7.html

## TODO

- when walking into a barrier, animation should still play
- new remote player appears to spawn in top left corner

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
