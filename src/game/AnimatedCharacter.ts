import * as PIXI from 'pixi.js';
import playerSprite from '@assets/tilesets/pokemon_player.png';

interface AnimationState {
    name: string;
    frames: PIXI.Texture[];
    speed: number;
}

export class AnimatedCharacter {
    public sprite: PIXI.AnimatedSprite;
    public id: string; // Unique ID for multiplayer
    private animations: { [key: string]: AnimationState } = {};
    private currentDirection: string = 'down';
    private isMoving: boolean = false;
    private static readonly SPRITE_SIZE = 64;
    private static readonly ANIMATION_SPEED = 0.2;
    private static readonly SCALE = 0.75;

    constructor(id: string, x: number, y: number) {
        this.id = id;

        // Fallback sprite (red square)
        const canvas = document.createElement('canvas');
        const size = Math.floor(AnimatedCharacter.SPRITE_SIZE * AnimatedCharacter.SCALE);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FF0000'; // Default red; override for remote players later
            ctx.fillRect(0, 0, size, size);
        }

        this.sprite = new PIXI.AnimatedSprite([PIXI.Texture.from(canvas)]);
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5, 1.0);

        // Load actual sprite
        this.loadSprite(x, y).catch(error => {
            console.error(`Failed to initialize sprite for ${id}:`, error);
        });
    }

    private async loadSprite(x: number, y: number): Promise<void> {
        try {
            const texture = await PIXI.Assets.load(playerSprite);
            const baseTexture = texture.baseTexture;

            this.setupAnimations(baseTexture);

            this.sprite.textures = this.animations.down.frames;
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.anchor.set(0.5, 0.75);
            this.sprite.scale.set(AnimatedCharacter.SCALE);
            this.sprite.animationSpeed = AnimatedCharacter.ANIMATION_SPEED;
            this.sprite.loop = true;
            this.sprite.gotoAndStop(0);

            console.log(`Sprite loaded for ${this.id}`);
        } catch (error) {
            console.error(`Failed to load sprite for ${this.id}:`, error);
        }
    }

    private setupAnimations(baseTexture: PIXI.BaseTexture): void {
        const createFrames = (startIndex: number): PIXI.Texture[] => {
            const frames: PIXI.Texture[] = [];
            for (let i = 0; i < 4; i++) {
                frames.push(new PIXI.Texture(
                    baseTexture,
                    new PIXI.Rectangle(
                        i * AnimatedCharacter.SPRITE_SIZE,
                        startIndex * AnimatedCharacter.SPRITE_SIZE,
                        AnimatedCharacter.SPRITE_SIZE,
                        AnimatedCharacter.SPRITE_SIZE
                    )
                ));
            }
            return frames;
        };

        this.animations = {
            down: { name: 'down', frames: createFrames(0), speed: AnimatedCharacter.ANIMATION_SPEED },
            left: { name: 'left', frames: createFrames(1), speed: AnimatedCharacter.ANIMATION_SPEED },
            right: { name: 'right', frames: createFrames(2), speed: AnimatedCharacter.ANIMATION_SPEED },
            up: { name: 'up', frames: createFrames(3), speed: AnimatedCharacter.ANIMATION_SPEED },
        };
    }

    public updatePosition(x: number, y: number): void {
        const prevX = this.sprite.x;
        const prevY = this.sprite.y;
        this.sprite.x = x;
        this.sprite.y = y;

        // Determine direction and movement state
        let newDirection = this.currentDirection;
        let isMoving = false;

        if (x > prevX) {
            newDirection = 'right';
            isMoving = true;
        } else if (x < prevX) {
            newDirection = 'left';
            isMoving = true;
        } else if (y > prevY) {
            newDirection = 'down';
            isMoving = true;
        } else if (y < prevY) {
            newDirection = 'up';
            isMoving = true;
        }

        if (this.animations[newDirection]) {
            if (newDirection !== this.currentDirection) {
                this.sprite.textures = this.animations[newDirection].frames;
                this.currentDirection = newDirection;
            }

            if (isMoving !== this.isMoving) {
                this.isMoving = isMoving;
                if (isMoving) {
                    this.sprite.play();
                } else {
                    this.sprite.stop();
                    this.sprite.gotoAndStop(0);
                }
            }
        }
    }

    public getBounds(): PIXI.Rectangle {
        return this.sprite.getBounds();
    }
}