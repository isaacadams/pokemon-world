import * as PIXI from "pixi.js";
import { PlayerState, SpriteController } from "./SpriteController";
import { TileMap } from "@repo/core";

interface Point { x: number; y: number }

type Direction = "up" | "down" | "left" | "right";

interface WildPokemon {
   state: PlayerState;
   label: PIXI.Text;
   speed: number;
   dir: Direction;
   changeDirCooldownMs: number;
   controller: SpriteController;
}

export interface Species {
   name: string;
   controller: SpriteController;
   tint?: number;
}

export class WildPokemonManager {
   private pokemons: WildPokemon[] = [];
   private collidersProvider?: () => PIXI.Rectangle[];
   private speciesPool: Species[] = [];

   constructor(
      private container: PIXI.Container,
      private tileMap: TileMap,
      private worldBounds: { x: number; y: number; width: number; height: number }
   ) {}

   public setSpeciesPool(species: Species[]): void {
      this.speciesPool = species.slice();
   }

   public spawnRandom(minCount: number, maxCount: number, around: Point): void {
      const count = Math.max(minCount, Math.min(maxCount, Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount));
      for (let i = 0; i < count; i++) {
         const pick = this.speciesPool[Math.floor(Math.random() * this.speciesPool.length)];
         if (!pick) continue;
         this.spawnOne(pick, around);
      }
   }

   public spawnOne(species: Species, around: Point): void {
      const spawnPoint = this.findNearbyWalkable(around, 6);
      const state: PlayerState = {
         currentDirection: "down",
         isMoving: false,
         sprite: species.controller.create(spawnPoint.x, spawnPoint.y)
      };
      if (species.tint) state.sprite.tint = species.tint;

      const label = new PIXI.Text(species.name, {
         fontFamily: "Arial",
         fontSize: 12,
         fill: 0xffffff,
         stroke: 0x000000,
         strokeThickness: 3,
         align: "center"
      } as any);
      (label as any).anchor?.set?.(0.5, 1);
      label.x = state.sprite.x;
      label.y = state.sprite.y - state.sprite.height * 0.7;

      this.container.addChild(state.sprite);
      this.container.addChild(label);

      this.pokemons.push({
         state,
         label,
         speed: 1.5,
         dir: this.randomDirection(),
         changeDirCooldownMs: this.randomMs(600, 2000),
         controller: species.controller
      });
   }

   public update(delta: number): void {
      const dtMs = delta * 16.6667; // PIXI delta ~ frames; approximate to ms at 60fps
      for (const p of this.pokemons) {
         p.changeDirCooldownMs -= dtMs;
         if (p.changeDirCooldownMs <= 0) {
            p.dir = Math.random() < 0.2 ? this.randomDirection() : this.randomDirection();
            p.changeDirCooldownMs = this.randomMs(600, 2000);
         }

         const prevX = p.state.sprite.x;
         const prevY = p.state.sprite.y;
         const next = this.nextPosition(prevX, prevY, p.dir, p.speed * delta);
         if (this.canWalk({ x: next.x, y: next.y })) {
            // Use species controller so direction/animation stays correct
            p.controller.updatePosition(next.x, next.y, p.state);
            p.label.x = p.state.sprite.x;
            p.label.y = p.state.sprite.y - p.state.sprite.height * 0.7;
         } else {
            p.dir = this.randomDirection(p.dir);
            p.changeDirCooldownMs = this.randomMs(300, 1200);
            if (p.state.isMoving) {
               p.state.isMoving = false;
               p.state.sprite.stop();
               p.state.sprite.gotoAndStop(0);
            }
         }
      }
   }

   public setCollidersProvider(provider: () => PIXI.Rectangle[]): void {
      this.collidersProvider = provider;
   }

   public getSprites(): PIXI.AnimatedSprite[] {
      return this.pokemons.map(p => p.state.sprite);
   }

   private nextPosition(x: number, y: number, dir: Direction, distance: number): Point {
      if (dir === "up") return { x, y: y - distance };
      if (dir === "down") return { x, y: y + distance };
      if (dir === "left") return { x: x - distance, y };
      return { x: x + distance, y };
   }

   private canWalk(position: Point): boolean {
      const size = 32; // matches PLAYER_SIZE used for sprite footprints
      const margin = 8; // COLLISION_MARGIN
      const left = position.x - size / 2;
      const top = position.y - size / 2;
      const samplePoints = [
         { x: left + margin, y: top + margin },
         { x: left + size - margin, y: top + margin },
         { x: left + margin, y: top + size - margin },
         { x: left + size - margin, y: top + size - margin }
      ];
      if (!this.isWithinBounds(position)) return false;
      const tiles = samplePoints.map(pt => ({
         x: Math.floor(pt.x / this.tileMap.getTileSize()),
         y: Math.floor(pt.y / this.tileMap.getTileSize())
      }));
      if (!tiles.every(t => this.tileMap.isTileWalkable(t.x, t.y))) return false;
      if (this.collidersProvider) {
         const rect = new PIXI.Rectangle(left, top, size, size);
         const others = this.collidersProvider();
         for (const r of others) {
            if (rect.intersects(r)) return false;
         }
      }
      return true;
   }

   private isWithinBounds(position: Point): boolean {
      const margin = 16; // half tile
      const b = this.worldBounds;
      return (
         position.x >= b.x + margin &&
         position.x <= b.width - margin &&
         position.y >= b.y + margin &&
         position.y <= b.height - margin
      );
   }

   private findNearbyWalkable(center: Point, radiusTiles: number): Point {
      const tileSize = this.tileMap.getTileSize();
      for (let i = 0; i < 50; i++) {
         const dx = (Math.floor((Math.random() * 2 - 1) * radiusTiles)) * tileSize;
         const dy = (Math.floor((Math.random() * 2 - 1) * radiusTiles)) * tileSize;
         const candidate = { x: center.x + dx, y: center.y + dy };
         if (this.canWalk(candidate)) return candidate;
      }
      return center;
   }

   private randomDirection(exclude?: Direction): Direction {
      const dirs: Direction[] = ["up", "down", "left", "right"]; 
      if (exclude) {
         const filtered = dirs.filter(d => d !== exclude);
         return filtered[Math.floor(Math.random() * filtered.length)] as Direction;
      }
      return dirs[Math.floor(Math.random() * dirs.length)] as Direction;
   }

   private randomMs(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
   }
}


