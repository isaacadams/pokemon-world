import * as PIXI from "pixi.js";
import { PlayerState, SpriteController } from "./SpriteController";
import PlayerData from "./PlayerData";

interface Point {
   x: number;
   y: number;
}

export class Player {
   public id: string = ""; // Set by Game via WebSocket
   private speed: number = 5;
   private keys: { [key: string]: boolean } = {};
   private state: PlayerState;
   private nameLabel: PIXI.Text;

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

      const localData = PlayerData.check();
      const displayName = localData?.user?.name || "Player";
      this.nameLabel = new PIXI.Text(displayName, {
         fontFamily: "Arial",
         fontSize: 14,
         fill: 0xffffff,
         stroke: 0x000000,
         strokeThickness: 3,
         align: "center"
      } as any);
      (this.nameLabel as any).anchor?.set?.(0.5, 1);
      this.nameLabel.x = this.state.sprite.x;
      this.nameLabel.y = this.state.sprite.y - this.state.sprite.height * 0.7;

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
      // Keep the name label positioned above the sprite
      this.nameLabel.x = this.state.sprite.x;
      this.nameLabel.y = this.state.sprite.y - this.state.sprite.height * 0.7;
      return this.state;
   }

   public applyNextPosition(x: number, y: number): PlayerState {
      this.controller.updatePosition(x, y, this.state);
      this.nameLabel.x = this.state.sprite.x;
      this.nameLabel.y = this.state.sprite.y - this.state.sprite.height * 0.7;
      return this.state;
   }

   public getBounds(): PIXI.Rectangle {
      return this.state.sprite.getBounds();
   }

   public get sprite(): PIXI.AnimatedSprite {
      return this.state.sprite;
   }

   public get label(): PIXI.Text {
      return this.nameLabel;
   }
}
