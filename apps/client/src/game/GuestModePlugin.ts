import * as PIXI from "pixi.js";
import { Game } from "./Game";
import PlayerData from "./PlayerData";

export class GuestModePlugin {
   private game: Game;
   private app: PIXI.Application;
   private dialogContainer: PIXI.Container | null = null;
   private inputText: PIXI.Text | null = null;
   private inputValue: string = "";
   private maxInputLength: number = 12; // Limit name length to 12 characters
   private htmlInput: HTMLInputElement | null = null;
   private htmlButton: HTMLButtonElement | null = null;
   private htmlDialog: HTMLDivElement | null = null;

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
      // Only use accessible HTML overlay
      this.createHtmlOverlay();
   }

   private setupKeyboardInput(): void {}

   private handleSubmit(): void {
      const value = (this.htmlInput?.value ?? this.inputValue).trim();
      if (value) {
         PlayerData.set(PlayerData.createDefaultData(value));
         this.cleanupDialog();
      }
   }

   private cleanupDialog(): void {
      console.log("Cleaning up dialog...");
      // Remove any PIXI container if present (legacy)
      if (this.dialogContainer) {
         this.app.stage.removeChild(this.dialogContainer);
         this.dialogContainer.destroy({ children: true });
         this.dialogContainer = null;
      }
      this.inputText = null;
      this.inputValue = "";
      if (this.htmlInput) {
         this.htmlInput.remove();
         this.htmlInput = null;
      }
      if (this.htmlButton) {
         this.htmlButton.remove();
         this.htmlButton = null;
      }
      if (this.htmlDialog) {
         this.htmlDialog.remove();
         this.htmlDialog = null;
      }
      if (!this.app.ticker.started) {
         console.log("Resuming game loop after dialog cleanup");
         this.app.ticker.start();
      }
      this.app.renderer.render(this.app.stage);
      console.log("Forced render after dialog cleanup");
   }

   private createHtmlOverlay(): void {
      // Position over canvas center with a simple dialog box
      const container = document.getElementById("game-container") || document.body;
      const dialog = document.createElement("div");
      Object.assign(dialog.style, {
         position: "absolute",
         top: "50%",
         left: "50%",
         transform: "translate(-50%, -50%)",
         zIndex: "9999",
         width: "320px",
         padding: "16px",
         background: "#f5f5d5",
         border: "6px solid #000",
         boxShadow: "inset 0 0 0 4px #fff, inset 0 0 0 6px #888",
         borderRadius: "12px",
         textAlign: "center"
      } as CSSStyleDeclaration);

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Enter name";
      input.maxLength = this.maxInputLength;
      input.value = this.inputValue;
      Object.assign(input.style, {
         width: "200px",
         padding: "8px 10px",
         fontFamily: 'Press Start 2P, monospace',
         fontSize: "14px",
         textAlign: "center",
         border: "2px solid #000",
         borderRadius: "6px",
         background: "#fff",
         outline: "none",
         marginBottom: "12px"
      } as CSSStyleDeclaration);

      const button = document.createElement("button");
      button.textContent = "Start Game";
      Object.assign(button.style, {
         padding: "6px 12px",
         border: "2px solid #fff",
         borderRadius: "6px",
         background: "#ff4444",
         color: "#fff",
         cursor: "pointer",
         fontFamily: 'Press Start 2P, monospace',
         fontSize: "14px"
      } as CSSStyleDeclaration);

      input.addEventListener("input", () => {
         this.inputValue = input.value;
         if (this.inputText) {
            this.inputText.text = this.inputValue || "Enter name";
            (this.inputText.style as any).fill = this.inputValue ? 0x000000 : 0x888888;
         }
      });
      input.addEventListener("keydown", e => {
         if (e.key === "Enter") this.handleSubmit();
         e.stopPropagation();
      });
      button.addEventListener("click", () => this.handleSubmit());

      dialog.appendChild(input);
      dialog.appendChild(button);
      container.appendChild(dialog);
      input.focus();

      this.htmlInput = input;
      this.htmlButton = button;
      this.htmlDialog = dialog as HTMLDivElement;
   }
}
