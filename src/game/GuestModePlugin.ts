import * as PIXI from "pixi.js";
import { Game } from "./Game";
import PlayerData from "./PlayerData";

export class GuestModePlugin {
   private game: Game;
   private app: PIXI.Application;
   private dialogContainer: PIXI.Container | null = null;

   constructor(game: Game) {
      this.game = game;
      this.app = (game as any).app as PIXI.Application;
      console.log("GuestModePlugin initialized");
      this.checkUserDataAndPrompt();
   }

   private checkUserDataAndPrompt(): void {
      let userData = PlayerData.check();
      if (!userData) {
         this.showGuestModePrompt();
      } else {
         if (!this.app.ticker.started) {
            console.log("Starting ticker as no prompt is needed");
            this.app.ticker.start();
         }
      }
   }

   private showGuestModePrompt(): void {
      console.log("Showing guest mode prompt...");
      this.app.ticker.stop();

      // Create a translucent overlay
      const overlay = new PIXI.Graphics();
      overlay.beginFill(0x000000, 0.5);
      overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      overlay.endFill();

      // Create the dialog box (Pokémon-style)
      const dialogWidth = 320;
      const dialogHeight = 180;
      const dialog = new PIXI.Graphics();
      dialog.beginFill(0xf5f5d5, 0.95); // Light beige
      dialog.drawRect(0, 0, dialogWidth, dialogHeight);
      dialog.endFill();
      dialog.lineStyle(4, 0x000000, 1); // Outer black border
      dialog.drawRect(0, 0, dialogWidth, dialogHeight);
      dialog.lineStyle(2, 0xffffff, 1); // Inner white border
      dialog.drawRect(2, 2, dialogWidth - 4, dialogHeight - 4);
      dialog.x = (this.app.screen.width - dialogWidth) / 2;
      dialog.y = (this.app.screen.height - dialogHeight) / 2;

      // Add title text
      const title = new PIXI.Text("Guest Mode", {
         fontFamily: "Press Start 2P",
         fontSize: 20,
         fill: 0x000000,
         align: "center",
         dropShadow: true,
         dropShadowColor: 0xffffff,
         dropShadowDistance: 2,
         dropShadowAlpha: 0.5
      });
      title.anchor.set(0.5);
      title.x = dialogWidth / 2;
      title.y = 30;

      // Add instruction text
      const instruction = new PIXI.Text("Enter your name:", {
         fontFamily: "Press Start 2P",
         fontSize: 12,
         fill: 0x000000,
         align: "center",
         dropShadow: true,
         dropShadowColor: 0xffffff,
         dropShadowDistance: 1,
         dropShadowAlpha: 0.5
      });
      instruction.anchor.set(0.5);
      instruction.x = dialogWidth / 2;
      instruction.y = 65;

      // Create a DOM input field
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Enter name";
      input.style.position = "absolute";
      input.style.left = `${dialog.x + 60}px`;
      input.style.top = `${dialog.y + 85}px`;
      input.style.width = "200px";
      input.style.padding = "5px";
      input.style.fontFamily = "Press Start 2P";
      input.style.fontSize = "12px";
      input.style.border = "2px solid #000";
      input.style.backgroundColor = "#e0e0e0"; // Light gray to match Pokémon UI
      input.style.color = "#000";
      input.style.boxShadow = "inset 2px 2px 0px #888"; // Inset shadow for depth
      document.body.appendChild(input);

      // Create a Pokémon-style button
      const button = document.createElement("button");
      button.textContent = "Start Game";
      button.style.position = "absolute";
      button.style.left = `${dialog.x + 110}px`;
      button.style.top = `${dialog.y + 135}px`;
      button.style.padding = "5px 15px";
      button.style.fontFamily = "Press Start 2P";
      button.style.fontSize = "12px";
      button.style.background = "linear-gradient(to bottom, #ff6666, #cc3333)"; // Gradient for Pokémon button
      button.style.border = "2px solid #fff";
      button.style.color = "#fff";
      button.style.cursor = "pointer";
      button.style.boxShadow = "2px 2px 0px #000"; // Drop shadow for depth
      button.style.transition = "background 0.2s ease";
      button.onmouseover = () => {
         button.style.background = "linear-gradient(to bottom, #ff9999, #ff6666)";
      };
      button.onmouseout = () => {
         button.style.background = "linear-gradient(to bottom, #ff6666, #cc3333)";
      };
      document.body.appendChild(button);

      // Create a container for the dialog
      this.dialogContainer = new PIXI.Container();
      this.dialogContainer.addChild(overlay, dialog, title, instruction);
      this.dialogContainer.alpha = 0; // Start invisible for fade-in
      this.app.stage.addChild(this.dialogContainer);
      console.log("Dialog container added to stage");

      // Fade-in animation
      this.app.ticker.addOnce(() => {
         let alpha = 0;
         const fadeIn = () => {
            if (!this.dialogContainer) return;
            alpha += 0.05;
            this.dialogContainer.alpha = alpha;
            if (alpha < 1) this.app.ticker.addOnce(fadeIn);
         };
         fadeIn();
      });

      // Handle form submission
      const submitName = () => {
         const name = input.value.trim();
         if (name) {
            PlayerData.set(PlayerData.createDefaultData(name));
            this.cleanupDialog(input, button);
         }
      };

      button.onclick = submitName;
      input.onkeyup = e => {
         if (e.key === "Enter") submitName();
      };

      // Focus the input field
      input.focus();
   }

   private cleanupDialog(input: HTMLInputElement, button: HTMLButtonElement): void {
      console.log("Cleaning up dialog...");
      if (this.dialogContainer) {
         this.app.stage.removeChild(this.dialogContainer);
         this.dialogContainer.destroy({ children: true });
         this.dialogContainer = null;
      }
      document.body.removeChild(input);
      document.body.removeChild(button);
      if (!this.app.ticker.started) {
         console.log("Resuming game loop after dialog cleanup");
         this.app.ticker.start();
      }
      this.app.renderer.render(this.app.stage);
      console.log("Forced render after dialog cleanup");
   }
}
