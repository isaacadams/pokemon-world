import { JSDOM } from "jsdom";
import { Canvas } from "canvas";
import { Application, Assets } from "pixi.js";
import * as fs from "fs";
import * as path from "path";
import { GameSimulator } from "./index"; // Assuming this exists

// Disable workers

// Set up virtual DOM
const dom = new JSDOM("<!DOCTYPE html><body></body>", { pretendToBeVisual: true });
global.document = dom.window.document;
global.navigator = dom.window.navigator;

const canvas = new Canvas(800, 600);
const app = new Application({
   width: 800,
   height: 600,
   backgroundColor: 0x1099bb,
   forceCanvas: true,
   autoStart: false
});

// Load map data
import map1Data from "@assets/tilesets/map1.tmx";

// Initialize simulator
const simulator = new GameSimulator("test-seed", { character: { x: 0, y: 0 } });
simulator.run(1000, 16); // Run 1000ms at 60 FPS
app.stage.addChild(simulator.getState().tileMap.getContainer());

// Render and save
app.render();
const out = fs.createWriteStream("./dst-output");
