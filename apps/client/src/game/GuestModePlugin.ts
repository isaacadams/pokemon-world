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
      overlay.beginFill(0x000000, 0.7); // Darker overlay for more contrast
      overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      overlay.endFill();

      // Create the dialog box as a container (Pokémon-style with rounded corners)
      const dialogWidth = 320;
      const dialogHeight = 200;
      const dialog = new PIXI.Container();
      const dialogBg = new PIXI.Graphics();

      // Background with a subtle gradient
      dialogBg.beginFill(0xf5f5d5); // Creamier background
      dialogBg.lineStyle(6, 0x000000, 1); // Thicker outer black border
      dialogBg.drawRoundedRect(0, 0, dialogWidth, dialogHeight, 12);
      dialogBg.endFill();
      dialogBg.lineStyle(4, 0xffffff, 1); // Inner white border
      dialogBg.drawRoundedRect(3, 3, dialogWidth - 6, dialogHeight - 6, 10);
      dialogBg.lineStyle(2, 0x888888, 1); // Subtle gray inner outline for depth
      dialogBg.drawRoundedRect(5, 5, dialogWidth - 10, dialogHeight - 10, 8);
      dialogBg.beginFill(0xe0e0e0, 0.2); // Slight overlay for gradient effect
      dialogBg.drawRoundedRect(5, 5, dialogWidth - 10, dialogHeight - 10, 8);
      dialogBg.endFill();

      dialog.addChild(dialogBg);
      dialog.x = (this.app.screen.width - dialogWidth) / 2;
      dialog.y = (this.app.screen.height - dialogHeight) / 2;

      // Create a text input field (simulated with PIXI.Text and a background)
      const inputBg = new PIXI.Graphics();
      inputBg.beginFill(0xffffff); // White background for input
      inputBg.lineStyle(2, 0x000000, 1); // Black border
      inputBg.drawRoundedRect(0, 0, 200, 30, 6);
      inputBg.endFill();
      inputBg.x = (dialogWidth - 200) / 2;
      inputBg.y = 110;
      dialog.addChild(inputBg);

      // Simulated input text
      this.inputText = new PIXI.Text(this.inputValue || "Enter name", {
         fontFamily: "Press Start 2P",
         fontSize: 14,
         fill: this.inputValue ? 0x000000 : 0x888888,
         align: "center"
      });
      this.inputText.anchor.set(0.5);
      this.inputText.x = dialogWidth / 2;
      this.inputText.y = 125;
      dialog.addChild(this.inputText);

      // Create a Pokémon-style button
      const button = new PIXI.Graphics();
      button.beginFill(0xff4444); // Brighter red
      button.lineStyle(2, 0xffffff, 1);
      button.drawRoundedRect(0, 0, 120, 30, 6);
      button.endFill();
      button.beginFill(0xcc3333, 0.3);
      button.drawRoundedRect(0, 0, 120, 30, 6);
      button.endFill();
      button.x = (dialogWidth - 120) / 2;
      button.y = 150;
      dialog.addChild(button);

      // Button text
      const buttonText = new PIXI.Text("Start Game", {
         fontFamily: "Press Start 2P",
         fontSize: 14,
         fill: 0xffffff,
         align: "center",
         dropShadow: true,
         dropShadowColor: 0x000000,
         dropShadowDistance: 2,
         dropShadowAlpha: 0.7
      });
      buttonText.anchor.set(0.5);
      buttonText.x = 60;
      buttonText.y = 15;
      button.addChild(buttonText);

      // Add interactivity to the button
      button.interactive = true;
      //button.buttonMode = true;
      button.on("pointerover", () => {
         button.tint = 0xff7777;
      });
      button.on("pointerout", () => {
         button.tint = 0xffffff;
      });
      button.on("pointerdown", () => this.handleSubmit());

      // Create a container for the dialog
      this.dialogContainer = new PIXI.Container();
      this.dialogContainer.addChild(overlay, dialog);
      this.dialogContainer.alpha = 0;
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

      // Add keyboard event listeners for text input
      this.setupKeyboardInput();
   }

   private setupKeyboardInput(): void {
      window.addEventListener("keydown", (e: KeyboardEvent) => {
         if (!this.inputText) return;

         if (e.key === "Enter") {
            this.handleSubmit();
            return;
         }

         if (e.key === "Backspace") {
            this.inputValue = this.inputValue.slice(0, -1);
         } else if (e.key.length === 1 && this.inputValue.length < this.maxInputLength) {
            // Allow only alphanumeric characters
            if (/[a-zA-Z0-9]/.test(e.key)) {
               this.inputValue += e.key;
            }
         }

         // Update the displayed text
         this.inputText.text = this.inputValue || "Enter name";
         this.inputText.style.fill = this.inputValue ? 0x000000 : 0x888888; // Black for text, gray for placeholder
      });
   }

   private handleSubmit(): void {
      if (this.inputValue.trim()) {
         PlayerData.set(PlayerData.createDefaultData(this.inputValue));
         this.cleanupDialog();
      }
   }

   private cleanupDialog(): void {
      console.log("Cleaning up dialog...");
      if (this.dialogContainer) {
         this.app.stage.removeChild(this.dialogContainer);
         this.dialogContainer.destroy({ children: true });
         this.dialogContainer = null;
      }
      this.inputText = null;
      this.inputValue = "";
      if (!this.app.ticker.started) {
         console.log("Resuming game loop after dialog cleanup");
         this.app.ticker.start();
      }
      this.app.renderer.render(this.app.stage);
      console.log("Forced render after dialog cleanup");
   }
}
