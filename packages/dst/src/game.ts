import { Application, Container } from "pixi.js";
import { TileMap } from "@repo/core";

const app = new Application({
   width: window.innerWidth,
   height: window.innerHeight,
   backgroundColor: 0x000000,
   resizeTo: window
});

// Load map data (replace with your actual map data)
import tilesetImagePath from "url:./assets/overworld.png";
import tilesetTmxPath from "url:./assets/overworld.tmx";
import map1Data from "url:./assets/map1.tmx";

const WORLD_BOUNDS = { x: 0, y: 0, width: 32 * 30, height: 32 * 20 };
const gameContainer = new Container();
app.stage.addChild(gameContainer);

gameContainer.x = (window.innerWidth - WORLD_BOUNDS.width) / 2;
gameContainer.y = (window.innerHeight - WORLD_BOUNDS.height) / 2;

Promise.all([fetch(tilesetTmxPath).then(r => r.text()), fetch(map1Data).then(r => r.text())]).then(
   ([tmxTS, tmxMap]) => {
      const tileMap = new TileMap(tilesetImagePath, tmxTS, tmxMap);
      gameContainer.addChild(tileMap.getContainer());
      (window as any).tileMap = tileMap;
   }
);

// Add deterministic simulation logic here (e.g., GameSimulator)
console.log("Game initialized for DST");

const gameDiv = document.getElementById("gameCanvas");
gameDiv?.appendChild(app.view as HTMLCanvasElement);
app.renderer.resize(gameDiv?.clientWidth ?? 0, gameDiv?.clientHeight ?? 0);

(window as any).app = app;
//app.ticker.start();
//this.app.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
