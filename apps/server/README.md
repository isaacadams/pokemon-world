@pokemon-world/server (WebSocket)
================================

Start:
```bash
bun apps/server/server.js
```

Test:
```bash
bun test apps/server
```

Env (optional):
- `ALLOWED_ORIGINS`: comma-separated browser origins; unset allows any (dev). Set by infra.
- `WS_MAX_CLIENTS` (200), `WS_MAX_PAYLOAD_BYTES` (4096), `WS_MAX_MESSAGES_PER_SECOND` (200)

See also:
- DST docs: packages/dst/README.md
