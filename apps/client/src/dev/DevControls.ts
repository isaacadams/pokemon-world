import PlayerData from "../game/PlayerData";
import { scenarios } from "./scenarios";

type InitFn = (opts: { scenario?: string; name?: string }) => { teardown: () => void };

export class DevControls {
   private container: HTMLDivElement;
   private select: HTMLSelectElement;
   private runBtn: HTMLButtonElement;
   private pauseBtn: HTMLButtonElement;
   private speedInput: HTMLInputElement;
   private teardown: (() => void) | null = null;

   constructor(private initGame: InitFn) {
      this.container = document.createElement("div");
      this.container.id = "dev-controls";
      Object.assign(this.container.style, {
         position: "absolute",
         top: "10px",
         left: "10px",
         padding: "8px",
         background: "rgba(0,0,0,0.6)",
         color: "#fff",
         fontFamily: 'Press Start 2P, monospace',
         fontSize: "12px",
         border: "1px solid #444",
         borderRadius: "6px",
         zIndex: "10000"
      } as CSSStyleDeclaration);

      const title = document.createElement("div");
      title.textContent = "Dev: Scenarios";
      title.style.marginBottom = "6px";
      this.container.appendChild(title);

      this.select = document.createElement("select");
      Object.keys(scenarios).forEach(name => {
         const opt = document.createElement("option");
         opt.value = name;
         opt.textContent = name;
         this.select.appendChild(opt);
      });
      this.container.appendChild(this.select);

      // Speed control
      const speedLabel = document.createElement("label");
      speedLabel.textContent = " speed";
      this.speedInput = document.createElement("input");
      this.speedInput.type = "range";
      this.speedInput.min = "0";
      this.speedInput.max = "3";
      this.speedInput.step = "0.25";
      this.speedInput.value = "1";
      this.speedInput.addEventListener("input", () => {
         const g: any = (window as any).game;
         if (g?.setSpeedMultiplier) g.setSpeedMultiplier(parseFloat(this.speedInput.value));
      });
      this.container.appendChild(this.speedInput);
      this.container.appendChild(speedLabel);

      this.runBtn = document.createElement("button");
      this.runBtn.textContent = "Run";
      Object.assign(this.runBtn.style, { marginLeft: "8px" });
      this.runBtn.addEventListener("click", () => this.runSelected());
      this.container.appendChild(this.runBtn);

      this.pauseBtn = document.createElement("button");
      this.pauseBtn.textContent = "Pause";
      Object.assign(this.pauseBtn.style, { marginLeft: "8px" });
      this.pauseBtn.addEventListener("click", () => this.togglePause());
      this.container.appendChild(this.pauseBtn);

      document.body.appendChild(this.container);
   }

   private runSelected() {
      const scenario = this.select.value;
      // ensure name is set so prompt is skipped
      if (!PlayerData.check()) {
         PlayerData.set(PlayerData.createDefaultData("Dev"));
      }
      if (this.teardown) this.teardown();
      const { teardown } = this.initGame({ scenario, name: "Dev" });
      this.teardown = teardown;
   }

   private togglePause() {
      const g: any = (window as any).game;
      if (!g) return;
      if (this.pauseBtn.textContent === "Pause") {
         g.pause?.();
         this.pauseBtn.textContent = "Resume";
      } else {
         g.resume?.();
         this.pauseBtn.textContent = "Pause";
      }
   }
}


