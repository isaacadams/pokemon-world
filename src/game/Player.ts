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

    public getNextPosition(delta: number): { x: number, y: number } {
        let nextX = this.sprite.x;
        let nextY = this.sprite.y;

        if (this.keys['w'] || this.keys['arrowup']) {
            nextY -= this.speed * delta;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            nextY += this.speed * delta;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            nextX -= this.speed * delta;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            nextX += this.speed * delta;
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