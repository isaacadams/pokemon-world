@pokemon-world/game (Client)
===========================

Dev:
```bash
bun run dev      # http://localhost:9000, rebuilds on change
bun run build    # production bundle in dist/
```

- Bundled with `Bun.build` (`scripts/build.ts`). Each `src/*.html` is an entrypoint.
- `.tmx` files load as text. Images load as hashed asset URLs.
- Production build reads `WEBSOCKET_URL` and `AUTH_SERVER_URL` from env or `.env`.

See also:
- DST docs: packages/dst/README.md
