import * as PIXI from "pixi.js";

export class PC {
   public sprite: PIXI.Sprite;
   private isOpen: boolean = false;
   private interface: PIXI.Container;
   private interactionZone: PIXI.Graphics;
   private interactionDistance: number = 100;
   private canInteract: boolean = false;
   private debugText: PIXI.Text;
   private debugMode: boolean;

   constructor(x: number, y: number, debugMode: boolean = false) {
      this.debugMode = debugMode;

      // Create a blue rectangle for the PC
      const texture = PIXI.Texture.WHITE;
      this.sprite = new PIXI.Sprite(texture);
      this.sprite.width = 48;
      this.sprite.height = 48;
      this.sprite.tint = 0x0000ff;
      this.sprite.x = x;
      this.sprite.y = y;

      // Create interaction zone
      this.interactionZone = new PIXI.Graphics();
      this.interactionZone.lineStyle(2, 0xffffff, 0.5);
      this.interactionZone.drawCircle(0, 0, this.interactionDistance);
      this.interactionZone.x = x + this.sprite.width / 2;
      this.interactionZone.y = y + this.sprite.height / 2;
      this.interactionZone.alpha = 0;

      // Create debug text (only visible in debug mode)
      this.debugText = new PIXI.Text("", {
         fontFamily: "Arial",
         fontSize: 10,
         fill: "white",
         stroke: "black",
         strokeThickness: 2
      });
      this.debugText.x = x;
      this.debugText.y = y + 60;
      this.debugText.visible = this.debugMode;
      this.sprite.addChild(this.debugText);

      // Create the PC interface container (initially hidden)
      this.interface = new PIXI.Container();
      this.interface.visible = false;

      // Create a background for the PC interface
      const background = new PIXI.Graphics();
      background.beginFill(0x333333, 0.9);
      background.drawRect(0, 0, 600, 400);
      background.endFill();
      this.interface.addChild(background);

      // Add title text
      const style = new PIXI.TextStyle({
         fontFamily: "Arial",
         fontSize: 24,
         fill: "white"
      });
      const title = new PIXI.Text("Pokémon Storage System", style);
      title.x = 20;
      title.y = 20;
      this.interface.addChild(title);

      // Add interaction hint text
      const hintStyle = new PIXI.TextStyle({
         fontFamily: "Arial",
         fontSize: 12,
         fill: "white",
         stroke: "black",
         strokeThickness: 2
      });
      const hint = new PIXI.Text("Press E to interact", hintStyle);
      hint.x = -hint.width / 2;
      hint.y = -40;
      this.sprite.addChild(hint);

      // Center the interface on screen
      this.interface.x = (window.innerWidth - this.interface.width) / 2;
      this.interface.y = (window.innerHeight - this.interface.height) / 2;

      // Add keyboard listeners
      window.addEventListener("keydown", (e: KeyboardEvent) => {
         if (e.key.toLowerCase() === "e" && this.canInteract && !this.isOpen) {
            if (this.debugMode) console.log("E pressed, canInteract:", this.canInteract);
            this.interact();
         } else if (e.key === "Escape" && this.isOpen) {
            this.closeInterface();
         }
      });
   }

   public setDebugMode(enabled: boolean): void {
      this.debugMode = enabled;
      this.debugText.visible = enabled;
      if (!enabled) {
         this.interactionZone.alpha = 0;
      }
   }

   public isPlayerInRange(playerBounds: PIXI.Rectangle): boolean {
      const pcCenter = {
         x: this.sprite.x + this.sprite.width / 2,
         y: this.sprite.y + this.sprite.height / 2
      };

      const playerCenter = {
         x: playerBounds.x - this.sprite.parent.x,
         y: playerBounds.y - this.sprite.parent.y
      };

      const distance = Math.sqrt(
         Math.pow(pcCenter.x - playerCenter.x, 2) + Math.pow(pcCenter.y - playerCenter.y, 2)
      );

      this.canInteract = distance <= this.interactionDistance;
      // Update debug text
      if (this.debugMode) {
         this.debugText.text = `Distance: ${Math.round(distance)}
PC: ${Math.round(pcCenter.x)},${Math.round(pcCenter.y)}
Player: ${Math.round(playerCenter.x)},${Math.round(playerCenter.y)}
CanInteract: ${this.canInteract}`;
      }

      // Only show interaction zone when in range and not in debug mode
      this.interactionZone.alpha = this.canInteract && !this.debugMode ? 0.3 : 0;

      return this.canInteract;
   }

   public getInteractionZone(): PIXI.Graphics {
      return this.interactionZone;
   }

   public interact(): void {
      if (!this.isOpen) {
         if (this.debugMode) console.log("Opening interface");
         this.openInterface();
      }
   }

   private openInterface(): void {
      this.isOpen = true;
      this.interface.visible = true;

      // Add close button functionality
      const closeButton = new PIXI.Text("X", {
         fontFamily: "Arial",
         fontSize: 20,
         fill: "white"
      });
      closeButton.x = this.interface.width - 30;
      closeButton.y = 10;
      closeButton.eventMode = "static";
      closeButton.cursor = "pointer";
      closeButton.on("pointerdown", () => this.closeInterface());
      this.interface.addChild(closeButton);
   }

   private closeInterface(): void {
      this.isOpen = false;
      this.interface.visible = false;
      // Remove the close button to prevent duplicates
      if (this.interface.children.length > 2) {
         // Background and title are first two children
         this.interface.removeChild(this.interface.children[this.interface.children.length - 1]);
      }
   }

   public update(delta: number): void {
      // Add any animation or update logic here
   }

   public getInterface(): PIXI.Container {
      return this.interface;
   }
}
