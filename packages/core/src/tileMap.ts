import * as PIXI from "pixi.js";

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

   private layers: PIXI.Container[] = [];
   private debugMode: boolean = false;
   private verboseMode: boolean = false;
   private tilesetConfig: TileSet;

   constructor(tilesImagePath: string, tilesTmxPath: string, mapTmxPath: string) {
      //console.log([tilesImagePath, tilesTmxPath, mapTmxPath]);
      this.tilesetConfig = new TileSet(tilesTmxPath);
      this.tilesetTexture = PIXI.BaseTexture.from(tilesImagePath);
      this.container = new PIXI.Container();
      this.tileSize = 32;
      console.log("is tile set png valid? ", this.tilesetTexture.valid);

      //if (!this.tileset.valid) {
      //   console.error("failed");
      //}

      const parser = new DOMParser();
      const tmx = parser.parseFromString(mapTmxPath, "text/xml");
      const layerElements = tmx.getElementsByTagName("layer");

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

         for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
               const tileId = tileIds[y * width + x];
               if (tileId === 0) continue;

               const tile = new PIXI.Sprite(
                  new PIXI.Texture(
                     this.tilesetTexture,
                     new PIXI.Rectangle(
                        ((tileId - 1) % 8) * this.tileSize,
                        Math.floor((tileId - 1) / 8) * this.tileSize,
                        this.tileSize,
                        this.tileSize
                     )
                  )
               );
               tile.x = x * this.tileSize;
               tile.y = y * this.tileSize;
               this.tiles[i][y][x] = tile;
               layerContainer.addChild(tile);
            }
         }
      }
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
         const tile = this.tiles[layer][y][x];
         if (!tile) continue;

         const tileX = Math.floor(tile.texture.frame.x / this.tileSize);
         const tileY = Math.floor(tile.texture.frame.y / this.tileSize);
         const tileId = tileY * 8 + tileX + 1;

         if (this.debugMode && this.verboseMode) {
            console.log(`Checking tile at (${x},${y}) Layer ${layer}: ID=${tileId}`);
         }

         const tileElement = this.tilesetConfig.getElement(tileId);
         if (tileElement) {
            const canWalkProperty = tileElement.querySelector('property[name="canWalk"]');
            if (canWalkProperty && canWalkProperty.getAttribute("value") === "true") {
               continue;
            }
         }

         if (tileElement) {
            const e = new TileElement(tileId, tileElement);
            if (e.impassable()) {
               return false;
            }
         }

         const nonWalkableTiles = [
            [105, 109],
            [113, 117],
            [121, 125],
            [129, 133],
            [137, 141],
            [346, 348],
            [354, 356],
            [362, 364],
            [82],
            [97],
            [714, 715],
            [721, 723],
            [729, 731],
            [737, 739],
            [801, 802],
            [809, 810],
            [2566, 2567],
            [2574, 2575],
            [2582, 2583]
         ];

         for (const range of nonWalkableTiles) {
            if (range.length === 1 && tileId === range[0]) return false;
            if (range.length === 2 && tileId >= range[0] && tileId <= range[1]) return false;
         }
      }
      return true;
   }

   public setDebugMode(enabled: boolean): void {
      this.debugMode = enabled;
      if (this.verboseMode) {
         console.log(`TileMap debug mode ${enabled ? "enabled" : "disabled"}`);
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
