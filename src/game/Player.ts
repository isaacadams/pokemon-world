import * as PIXI from "pixi.js";
import { AnimatedCharacter } from "./AnimatedCharacter";

interface Point {
   x: number;
   y: number;
}

export class Player {
   public character: AnimatedCharacter;
   public id: string = ""; // Set by Game via WebSocket
   private speed: number = 5;
   private keys: { [key: string]: boolean } = {};

   constructor(x: number, y: number) {
      this.character = new AnimatedCharacter("", x, y); // ID set later
      this.character.sprite.tint = 0xff0000; // Red for local player

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
      let nextX = this.character.sprite.x;
      let nextY = this.character.sprite.y;

      if (this.keys["w"] || this.keys["arrowup"]) nextY -= this.speed * delta;
      else if (this.keys["s"] || this.keys["arrowdown"]) nextY += this.speed * delta;
      else if (this.keys["a"] || this.keys["arrowleft"]) nextX -= this.speed * delta;
      else if (this.keys["d"] || this.keys["arrowright"]) nextX += this.speed * delta;

      return { x: nextX, y: nextY };
   }

   public update(delta: number): void {
      const nextPos = this.getNextPosition(delta);
      this.character.updatePosition(nextPos.x, nextPos.y);
   }

   public getBounds(): PIXI.Rectangle {
      return this.character.getBounds();
   }

   public get sprite(): PIXI.AnimatedSprite {
      return this.character.sprite;
   }
}
