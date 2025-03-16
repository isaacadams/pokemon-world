import PlayerData from "./game/PlayerData";
import "./styles.css";
import * as PIXI from "pixi.js";

class IntroScreen {
   private app: PIXI.Application;
   private pokemon1!: PIXI.Sprite;
   private pokemon2!: PIXI.Sprite;
   private phase: "approach" | "stop" | "hop" | "pounce" | "walk" | "waiting" = "approach";
   private hopCount: number = 0;
   private menuShown: boolean = false;
   private menuBounds = { width: 600, height: 400 };

   constructor() {
      this.app = new PIXI.Application({
         width: window.innerWidth,
         height: window.innerHeight,
         backgroundColor: 0x000000,
         resizeTo: window
      });

      document.getElementById("loading-canvas")!.appendChild(this.app.view as HTMLCanvasElement);
      this.loadAssets();
   }

   private async loadAssets(): Promise<void> {
      PIXI.Assets.add({
         alias: "charizard",
         src: "https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen7x/regular/charizard.png"
      });
      PIXI.Assets.add({
         alias: "pikachu",
         src: "https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen7x/regular/pikachu.png"
      });
      const resources = await PIXI.Assets.load(["charizard", "pikachu"]);
      this.setupAnimation(resources);
   }

   private setupAnimation(resources: Record<string, PIXI.Texture>): void {
      this.pokemon1 = new PIXI.Sprite(resources["charizard"]);
      this.pokemon2 = new PIXI.Sprite(resources["pikachu"]);

      this.pokemon1.scale.set(2);
      this.pokemon2.scale.set(2);

      this.pokemon1.x = -this.pokemon1.width;
      this.pokemon1.y = this.app.screen.height / 2;
      this.pokemon2.x = this.app.screen.width;
      this.pokemon2.y = this.app.screen.height / 2;

      this.app.stage.addChild(this.pokemon1, this.pokemon2);
      this.app.render(); // Force initial render
      this.app.ticker.add(delta => this.update(delta));
   }

   private update(delta: number): void {
      const menuX = (this.app.screen.width - this.menuBounds.width) / 2;
      const menuY = (this.app.screen.height - this.menuBounds.height) / 2;

      switch (this.phase) {
         case "approach":
            this.pokemon1.x += 10 * delta;
            this.pokemon2.x -= 10 * delta;
            if (Math.abs(this.pokemon1.x - this.pokemon2.x) < 300) {
               console.log("Switching to stop phase");
               this.phase = "stop";
            }
            break;

         case "stop":
            console.log("In stop phase, waiting 500ms");
            setTimeout(() => {
               console.log("Stop timeout complete, switching to hop");
               this.phase = "hop";
               this.hopCount = 0;
            }, 500);
            this.phase = "waiting";
            break;

         case "hop":
            if (this.hopCount < 3) {
               console.log(`Hop ${this.hopCount + 1}`);
               this.pokemon1.x += 20;
               this.pokemon2.x -= 20;
               this.hopCount++;
               setTimeout(() => {
                  console.log("Hop timeout complete");
                  this.phase = "hop";
               }, 300);
               this.phase = "waiting";
            } else {
               console.log("Hops complete, switching to pounce");
               this.phase = "pounce";
            }
            break;

         case "pounce":
            this.pokemon1.x += 5 * delta;
            this.pokemon1.y -= 10 * delta;
            this.pokemon2.x -= 5 * delta;
            this.pokemon2.y -= 10 * delta;

            if (this.pokemon1.y < this.app.screen.height / 4) {
               console.log("Pounce complete, switching to walk");
               this.phase = "walk";
               this.pokemon1.x = menuX + 50;
               this.pokemon1.y = menuY + this.menuBounds.height - this.pokemon1.height - 20;
               this.pokemon2.x = menuX + this.menuBounds.width - this.pokemon2.width - 50;
               this.pokemon2.y = menuY + this.menuBounds.height - this.pokemon2.height - 20;
               if (!this.menuShown) {
                  console.log("Triggering menu show");
                  setTimeout(() => {
                     this.showMenu();
                     console.log("Menu show called");
                  }, 1000); // Increased delay to 1s
                  this.menuShown = true;
               }
            }
            break;

         case "walk":
            this.pokemon1.x += 2 * delta;
            this.pokemon2.x -= 2 * delta;

            if (this.pokemon1.x < menuX + 20) this.pokemon1.x = menuX + 20;
            if (this.pokemon1.x > menuX + this.menuBounds.width - this.pokemon1.width - 20)
               this.pokemon1.x = menuX + this.menuBounds.width - this.pokemon1.width - 20;
            if (this.pokemon2.x < menuX + 20) this.pokemon2.x = menuX + 20;
            if (this.pokemon2.x > menuX + this.menuBounds.width - this.pokemon2.width - 20)
               this.pokemon2.x = menuX + this.menuBounds.width - this.pokemon2.width - 20;
            break;
      }
      this.app.render(); // Force render each frame
   }

   private showMenu(): void {
      const mainMenu = document.getElementById("main-menu");
      if (mainMenu) {
         console.log("Starting fade-out of loading overlay");
         let alpha = 1;
         const fadeOut = (delta: number) => {
            alpha -= 0.05 * delta;
            console.log(`Fading overlay, opacity: ${alpha}`);
            if (alpha <= 0) {
               console.log("Fade-out complete, showing main menu");
               mainMenu.style.display = "flex";
               this.app.ticker.remove(fadeOut);
               this.setupLoginButtons();
            }
         };
         this.app.ticker.add(fadeOut);
      } else {
         console.error("Loading overlay or main menu not found");
      }
   }

   private setupLoginButtons(): void {
      document.getElementById("slack-login")!.addEventListener("click", () => {
         const clientId = "618968880548.8580073800295";

         const redirectUri = window.location.origin + "/callback.html";
         const scope = "identity.basic identity.email identity.avatar";
         window.location.href = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      });

      document.getElementById("guest-login")!.addEventListener("click", () => {
         PlayerData.clear();
         window.location.href = "/game.html";
      });
   }
}

new IntroScreen();
