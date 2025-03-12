import * as PIXI from 'pixi.js';
import { Player } from './Player';
import { PC } from './PC';

export class Game {
    private app: PIXI.Application;
    private player: Player;
    private pc: PC;
    private gameContainer: PIXI.Container;
    private worldBounds = {
        x: 0,
        y: 0,
        width: 800,
        height: 600
    };

    constructor() {
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x7CAF75, // Grass-like color
        });

        this.gameContainer = new PIXI.Container();
        this.app.stage.addChild(this.gameContainer);

        // Draw world boundaries
        const worldBorder = new PIXI.Graphics();
        worldBorder.lineStyle(2, 0x000000);
        worldBorder.drawRect(this.worldBounds.x, this.worldBounds.y, this.worldBounds.width, this.worldBounds.height);
        this.gameContainer.addChild(worldBorder);

        // Initialize game objects
        this.player = new Player(this.worldBounds.width / 2, this.worldBounds.height / 2);
        this.pc = new PC(100, 100);

        this.gameContainer.addChild(this.player.sprite);
        this.gameContainer.addChild(this.pc.sprite);
        this.app.stage.addChild(this.pc.getInterface()); // Add PC interface to the stage

        // Center the game container
        this.centerGameContainer();

        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));

        // Start the game loop
        this.app.ticker.add((delta) => this.gameLoop(delta));
    }

    private centerGameContainer(): void {
        this.gameContainer.x = (window.innerWidth - this.worldBounds.width) / 2;
        this.gameContainer.y = (window.innerHeight - this.worldBounds.height) / 2;
    }

    private gameLoop(deltaTime: number): void {
        const nextPosition = this.player.getNextPosition(deltaTime);
        
        // Check world boundaries
        if (this.isWithinBounds(nextPosition.x, nextPosition.y)) {
            this.player.update(deltaTime);
        }

        this.pc.update(deltaTime);

        // Check for interaction between player and PC
        if (this.checkCollision(this.player.sprite, this.pc.sprite)) {
            this.pc.interact();
        }
    }

    private isWithinBounds(x: number, y: number): boolean {
        const margin = 16; // Half of player width/height
        return x >= this.worldBounds.x + margin &&
               x <= this.worldBounds.width - margin &&
               y >= this.worldBounds.y + margin &&
               y <= this.worldBounds.height - margin;
    }

    private checkCollision(a: PIXI.Sprite, b: PIXI.Sprite): boolean {
        const aBox = a.getBounds();
        const bBox = b.getBounds();
        return aBox.x + aBox.width > bBox.x &&
               aBox.x < bBox.x + bBox.width &&
               aBox.y + aBox.height > bBox.y &&
               aBox.y < bBox.y + bBox.height;
    }

    private onResize(): void {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
        this.centerGameContainer();
    }

    public start(): void {
        document.getElementById('game-container')?.appendChild(this.app.view as HTMLCanvasElement);
    }
} 