import * as PIXI from "pixi.js";
import playerSprite from "@assets/tilesets/pokemon_player.png";

export interface SpriteController {
   updatePosition(x: number, y: number, player: PlayerState): void;
   create(x: number, y: number): PIXI.AnimatedSprite;
}

export interface PlayerState {
   sprite: PIXI.AnimatedSprite;
   currentDirection: "right" | "left" | "down" | "up";
   isMoving: boolean;
}

interface AnimationState {
   name: string;
   frames: PIXI.Texture[];
   speed: number;
}

interface SpriteConfig {
   sprite_size: number;
   animation_speed: number;
   scale: number;
}

export class SpriteCache {
   cache: Map<string, SpriteController>;
   constructor() {
      this.cache = new Map();
   }

   async load() {
      const [player] = await Promise.all([
         this.player({
            sprite_size: 64,
            animation_speed: 0.2,
            scale: 0.75
         })
      ]);
      this.cache.set("pokemon_player", player);
      return { player };
   }

   async player(config: SpriteConfig) {
      const texture = await PIXI.Assets.load(playerSprite);
      const baseTexture = texture.baseTexture;
      return new PokemonPlayerController(baseTexture, config);
   }
}

class PokemonPlayerController implements SpriteController {
   private animations: { [key: string]: AnimationState } = {};

   constructor(
      readonly texture: PIXI.BaseTexture,
      private readonly config: SpriteConfig
   ) {
      const createFrames = (startIndex: number): PIXI.Texture[] => {
         const frames: PIXI.Texture[] = [];
         for (let i = 0; i < 4; i++) {
            frames.push(
               new PIXI.Texture(
                  texture,
                  new PIXI.Rectangle(
                     i * config.sprite_size,
                     startIndex * config.sprite_size,
                     config.sprite_size,
                     config.sprite_size
                  )
               )
            );
         }
         return frames;
      };

      this.animations = {
         down: {
            name: "down",
            frames: createFrames(0),
            speed: config.animation_speed
         },
         left: {
            name: "left",
            frames: createFrames(1),
            speed: config.animation_speed
         },
         right: {
            name: "right",
            frames: createFrames(2),
            speed: config.animation_speed
         },
         up: {
            name: "up",
            frames: createFrames(3),
            speed: config.animation_speed
         }
      };
   }

   create(x: number, y: number): PIXI.AnimatedSprite {
      const sprite = new PIXI.AnimatedSprite(this.animations.down.frames);
      sprite.x = x;
      sprite.y = y;
      sprite.anchor.set(0.5, 0.75);
      sprite.scale.set(this.config.scale);
      sprite.animationSpeed = this.config.animation_speed;
      sprite.loop = true;
      sprite.gotoAndStop(0);
      return sprite;
   }

   updatePosition(x: number, y: number, player: PlayerState): void {
      const prevX = player.sprite.x;
      const prevY = player.sprite.y;
      player.sprite.x = x;
      player.sprite.y = y;

      // Determine direction and movement state
      let newDirection = player.currentDirection;
      let isMoving = false;

      if (x > prevX) {
         newDirection = "right";
         isMoving = true;
      } else if (x < prevX) {
         newDirection = "left";
         isMoving = true;
      } else if (y > prevY) {
         newDirection = "down";
         isMoving = true;
      } else if (y < prevY) {
         newDirection = "up";
         isMoving = true;
      }

      if (this.animations[newDirection]) {
         if (newDirection !== player.currentDirection) {
            player.sprite.textures = this.animations[newDirection].frames;
            player.currentDirection = newDirection;
         }

         if (isMoving !== player.isMoving) {
            player.isMoving = isMoving;
            if (isMoving) {
               player.sprite.play();
            } else {
               player.sprite.stop();
               player.sprite.gotoAndStop(0);
            }
         }
      }
   }
}
