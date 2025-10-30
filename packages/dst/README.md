Deterministic Simulation Testing (DST)
=====================================

This package provides a deterministic, seed-driven simulation harness and Playwright tests for the game. It enables fully repeatable scenarios by controlling time, randomness, and inputs, with an optional slow visualization mode.

What it includes
----------------

- Deterministic clock and manual ticker driving (`DeterministicClock` in `src/clock.ts`).
- Input sequencing (`InputSimulator` in `src/clock.ts`).
- Seeded simulator (`GameSimulator` in `src/index.ts`) that:
  - Hosts a Pixi `Application` and visible character.
  - Advances deterministically with `run(steps, deltaPerStep)` or `runRealtime(...)`.
  - Respects `TileMap.isTileWalkable` when a map is attached.
- Visualization entry page (`src/index.html` + `src/game.ts`) that exposes `window.app`, `window.tileMap`, and `window.simulator` for tests and manual exploration.
- Playwright test (`src/v1.spec.ts`) that runs a seeded input sequence and asserts final position.

Quick start
-----------

Install and serve:

```bash
pnpm i
pnpm -F @repo/dst serve
```

Open the visualization:

- Normal: `http://localhost:1234/`
- Slow visualization mode: `http://localhost:1234/?slow=1`
  - Runs a short, visible, deterministic sequence using `runRealtime`.

Run tests (headless):

```bash
pnpm -F @repo/dst test
```

Run tests (headed):

```bash
pnpm -F @repo/dst test -- --headed
```

Key APIs
--------

- `DeterministicClock.advanceTime(deltaMs)` and `getTime()`
- `InputSimulator` with an array of `{ time, key, action }`
- `new GameSimulator(seed, { character: { x, y } })`
  - `simulator.inputSimulator = new InputSimulator([...])`
  - `simulator.run(steps, deltaPerStep)`
  - `simulator.runRealtime({ steps, deltaPerStep, intervalMs })`
  - `simulator.getState()`
  - `simulator.app` (Pixi Application), `simulator.tileMap` (optional)

Testing pattern (Playwright)
---------------------------

Minimal example inside a test page context:

```ts
const sim = (window as any).simulator;
sim.inputSimulator = new sim.inputSimulator.constructor([
  { time: 16, key: "ArrowRight", action: "press" },
  { time: 32, key: "ArrowDown", action: "press" }
]);
sim.run(5, 16);
const { x, y } = sim.getState().character;
```

Integrating DST across the main client (recommended next steps)
---------------------------------------------------------------

- Time control: allow `apps/client` game loop to accept a clock provider (default: real time; test: `DeterministicClock`).
- RNG control: route all randomness through a small wrapper (default: `Math.random`; test: `seedrandom(seed)`).
- Input control: add a record/replay harness so player inputs can be captured and deterministically replayed.
- URL-driven config: accept `?seed=...&slow=1` to enable deterministic runs and slow visualization in the main client.
- CI: add a job that runs Playwright DST scenarios for regression coverage.

File map
--------

- `src/clock.ts`: `DeterministicClock`, `InputSimulator`.
- `src/index.ts`: `GameSimulator` (seeded deterministic harness).
- `src/game.ts`: Visualization entry; wires map + simulator; exposes globals.
- `src/index.html`: Canvas host for Parcel.
- `src/v1.spec.ts`: Playwright scenario exercising deterministic inputs.
- `playwright.config.js`: Runs tests against Parcel at `http://localhost:1234`.

Notes
-----

- `GameSimulator` uses map tile size when a `TileMap` is attached; otherwise defaults to `32`.
- Slow visualization leverages `runRealtime` with `setInterval`; tune `intervalMs` for desired speed.

