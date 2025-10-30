import * as PIXI from "pixi.js";
import { PlayerState, SpriteController } from "./SpriteController";

export class RemotePlayerManager {
   map: Map<string, { id: string; player: PlayerState; label: PIXI.Text; lastUpdateMs: number }>;
   private idleThresholdMs: number = 200; // if no updates for 200ms, consider idle
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
      this.map.set(id, { id, player, label, lastUpdateMs: Date.now() });
      console.log(`Added remote player ${id} at (${x}, ${y})`);
   }

   update(id: string, x: number, y: number): void {
      const state = this.map.get(id);
      if (state) {
         const prevX = state.player.sprite.x;
         const prevY = state.player.sprite.y;
         this.controller.updatePosition(x, y, state.player);
         state.label.x = state.player.sprite.x;
         state.label.y = state.player.sprite.y - state.player.sprite.height * 0.7;
         state.lastUpdateMs = Date.now();
         // If position did not change, mark idle explicitly to prevent stuck animations
         if (prevX === state.player.sprite.x && prevY === state.player.sprite.y) {
            if (state.player.isMoving) {
               state.player.isMoving = false;
               state.player.sprite.stop();
               state.player.sprite.gotoAndStop(0);
            }
         }
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
      if (!state) return;
      state.label.text = name || "Player";
   }

   tick(deltaMs: number): void {
      const now = Date.now();
      for (const state of this.map.values()) {
         if (shouldIdle(state.lastUpdateMs, now, this.idleThresholdMs)) {
            if (state.player.isMoving) {
               state.player.isMoving = false;
               state.player.sprite.stop();
               state.player.sprite.gotoAndStop(0);
            }
         }
      }
   }

   getSprites(): PIXI.AnimatedSprite[] {
      return Array.from(this.map.values()).map(v => v.player.sprite);
   }
}

export function shouldIdle(lastUpdateMs: number, nowMs: number, thresholdMs: number): boolean {
   return nowMs - lastUpdateMs >= thresholdMs;
}
