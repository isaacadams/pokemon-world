export type InputEvent = { time: number; key: string; action: "press" | "release" };

export const scenarios: Record<string, { inputs: InputEvent[] }> = {
   demo: {
      inputs: [
         { time: 100, key: "ArrowRight", action: "press" },
         { time: 300, key: "ArrowRight", action: "release" },
         { time: 400, key: "ArrowDown", action: "press" },
         { time: 600, key: "ArrowDown", action: "release" }
      ]
   },
   walk_square: {
      inputs: [
         { time: 100, key: "ArrowRight", action: "press" },
         { time: 300, key: "ArrowRight", action: "release" },
         { time: 400, key: "ArrowDown", action: "press" },
         { time: 600, key: "ArrowDown", action: "release" },
         { time: 700, key: "ArrowLeft", action: "press" },
         { time: 900, key: "ArrowLeft", action: "release" },
         { time: 1000, key: "ArrowUp", action: "press" },
         { time: 1200, key: "ArrowUp", action: "release" }
      ]
   }
};


