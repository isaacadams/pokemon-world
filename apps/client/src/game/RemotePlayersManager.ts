import * as PIXI from "pixi.js";
import { PlayerState, SpriteController } from "./SpriteController";

export class RemotePlayerManager {
   map: Map<string, { id: string; player: PlayerState; label: PIXI.Text }>;
   constructor(
      private game: PIXI.Container,
      private controller: SpriteController
   ) {
      this.map = new Map();
   }

   add(id: string, x: number, y: number, name: string = "Player"): void {
      if (this.map.has(id)) return;

      const player: PlayerState = {
         currentDirection: "down",
         isMoving: false,
         sprite: this.controller.create(x, y)
      };
      player.sprite.tint = 0x0000ff; // Blue for remote players
      const label = new PIXI.Text(name, {
         fontFamily: "Arial",
         fontSize: 14,
         fill: 0xffffff,
         stroke: 0x000000,
         strokeThickness: 3,
         align: "center"
      } as any);
      (label as any).anchor?.set?.(0.5, 1);
      label.x = player.sprite.x;
      label.y = player.sprite.y - player.sprite.height * 0.7;

      this.game.addChild(player.sprite);
      this.game.addChild(label);
      this.map.set(id, { id, player, label });
      console.log(`Added remote player ${id} at (${x}, ${y})`);
   }

   update(id: string, x: number, y: number): void {
      const state = this.map.get(id);
      if (state) {
         this.controller.updatePosition(x, y, state.player);
         state.label.x = state.player.sprite.x;
         state.label.y = state.player.sprite.y - state.player.sprite.height * 0.7;
      }
   }

   remove(id: string): void {
      const state = this.map.get(id);
      if (state) {
         this.game.removeChild(state.player.sprite);
         this.game.removeChild(state.label);
         this.map.delete(id);
         console.log(`Removed remote player ${id}`);
      }
   }

   rename(id: string, name: string): void {
      const state = this.map.get(id);
      if (state) {
         state.label.text = name || "Player";
      }
   }
}
