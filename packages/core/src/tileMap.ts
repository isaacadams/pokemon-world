import * as PIXI from "pixi.js";
import { overworld, SpriteTile, TileSetFactory } from "./overworld";

interface TmxLayer {
   data: number[];
   width: number;
   height: number;
}

export class TileMap {
   private container: PIXI.Container;
   private tileSize: number;
   private tilesetTexture: PIXI.BaseTexture;
   private tiles: PIXI.Sprite[][][] = [];

   private xTiles: SpriteTile[][][];

   private layers: PIXI.Container[] = [];
   private debugMode: boolean = false;
   private verboseMode: boolean = false;
   private tilesetConfig: TileSet;

   private hoverDebugGraphics: PIXI.Graphics | undefined;
   private hoverDebugText: PIXI.Text | undefined;

   constructor(tilesImagePath: string, tilesTmxPath: string, mapTmxPath: string) {
      //console.log([tilesImagePath, tilesTmxPath, mapTmxPath]);
      this.tilesetConfig = new TileSet(tilesTmxPath);
      this.tilesetTexture = PIXI.BaseTexture.from(tilesImagePath);

      const factory = new TileSetFactory(this.tilesetTexture, 32);
      overworld(factory);

      this.container = new PIXI.Container();
      this.tileSize = 32;
      console.log("is tile set png valid? ", this.tilesetTexture.valid);

      // debugging when hovering over tiles (gated by debugMode)
      this.hoverDebugGraphics = new PIXI.Graphics();
      this.hoverDebugGraphics.visible = false;
      this.hoverDebugText = new PIXI.Text("Debug Mode Off", {
         fontFamily: "Arial",
         fontSize: 16,
         fill: 0x00ffff,
         stroke: 0x000000,
         strokeThickness: 2
      });
      this.hoverDebugText.x = 10;
      this.hoverDebugText.y = 675;
      this.hoverDebugText.visible = false;

      //if (!this.tileset.valid) {
      //   console.error("failed");
      //}

      const parser = new DOMParser();
      const tmx = parser.parseFromString(mapTmxPath, "text/xml");
      const layerElements = tmx.getElementsByTagName("layer");

      this.xTiles = [];

      for (let i = 0; i < layerElements.length; i++) {
         const layer = layerElements[i];
         const layerContainer = new PIXI.Container();
         this.layers.push(layerContainer);
         this.container.addChild(layerContainer);

         const dataElement = layer.getElementsByTagName("data")[0];
         const tileIds = dataElement
            .textContent!.trim()
            .split(",")
            .map(id => parseInt(id.trim()));

         const width = parseInt(layer.getAttribute("width")!);
         const height = parseInt(layer.getAttribute("height")!);
         console.assert(tileIds.length === width * height, "count of tiles should match dimensions");

         this.tiles[i] = Array(height)
            .fill(null)
            .map(() => Array(width).fill(null));

         this.xTiles[i] = Array(height)
            .fill(null)
            .map(() => Array(width).fill(null));

         for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
               const tileId = tileIds[y * width + x];
               if (tileId === 0) continue;

               const cached = factory.tiles.get(tileId - 1);
               if (!cached) {
                  console.log(`missing: `, tileId - 1);
               }

               const spriteTile = cached!.sprite(i, x, y); // new PIXI.Sprite(cached!.texture);
               //spriteTile.x = x * this.tileSize;
               //spriteTile.y = y * this.tileSize;

               spriteTile.sprite.eventMode = "static";
               spriteTile.sprite.on("pointerover", _ => {
                  if (!this.debugMode || !this.hoverDebugGraphics || !this.hoverDebugText) return;
                  this.hoverDebugGraphics.clear();
                  this.hoverDebugGraphics.lineStyle(2, 0xff0000, 0.8);
                  this.hoverDebugGraphics.drawRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                  this.hoverDebugText.visible = true;
                  this.hoverDebugText.text = `x:${x}, y:${y}\ntile id: ${tileId - 1}`;
               });
               spriteTile.sprite.on("pointerleave", _ => {
                  if (!this.hoverDebugGraphics || !this.hoverDebugText) return;
                  this.hoverDebugGraphics.clear();
                  if (!this.debugMode) {
                     this.hoverDebugText.visible = false;
                  } else {
                     this.hoverDebugText.text = "";
                  }
               });

               this.tiles[i][y][x] = spriteTile.sprite;
               layerContainer.addChild(spriteTile.sprite);
               this.xTiles[i][y][x] = spriteTile;
            }
         }
      }

      this.container.addChild(this.hoverDebugGraphics, this.hoverDebugText);
   }

   public getContainer(): PIXI.Container {
      return this.container;
   }

   public getTiles(): PIXI.Sprite[][][] {
      return this.tiles;
   }

   public isTileWalkable(x: number, y: number): boolean {
      if (y < 0 || y >= this.tiles[0].length || x < 0 || x >= this.tiles[0][y].length) {
         return false;
      }

      for (let layer = 0; layer < this.tiles.length; layer++) {
         const tile = this.xTiles[layer][y][x];
         if (!tile) continue;
         // If any layer marks the tile impassable, block walking
        if (tile.tile.config.impassable) {
           return false;
        }
      }
      return true;
   }

   public setDebugMode(enabled: boolean): void {
      this.debugMode = enabled;
      if (this.verboseMode) {
         console.log(`TileMap debug mode ${enabled ? "enabled" : "disabled"}`);
      }
      if (this.hoverDebugGraphics && this.hoverDebugText) {
         this.hoverDebugGraphics.visible = enabled;
         this.hoverDebugGraphics.clear();
         this.hoverDebugText.visible = enabled;
         this.hoverDebugText.text = enabled ? "" : "Debug Mode Off";
      }
   }

   public setVerboseMode(enabled: boolean): void {
      this.verboseMode = enabled;
   }

   public getTileSize(): number {
      return this.tileSize;
   }

   public getWorldWidth(): number {
      return this.tiles[0]?.length * this.tileSize || 0;
   }

   public getWorldHeight(): number {
      return this.tiles.length * this.tileSize || 0;
   }
}

class TileSet {
   tmx: Document;

   constructor(file: string) {
      const parser = new DOMParser();
      this.tmx = parser.parseFromString(file, "text/xml");
   }

   getElement(id: number) {
      return this.tmx.querySelector(`tile[id="${id}"]`);
   }
}

class TileElement {
   private _impassable: boolean = false;

   constructor(
      public id: number,
      private element: Element
   ) {}

   impassable() {
      if (this._impassable) return true;
      if (this.property("impassable") === "true") {
         this._impassable = true;
         return true;
      }
      return false;
   }

   property(name: string) {
      const prop = this.element.querySelector(`property[name="${name}"]`);
      return prop?.getAttribute("value");
   }
}
