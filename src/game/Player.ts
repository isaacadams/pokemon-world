import * as PIXI from 'pixi.js';

export class Player {
    public sprite: PIXI.Sprite;
    private speed: number = 5;
    private keys: { [key: string]: boolean } = {};

    constructor(x: number, y: number) {
        // Create a white rectangle texture
        const texture = PIXI.Texture.WHITE;
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.width = 32;
        this.sprite.height = 32;
        this.sprite.tint = 0xFF0000; // Make it red
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5);

        // Set up keyboard listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.keys[e.key.toLowerCase()] = true;
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.keys[e.key.toLowerCase()] = false;
    }

    public update(delta: number): void {
        // Handle movement
        if (this.keys['w'] || this.keys['arrowup']) {
            this.sprite.y -= this.speed * delta;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.sprite.y += this.speed * delta;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.sprite.x -= this.speed * delta;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.sprite.x += this.speed * delta;
        }
    }
} 