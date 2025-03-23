import * as PIXI from "pixi.js";

export class Tile {
   texture: PIXI.Texture;

   constructor(
      private readonly id: number,
      private readonly size: number,
      private readonly base: PIXI.BaseTexture
   ) {
      this.texture = new PIXI.Texture(
         base,
         new PIXI.Rectangle((id % 8) * size, Math.floor(id / 8) * size, size, size)
      );
   }
}

export class TileSetFactory {
   tiles: Map<number, Tile> = new Map();

   constructor(
      private readonly base: PIXI.BaseTexture,
      private readonly size: number
   ) {}

   create(id: number) {
      return new Tile(id, this.size, this.base);
   }

   add(...ids: number[]) {
      ids.forEach(id => {
         this.tiles.set(id, new Tile(id, this.size, this.base));
      });
   }
}

export function overworld(factory: TileSetFactory) {
   // UNKNOWN
   factory.add(8);
   // GRASS_1
   factory.add(9);
   // GRASS_2
   factory.add(10);
   // WEEDS
   factory.add(2565, 2566, 2573, 2574, 2581, 2582);
   // FENCE
   factory.add(75);
   // FLOWER
   factory.add(14);
   // FLOWER BED
   factory.add(2488);
   // ROAD
   factory.add(2428, 2429, 2430, 2436, 2437, 2438, 2444, 2445, 2446);
   // POKEMON_CENTER
   factory.add(
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
   factory.add(345, 346, 347, 353, 354, 355, 361, 362, 363);
   // PINK TREES
   factory.add(720, 721, 722, 728, 729, 730, 736, 737, 738);
   // SAFARI TREES
   factory.add(800, 801, 808, 809);
}
