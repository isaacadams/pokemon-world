import * as PIXI from 'pixi.js';
import { Player } from './Player';
import { PC } from './PC';
import { TileMap } from './TileMap';
import tileset from '@assets/tilesets/tileset.png';

export class Game {
    private app: PIXI.Application;
    private player: Player;
    private pc: PC;
    private gameContainer: PIXI.Container;
    private tileMap: TileMap;
    private worldBounds = {
        x: 0,
        y: 0,
        width: 800,
        height: 600
    };
    private static readonly DEBUG_MODE = process.env.NODE_ENV === 'development';

    constructor() {
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000, // Black background
        });

        this.gameContainer = new PIXI.Container();
        this.app.stage.addChild(this.gameContainer);

        // Initialize tilemap
        this.tileMap = new TileMap(
            tileset,
            Math.ceil(this.worldBounds.width / 32),
            Math.ceil(this.worldBounds.height / 32)
        );
        this.gameContainer.addChild(this.tileMap.getContainer());

        // Initialize game objects
        this.player = new Player(this.worldBounds.width / 2, this.worldBounds.height / 2);
        this.pc = new PC(100, 100, Game.DEBUG_MODE);

        // Add interaction zone first (so it's behind other sprites)
        this.gameContainer.addChild(this.pc.getInteractionZone());
        this.gameContainer.addChild(this.player.sprite);
        this.gameContainer.addChild(this.pc.sprite);
        this.app.stage.addChild(this.pc.getInterface());

        // Center the game container
        this.centerGameContainer();

        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));

        // Start the game loop
        this.app.ticker.add((delta) => this.gameLoop(delta));

        if (Game.DEBUG_MODE) {
            console.log('Game running in debug mode');
        }

        // Set up initial map (we'll make this more sophisticated later)
        this.setupInitialMap();
    }

    private setupInitialMap(): void {
        const mapWidth = Math.ceil(this.worldBounds.width / 32);
        const mapHeight = Math.ceil(this.worldBounds.height / 32);

        // Fill with grass tiles (assuming grass tile is at 0,0 in tileset)
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                this.tileMap.setTile(x, y, 0, 0);
            }
        }

        // Add some path tiles (assuming path tile is at 1,0 in tileset)
        const centerX = Math.floor(mapWidth / 2);
        const centerY = Math.floor(mapHeight / 2);
        
        // Create a simple path
        for (let x = 0; x < mapWidth; x++) {
            this.tileMap.setTile(x, centerY, 1, 0);
        }
        for (let y = 0; y < mapHeight; y++) {
            this.tileMap.setTile(centerX, y, 1, 0);
        }
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

        // Check for PC interaction range
        if (this.pc.isPlayerInRange(this.player.getBounds())) {
            this.pc.getInteractionZone().alpha = 0.3;
        } else {
            this.pc.getInteractionZone().alpha = 0;
        }
    }

    private isWithinBounds(x: number, y: number): boolean {
        const margin = 16; // Half of player width/height
        return x >= this.worldBounds.x + margin &&
               x <= this.worldBounds.width - margin &&
               y >= this.worldBounds.y + margin &&
               y <= this.worldBounds.height - margin;
    }

    private onResize(): void {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
        this.centerGameContainer();
    }

    public start(): void {
        document.getElementById('game-container')?.appendChild(this.app.view as HTMLCanvasElement);
    }
} 