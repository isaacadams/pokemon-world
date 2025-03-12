import * as PIXI from 'pixi.js';
import playerSprite from '@assets/tilesets/pokemon_player.png';

interface AnimationState {
    name: string;
    frames: PIXI.Texture[];
    speed: number;
}

export class Player {
    public sprite: PIXI.AnimatedSprite;
    private speed: number = 5;
    private keys: { [key: string]: boolean } = {};
    private animations: { [key: string]: AnimationState } = {};
    private currentDirection: string = 'down';
    private isMoving: boolean = false;
    private static readonly SPRITE_SIZE = 64;
    private static readonly ANIMATION_SPEED = 0.2;

    constructor(x: number, y: number) {
        // Create a simple red square texture for the fallback
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, 32, 32);
        }
        
        // Create the fallback sprite
        this.sprite = new PIXI.AnimatedSprite([PIXI.Texture.from(canvas)]);
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5);

        // Load the actual sprite
        this.loadPlayerSprite(x, y).catch(error => {
            console.error('Failed to initialize player sprite:', error);
        });

        // Set up keyboard listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    private async loadPlayerSprite(x: number, y: number): Promise<void> {
        try {
            // Load the texture
            const texture = await PIXI.Assets.load(playerSprite);
            console.log('Sprite dimensions:', texture.width, texture.height);
            const baseTexture = texture.baseTexture;

            // Create textures for each animation frame
            this.setupAnimations(baseTexture);

            // Update the sprite with the actual textures
            this.sprite.textures = this.animations.down.frames;
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.anchor.set(0.5);
            this.sprite.scale.set(0.5); // Scale down to 32x32 since original is 64x64
            this.sprite.animationSpeed = Player.ANIMATION_SPEED;
            this.sprite.loop = true;
            this.sprite.gotoAndStop(0);

            console.log('Player sprite loaded successfully');
        } catch (error) {
            console.error('Failed to load player sprite:', error);
        }
    }

    private setupAnimations(baseTexture: PIXI.BaseTexture): void {
        // Helper function to create frame textures
        const createFrames = (startIndex: number): PIXI.Texture[] => {
            const frames: PIXI.Texture[] = [];
            for (let i = 0; i < 4; i++) {
                frames.push(new PIXI.Texture(
                    baseTexture,
                    new PIXI.Rectangle(
                        i * Player.SPRITE_SIZE,
                        startIndex * Player.SPRITE_SIZE,
                        Player.SPRITE_SIZE,
                        Player.SPRITE_SIZE
                    )
                ));
            }
            return frames;
        };

        // Create animations for each direction
        this.animations = {
            down: {
                name: 'down',
                frames: createFrames(0),
                speed: Player.ANIMATION_SPEED
            },
            left: {
                name: 'left',
                frames: createFrames(1),
                speed: Player.ANIMATION_SPEED
            },
            right: {
                name: 'right',
                frames: createFrames(2),
                speed: Player.ANIMATION_SPEED
            },
            up: {
                name: 'up',
                frames: createFrames(3),
                speed: Player.ANIMATION_SPEED
            }
        };
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.keys[e.key.toLowerCase()] = true;
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.keys[e.key.toLowerCase()] = false;
    }

    public getNextPosition(delta: number): { x: number, y: number } {
        let nextX = this.sprite.x;
        let nextY = this.sprite.y;
        let isMoving = false;
        let newDirection = this.currentDirection;

        if (this.keys['w'] || this.keys['arrowup']) {
            nextY -= this.speed * delta;
            newDirection = 'up';
            isMoving = true;
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            nextY += this.speed * delta;
            newDirection = 'down';
            isMoving = true;
        } else if (this.keys['a'] || this.keys['arrowleft']) {
            nextX -= this.speed * delta;
            newDirection = 'left';
            isMoving = true;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            nextX += this.speed * delta;
            newDirection = 'right';
            isMoving = true;
        }

        // Update animation state if we have loaded animations
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

        return { x: nextX, y: nextY };
    }

    public update(delta: number): void {
        const nextPos = this.getNextPosition(delta);
        this.sprite.x = nextPos.x;
        this.sprite.y = nextPos.y;
    }

    public getBounds(): PIXI.Rectangle {
        return this.sprite.getBounds();
    }
} 