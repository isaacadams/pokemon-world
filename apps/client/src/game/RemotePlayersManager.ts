import * as PIXI from "pixi.js";
import { PlayerState, SpriteController } from "./SpriteController";

export class RemotePlayerManager {
   map: Map<string, { id: string; player: PlayerState }>;
   constructor(
      private game: PIXI.Container,
      private controller: SpriteController
   ) {
      this.map = new Map();
   }

   add(id: string, x: number, y: number): void {
      if (this.map.has(id)) return;

      const player: PlayerState = {
         currentDirection: "down",
         isMoving: false,
         sprite: this.controller.create(x, y)
      };
      player.sprite.tint = 0x0000ff; // Blue for remote players
      this.game.addChild(player.sprite);
      this.map.set(id, { id, player });
      console.log(`Added remote player ${id} at (${x}, ${y})`);
   }

   update(id: string, x: number, y: number): void {
      const state = this.map.get(id);
      if (state) {
         this.controller.updatePosition(x, y, state.player);
      }
   }

   remove(id: string): void {
      const state = this.map.get(id);
      if (state) {
         this.game.removeChild(state.player.sprite);
         this.map.delete(id);
         console.log(`Removed remote player ${id}`);
      }
   }
}
