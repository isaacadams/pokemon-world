import "./styles.css";
import { Game } from "./game/Game";
import PlayerData from "./game/PlayerData";
import { GuestModePlugin } from "./game/GuestModePlugin";
import { SpriteCache } from "./game/SpriteController";
import { DevControls } from "./dev/DevControls";
import { scenarios as devScenarios } from "./dev/scenarios";

const cache = new SpriteCache();

function initializeGame(opts: { scenario?: string; name?: string } = {}) {
   const container = document.getElementById("game-container")!;
   container.innerHTML = "";

   const game = new Game();
   (window as any).game = game;

   const earlyName = opts.name || new URLSearchParams(window.location.search).get("name");
   if (earlyName && !PlayerData.check()) {
      PlayerData.set(PlayerData.createDefaultData(earlyName));
   }

   new GuestModePlugin(game);
   game.render();

   cache.load().then(c => {
      game.initializePlayer(c.player);
      game.setupWebSocket(c.player);
      game.start();
      game.render();

      const scenario = opts.scenario || new URLSearchParams(window.location.search).get("scenario") || undefined;
      const slow = new URLSearchParams(window.location.search).get("slow");
      if (scenario && devScenarios[scenario]) {
         const scale = slow ? 2 : 1;
         devScenarios[scenario].inputs.forEach(evt => {
            setTimeout(() => {
               const type = evt.action === "press" ? "keydown" : "keyup";
               const e = new KeyboardEvent(type, { key: evt.key });
               window.dispatchEvent(e);
            }, evt.time * scale);
         });
      }
   });

   const teardown = () => {
      try {
         (game as any).app.ticker.stop();
         (game as any).app.destroy(true, { children: true });
      } catch {}
      container.innerHTML = "";
   };

   return { teardown };
}

window.onload = () => {
   // Always show DevControls in this page
   const initial = initializeGame({ name: "Dev" });
   (window as any).teardownGame = initial.teardown;
   new DevControls(({ scenario, name }) => {
      const t = (window as any).teardownGame as () => void;
      if (t) t();
      const next = initializeGame({ scenario, name });
      (window as any).teardownGame = next.teardown;
      return next;
   });
};


