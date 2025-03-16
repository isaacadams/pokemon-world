import { JSDOM } from "jsdom";
import { Canvas } from "canvas";
import { Application, Assets } from "pixi.js";
import { TileMap } from "@repo/core";
import * as fs from "fs";
import * as path from "path";

// Load map data (replace with your actual map data)
import map1Data from "../../apps/client/src/assets/tilesets/map1.tmx";
const tilesetImagePath = path.resolve(__dirname, "../../apps/client/src/assets/tilesets/overworld.png");
const tilesetTmxPath = path.resolve(__dirname, "../../apps/client/src/assets/tilesets/overworld.tmx");

// Disable workers in Pixi.js to avoid the Worker error

// Set up a virtual DOM for Pixi.js
const dom = new JSDOM("<!DOCTYPE html><body></body>", { pretendToBeVisual: true });
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Create a canvas for rendering
const canvas = new Canvas(800, 600);

// Initialize Pixi.js app
const app = new Application({
   width: 800,
   height: 600,
   backgroundColor: 0x1099bb,
   forceCanvas: true, // Use canvas renderer in Node.js
   autoStart: false
});

// Add TileMap

const tileMap = new TileMap(tilesetImagePath, tilesetTmxPath, map1Data);
app.stage.addChild(tileMap.getContainer());

// Render and save the output
app.render();
const out = fs.createWriteStream("./dst-output.png");
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on("finish", () => console.log("DST output saved as dst-output.png"));
