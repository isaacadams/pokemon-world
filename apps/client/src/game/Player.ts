import * as PIXI from "pixi.js";
import { PlayerState, SpriteController } from "./SpriteController";

interface Point {
   x: number;
   y: number;
}

export class Player {
   public id: string = ""; // Set by Game via WebSocket
   private speed: number = 5;
   private keys: { [key: string]: boolean } = {};
   private state: PlayerState;

   constructor(
      x: number,
      y: number,
      private controller: SpriteController
   ) {
      this.state = {
         currentDirection: "down",
         isMoving: false,
         sprite: this.controller.create(x, y)
      };
      this.state.sprite.tint = 0xff0000; // Red for local player

      window.addEventListener("keydown", this.onKeyDown.bind(this));
      window.addEventListener("keyup", this.onKeyUp.bind(this));
   }

   private onKeyDown(e: KeyboardEvent): void {
      this.keys[e.key.toLowerCase()] = true;
   }

   private onKeyUp(e: KeyboardEvent): void {
      this.keys[e.key.toLowerCase()] = false;
   }

   public getNextPosition(delta: number): Point {
      let nextX = this.state.sprite.x;
      let nextY = this.state.sprite.y;

      if (this.keys["w"] || this.keys["arrowup"]) nextY -= this.speed * delta;
      else if (this.keys["s"] || this.keys["arrowdown"]) nextY += this.speed * delta;
      else if (this.keys["a"] || this.keys["arrowleft"]) nextX -= this.speed * delta;
      else if (this.keys["d"] || this.keys["arrowright"]) nextX += this.speed * delta;

      return { x: nextX, y: nextY };
   }

   public update(delta: number): PlayerState {
      const nextPos = this.getNextPosition(delta);
      this.controller.updatePosition(nextPos.x, nextPos.y, this.state);
      return this.state;
   }

   public getBounds(): PIXI.Rectangle {
      return this.state.sprite.getBounds();
   }

   public get sprite(): PIXI.AnimatedSprite {
      return this.state.sprite;
   }
}
