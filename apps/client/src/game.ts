import "./styles.css";
import { Game } from "./game/Game";
import { GuestModePlugin } from "./game/GuestModePlugin";
import { SpriteCache } from "./game/SpriteController";

const cache = new SpriteCache();

window.onload = () => {
   console.log("window.onload triggered");
   const game = new Game();
   (window as any).game = game;
   console.log("Game instance created");

   new GuestModePlugin(game);

   game.render();

   cache.load().then(c => {
      game.initializePlayer(c.player);
      game.setupWebSocket(c.player);

      game.start();
      console.log("Game.start() called");
      game.render();
   });
};
