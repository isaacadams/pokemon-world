import * as PIXI from "pixi.js";

export interface TileConfig {
   impassable: boolean;
}

export class Tile {
   texture: PIXI.Texture;

   constructor(
      public readonly id: number,
      public readonly size: number,
      private readonly base: PIXI.BaseTexture,
      public readonly config: TileConfig
   ) {
      this.texture = new PIXI.Texture(
         base,
         new PIXI.Rectangle((id % 8) * size, Math.floor(id / 8) * size, size, size)
      );
   }

   sprite(layer: number, x: number, y: number) {
      return new SpriteTile({ layer, x, y }, new PIXI.Sprite(this.texture), this);
   }
}

export class SpriteTile {
   constructor(
      public readonly coordinates: { layer: number; x: number; y: number },
      public sprite: PIXI.Sprite,
      public readonly tile: Tile
   ) {
      sprite.x = coordinates.x * tile.size;
      sprite.y = coordinates.y * tile.size;
   }
}

export class TileSetFactory {
   tiles: Map<number, Tile> = new Map();

   constructor(
      private readonly base: PIXI.BaseTexture,
      private readonly size: number
   ) {}

   create(id: number, config: TileConfig) {
      return new Tile(id, this.size, this.base, config);
   }

   add(config: TileConfig, ...ids: number[]) {
      ids.forEach(id => {
         this.tiles.set(id, new Tile(id, this.size, this.base, config));
      });
   }
}

export function overworld(factory: TileSetFactory) {
   // UNKNOWN
   factory.add({ impassable: false }, 8);
   // GRASS_1
   factory.add({ impassable: false }, 9);
   // GRASS_2
   factory.add({ impassable: false }, 10);
   // WEEDS
   factory.add({ impassable: false }, 2565, 2566, 2573, 2574, 2581, 2582);
   // FENCE
   factory.add({ impassable: true }, 75);
   // FLOWER
   factory.add({ impassable: false }, 14);
   // FLOWER BED
   factory.add({ impassable: true }, 2488);
   // ROAD
   factory.add({ impassable: false }, 2428, 2429, 2430, 2436, 2437, 2438, 2444, 2445, 2446);
   // POKEMON_CENTER
   factory.add(
      { impassable: true },
      104,
      105,
      106,
      107,
      108,
      112,
      113,
      114,
      115,
      116,
      120,
      121,
      122,
      123,
      124,
      128,
      129,
      130,
      131,
      132,
      136,
      137,
      138,
      139,
      140
   );
   // LARGE BOULDERS
   factory.add({ impassable: true }, 345, 346, 347, 353, 354, 355, 361, 362, 363);
   // PINK TREES
   factory.add({ impassable: true }, 720, 721, 722, 728, 729, 730, 736, 737, 738);
   // SAFARI TREES
   factory.add({ impassable: true }, 800, 801, 808, 809);
}
