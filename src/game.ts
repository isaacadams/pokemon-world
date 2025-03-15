import "./styles.css";
import { Game } from "./game/Game";
import { GuestModePlugin } from "./game/GuestModePlugin";

window.onload = () => {
   console.log("window.onload triggered");
   const game = new Game();
   (window as any).game = game;
   console.log("Game instance created");
   new GuestModePlugin(game);
   game.start();
   console.log("Game.start() called");
   // Force an initial render to ensure the canvas displays
   (game as any).app.renderer.render((game as any).app.stage);
   console.log("Forced initial render");
};
