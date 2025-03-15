import * as PIXI from "pixi.js";
import tileset from "@assets/tilesets/overworld.png";
import build from "@config/build";
import { Player } from "./Player";
import { SpriteController } from "./SpriteController";
import { PC } from "./PC";
import { TileMap } from "./TileMap";
import { DebugOverlay } from "./DebugOverlay";
import { RemotePlayerManager } from "./RemotePlayersManager";

interface Point {
   x: number;
   y: number;
}
interface Bounds {
   x: number;
   y: number;
   width: number;
   height: number;
}
interface CollisionBox {
   points: Point[];
   tiles: Point[];
   canWalk: boolean;
}

const GAME_CONSTANTS = {
   PLAYER_SIZE: 32,
   COLLISION_MARGIN: 8,
   WORLD_BOUNDS: { x: 0, y: 0, width: 32 * 30, height: 32 * 20 }
} as const;

export class Game {
   private app: PIXI.Application;
   private player!: Player;

   private pc!: PC;
   private gameContainer: PIXI.Container;
   private tileMap!: TileMap;
   private debugGraphics!: PIXI.Graphics;
   private debugMode: boolean = false;
   private verboseMode: boolean = false;
   private debugOverlay: DebugOverlay;
   private ws?: WebSocket;

   constructor() {
      console.log("Game constructor called");
      this.app = new PIXI.Application({
         width: window.innerWidth,
         height: window.innerHeight,
         backgroundColor: 0x000000,
         resizeTo: window
      });
      console.log("PIXI Application created");

      this.gameContainer = new PIXI.Container();
      this.app.stage.addChild(this.gameContainer);
      console.log("gameContainer added to stage");

      this.initializeGame();
      this.debugOverlay = new DebugOverlay(this.tileMap.getTileSize());
      this.gameContainer.addChild(this.debugOverlay.getContainer());
      console.log("DebugOverlay added to gameContainer");
   }

   setupWebSocket(controller: SpriteController): void {
      const manager = new RemotePlayerManager(this.gameContainer, controller);
      this.ws = new WebSocket(build.websocket);
      this.ws.onopen = () => console.log("Connected to WebSocket server");

      this.ws.onmessage = event => {
         const data = JSON.parse(event.data);

         switch (data.type) {
            case "init":
               this.player.id = data.id;
               console.log(`Assigned ID: ${this.player.id}`);
               break;
            case "players":
               for (const [id, state] of Object.entries(
                  data.players as { [key: string]: { id: string; position: { x: number; y: number } } }
               )) {
                  if (id !== this.player.id) manager.add(id, state.position.x, state.position.y);
               }
               break;
            case "join":
               if (data.id !== this.player.id) manager.add(data.id, data.x, data.y);
               break;
            case "update":
               if (data.id !== this.player.id) manager.update(data.id, data.x, data.y);
               break;
            case "leave":
               manager.remove(data.id);
               break;
         }
      };

      this.ws.onclose = () => console.log("Disconnected from WebSocket server");
   }

   private initializeGame(): void {
      this.initializeTileMap();
      this.initializePokemonCenter();
      this.initializeDebugGraphics();
      this.centerGameContainer();
   }

   private setupEventListeners(): void {
      window.addEventListener("resize", this.onResize.bind(this));
      this.app.ticker.add(this.gameLoop.bind(this));

      window.addEventListener("keydown", (e: KeyboardEvent) => {
         if (e.key === "`") {
            this.debugMode = !this.debugMode;
            this.debugGraphics.visible = this.debugMode;
            this.pc.setDebugMode(this.debugMode);
            this.tileMap.setDebugMode(this.debugMode);
            this.debugOverlay.setDebugMode(this.debugMode);
            console.log("Debug mode:", this.debugMode ? "enabled" : "disabled");
         }
         if (e.key === "v" && this.debugMode) {
            this.verboseMode = !this.verboseMode;
            this.tileMap.setVerboseMode(this.verboseMode);
            this.debugOverlay.setVerboseMode(this.verboseMode);
         }
      });
   }

   private initializeTileMap(): void {
      //console.log(tileset);
      //if (new URL(tileset)) {
      //}
      this.tileMap = new TileMap(tileset, 30, 20);
      this.gameContainer.addChild(this.tileMap.getContainer());
   }

   initializePlayer(controller: SpriteController): void {
      this.player = new Player(
         GAME_CONSTANTS.WORLD_BOUNDS.width / 2,
         GAME_CONSTANTS.WORLD_BOUNDS.height / 2,
         controller
      );
      this.gameContainer.addChild(this.player.sprite);
   }

   private initializePokemonCenter(): void {
      this.pc = new PC(100, 100, this.debugMode);
      this.gameContainer.addChild(this.pc.getInteractionZone());
      this.gameContainer.addChild(this.pc.sprite);
      this.app.stage.addChild(this.pc.getInterface());
   }

   private initializeDebugGraphics(): void {
      this.debugGraphics = new PIXI.Graphics();
      this.debugGraphics.visible = this.debugMode;
      this.gameContainer.addChild(this.debugGraphics);
   }

   public getPlayerPosition(): { x: number; y: number } {
      return { x: this.player.sprite.x, y: this.player.sprite.y };
   }

   private gameLoop(deltaTime: number): void {
      const nextPosition = this.player.getNextPosition(deltaTime);
      const collisionBox = this.calculateCollisionBox(nextPosition);

      if (collisionBox.canWalk) {
         const state = this.player.update(deltaTime);
         // Send position update to server
         if (state.isMoving && !!this.ws && this.ws.readyState === WebSocket.OPEN) {
            const update = JSON.stringify({
               type: "update",
               id: this.player.id,
               x: this.player.sprite.x,
               y: this.player.sprite.y
            });

            this.ws.send(update);
         }
      }

      this.updatePCInteraction();
      this.updateDebug(nextPosition, collisionBox);
      // Update player position in debug overlay
      this.debugOverlay.updatePlayerPosition(this.player.sprite.x, this.player.sprite.y);
   }

   private updatePCInteraction(): void {
      const isInRange = this.pc.isPlayerInRange(this.player.getBounds());
      this.pc.getInteractionZone().alpha = isInRange ? 0.3 : 0;
      this.pc.update(0); // Update PC state
   }

   private updateDebug(position: Point, collisionBox: CollisionBox): void {
      if (!this.debugMode) {
         this.debugGraphics.clear();
         return;
      }

      this.debugGraphics.clear();
      this.drawTileGrid();
      this.drawCollisionBox(collisionBox);
      this.debugOverlay.update(
         {
            x: position.x,
            y: position.y,
            width: GAME_CONSTANTS.PLAYER_SIZE / 2,
            height: GAME_CONSTANTS.PLAYER_SIZE / 2
         },
         this.tileMap.getTiles()
      );

      if (this.debugMode && this.verboseMode) {
         console.log({
            position: `(${position.x}, ${position.y})`,
            tiles: collisionBox.tiles,
            canWalk: collisionBox.canWalk
         });
      }
   }

   private calculateCollisionBox(position: Point): CollisionBox {
      const spriteLeft = position.x - GAME_CONSTANTS.PLAYER_SIZE / 2;
      const spriteTop = position.y - GAME_CONSTANTS.PLAYER_SIZE / 2;

      // Calculate collision points
      const points = [
         {
            x: spriteLeft + GAME_CONSTANTS.COLLISION_MARGIN,
            y: spriteTop + GAME_CONSTANTS.COLLISION_MARGIN
         },
         {
            x: spriteLeft + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN,
            y: spriteTop + GAME_CONSTANTS.COLLISION_MARGIN
         },
         {
            x: spriteLeft + GAME_CONSTANTS.COLLISION_MARGIN,
            y: spriteTop + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN
         },
         {
            x: spriteLeft + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN,
            y: spriteTop + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN
         }
      ];

      // Convert points to tile coordinates
      const tiles = points.map(point => ({
         x: Math.floor(point.x / this.tileMap.getTileSize()),
         y: Math.floor(point.y / this.tileMap.getTileSize())
      }));

      // Check if all tiles are walkable
      const canWalk =
         this.isWithinBounds(position) && tiles.every(tile => this.tileMap.isTileWalkable(tile.x, tile.y));

      return { points, tiles, canWalk };
   }

   private drawTileGrid(): void {
      const tileSize = this.tileMap.getTileSize();
      const mapWidth = Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.width / tileSize);
      const mapHeight = Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.height / tileSize);

      for (let y = 0; y < mapHeight; y++) {
         for (let x = 0; x < mapWidth; x++) {
            const isWalkable = this.tileMap.isTileWalkable(x, y);
            this.debugGraphics.lineStyle(1, isWalkable ? 0x00ff00 : 0xff0000, 0.3);
            this.debugGraphics.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
         }
      }
   }

   private drawCollisionBox(collisionBox: CollisionBox): void {
      // Draw collision box outline
      this.debugGraphics.lineStyle(2, collisionBox.canWalk ? 0x00ff00 : 0xff0000, 1);

      // Draw lines between points
      const { points } = collisionBox;
      this.debugGraphics.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => {
         this.debugGraphics.lineTo(point.x, point.y);
      });
      this.debugGraphics.lineTo(points[0].x, points[0].y);

      // Draw collision points
      points.forEach(point => {
         this.debugGraphics.beginFill(0xffff00);
         this.debugGraphics.drawCircle(point.x, point.y, 2);
         this.debugGraphics.endFill();
      });

      // Draw sprite center point
      const centerX = points[0].x + (points[1].x - points[0].x) / 2;
      const centerY = points[0].y + (points[2].y - points[0].y) / 2;
      this.debugGraphics.beginFill(0x00ffff);
      this.debugGraphics.drawCircle(centerX, centerY, 2);
      this.debugGraphics.endFill();
   }

   private isWithinBounds(position: Point): boolean {
      const margin = GAME_CONSTANTS.PLAYER_SIZE / 2;
      const bounds = GAME_CONSTANTS.WORLD_BOUNDS;
      return (
         position.x >= bounds.x + margin &&
         position.x <= bounds.width - margin &&
         position.y >= bounds.y + margin &&
         position.y <= bounds.height - margin
      );
   }

   private centerGameContainer(): void {
      this.gameContainer.x = (window.innerWidth - GAME_CONSTANTS.WORLD_BOUNDS.width) / 2;
      this.gameContainer.y = (window.innerHeight - GAME_CONSTANTS.WORLD_BOUNDS.height) / 2;
   }

   private onResize(): void {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this.centerGameContainer();
   }

   public render(): void {
      const gameContainer = document.getElementById("game-container");

      if (gameContainer) {
         gameContainer.appendChild(this.app.view as HTMLCanvasElement);
         console.log("PixiJS canvas appended to game-container");
         this.app.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
         console.log("Renderer resized to container dimensions");
      } else {
         console.error("game-container element not found in DOM");
      }

      // Force an initial render to ensure the canvas displays
      //(this as any).app.renderer.render((this as any).app.stage);
      //console.log("Forced initial render");
   }

   public start(): void {
      this.setupEventListeners();

      // Ensure the ticker is running
      if (!this.app.ticker.started) {
         console.log("Starting ticker in constructor");
         this.app.ticker.start();
      }
   }
}
