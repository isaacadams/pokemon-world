export type InputEvent = { time: number; key: string; action: "press" | "release" };

export type Scenario = {
   seed: string;
   inputs: InputEvent[];
   steps: number;
   deltaPerStep: number;
   intervalMs?: number;
};

export const scenarios: Record<string, Scenario> = {
   demo: {
      seed: "demo-seed",
      inputs: [
         { time: 16, key: "ArrowRight", action: "press" },
         { time: 32, key: "ArrowDown", action: "press" },
         { time: 48, key: "ArrowRight", action: "press" }
      ],
      steps: 10,
      deltaPerStep: 16,
      intervalMs: 120
   },
   walk_square: {
      seed: "square-seed",
      inputs: [
         { time: 16, key: "ArrowRight", action: "press" },
         { time: 32, key: "ArrowDown", action: "press" },
         { time: 48, key: "ArrowLeft", action: "press" },
         { time: 64, key: "ArrowUp", action: "press" }
      ],
      steps: 8,
      deltaPerStep: 16,
      intervalMs: 140
   }
};


