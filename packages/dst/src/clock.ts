import * as PIXI from "pixi.js";

export class DeterministicClock {
   currentTime: number;

   constructor() {
      this.currentTime = 0;
   }

   advanceTime(deltaMs: number) {
      this.currentTime += deltaMs;
   }

   getTime() {
      return this.currentTime;
   }
}

const clock = new DeterministicClock();

// Override Pixi.js Ticker to use deterministic time
const ticker = new PIXI.Ticker();
ticker.autoStart = false; // Disable auto-updates
ticker.add(() => {
   // Use deterministic clock instead of real time
   const delta = clock.getTime() - ticker.lastTime;
   // Update your game logic with delta
   // e.g., update character position, animations, etc.
});

// In your test, advance time manually
//clock.advanceTime(16); // Simulate 16ms (approx 60 FPS)
//ticker.update();
export class InputSimulator {
   inputSequence: any;
   currentIndex: number;

   constructor(inputSequence: { time: number; key: string; action: string }[]) {
      this.inputSequence = inputSequence; // Array of { time, key, action }
      this.currentIndex = 0;
   }

   getNextInput(currentTime: number) {
      if (this.currentIndex >= this.inputSequence.length) return null;
      const input = this.inputSequence[this.currentIndex];
      if (currentTime >= input.time) {
         this.currentIndex++;
         return input;
      }
      return null;
   }
}

// Example input sequence
//const inputSequence = [
//   { time: 100, key: "ArrowRight", action: "press" },
//   { time: 200, key: "ArrowRight", action: "release" },
//   { time: 300, key: "ArrowDown", action: "press" }
//];
//
//const inputSimulator = new InputSimulator(inputSequence);
//
//// In your game loop
//ticker.add(() => {
//   const input = inputSimulator.getNextInput(clock.getTime());
//   if (input) {
//      // Simulate the input, e.g., move character
//      if (input.key === "ArrowRight" && input.action === "press") {
//         // Move character right
//      }
//   }
//});
