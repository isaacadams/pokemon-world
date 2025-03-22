import * as PIXI from "pixi.js";
import { TileMap } from "@repo/core";
import { DeterministicClock, InputSimulator } from "./clock";
import seedrandom from "seedrandom";
// Mock map data for testing
const mockMapData = `
<map width="10" height="10">
    <layer id="1" width="10" height="10">
        <data>1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,...</data>
    </layer>
</map>`;

if (typeof Worker === "undefined" && typeof process !== "undefined" && process.release.name === "node") {
   const { Worker } = require("worker_threads");
   global.Worker = Worker;
}
PIXI.Assets.preferWorkers = false;
// Pass mock data to TileMap constructor
//const tileMap = new TileMap("path/to/tileset.png", 10, 10);
// Override map1Data with mockMapData in tests

export class GameSimulator {
   clock: DeterministicClock;
   rng: any;
   inputSimulator: any;
   state: any;
   ticker: PIXI.Ticker;
   app: PIXI.Application<PIXI.ICanvas>;
   tileMap: any;

   constructor(seed: string, initialState: { character: { x: number; y: number } }) {
      this.clock = new DeterministicClock();
      this.rng = seedrandom(seed);
      this.inputSimulator = new InputSimulator([]);
      this.state = initialState; // { map, character, etc. }
      this.ticker = new PIXI.Ticker();
      this.ticker.autoStart = false;

      // Initialize Pixi.js app
      this.app = new PIXI.Application({
         width: 800,
         height: 600,
         backgroundColor: 0x1099bb
      });

      // Add the map
      this.tileMap = new TileMap("", "", "");
      this.app.stage.addChild(this.tileMap.getContainer());

      // Set up game loop
      this.ticker.add(() => this.step());
   }

   step() {
      const delta = this.clock.getTime() - this.ticker.lastTime;
      const input = this.inputSimulator.getNextInput(this.clock.getTime());
      if (input) {
         this.handleInput(input);
      }
      // Update game state (e.g., character position, animations)
      this.ticker.lastTime = this.clock.getTime();
   }

   handleInput(input: any) {
      // Update state based on input
      // e.g., move character if tile is walkable
   }

   run(steps: number, deltaPerStep: number) {
      for (let i = 0; i < steps; i++) {
         this.clock.advanceTime(deltaPerStep);
         this.ticker.update();
      }
   }

   getState() {
      return this.state;
   }
}

const assert = require("assert");

const simulator = new GameSimulator("test-seed", { character: { x: 2, y: 2 } });
simulator.inputSimulator = new InputSimulator([
   { time: 100, key: "ArrowRight", action: "press" },
   { time: 200, key: "ArrowRight", action: "release" }
]);
simulator.run(300, 16);
const state = simulator.getState();
assert.strictEqual(state.character.x, 3, "Character should move right");
