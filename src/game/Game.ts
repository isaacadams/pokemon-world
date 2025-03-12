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

        // Fill with grass tiles (randomly choosing between variants)
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const grassType = Math.random() < 0.33 ? 'GRASS_1' : 
                                Math.random() < 0.5 ? 'GRASS_2' : 'GRASS_3';
                this.tileMap.setTileByType(x, y, grassType);
            }
        }

        // Add some boulders for variety
        const numBoulders = Math.floor((mapWidth * mapHeight) * 0.05); // 5% of tiles
        for (let i = 0; i < numBoulders; i++) {
            const x = Math.floor(Math.random() * mapWidth);
            const y = Math.floor(Math.random() * mapHeight);
            const boulderType = Math.random() < 0.5 ? 'BOULDER_1' : 'BOULDER_2';
            
            // Don't place boulders in the center path
            if (Math.abs(x - mapWidth/2) > 2 && Math.abs(y - mapHeight/2) > 2) {
                this.tileMap.setTileByType(x, y, boulderType);
            }
        }

        // Create paths in the center
        const centerX = Math.floor(mapWidth / 2);
        const centerY = Math.floor(mapHeight / 2);
        
        // Clear a 3-tile wide path
        for (let x = 0; x < mapWidth; x++) {
            for (let offset = -1; offset <= 1; offset++) {
                const y = centerY + offset;
                if (y >= 0 && y < mapHeight) {
                    this.tileMap.setTileByType(x, y, 'GRASS_1');
                }
            }
        }
        for (let y = 0; y < mapHeight; y++) {
            for (let offset = -1; offset <= 1; offset++) {
                const x = centerX + offset;
                if (x >= 0 && x < mapWidth) {
                    this.tileMap.setTileByType(x, y, 'GRASS_1');
                }
            }
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