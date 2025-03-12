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
    private debugGraphics: PIXI.Graphics;
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

        // Initialize debug graphics last so it's on top
        this.debugGraphics = new PIXI.Graphics();
        this.gameContainer.addChild(this.debugGraphics);

        // Center the game container
        this.centerGameContainer();

        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));

        // Start the game loop
        this.app.ticker.add((delta) => this.gameLoop(delta));

        if (Game.DEBUG_MODE) {
            console.log('Game running in debug mode');
        }

        // Set up initial map
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
        
        // Convert pixel position to tile coordinates for each corner of the player sprite
        const playerSize = 32; // Player sprite size
        const margin = 8; // Collision margin (adjust this to make collision area larger/smaller)
        
        // Since the sprite is anchored at center (0.5), adjust the position to get the top-left corner
        const spriteLeft = nextPosition.x - playerSize/2;
        const spriteTop = nextPosition.y - playerSize/2;
        
        // Check all four corners of the player sprite, centered
        const tilesToCheck = [
            // Top-left corner
            {
                x: Math.floor((spriteLeft + margin) / this.tileMap.getTileSize()),
                y: Math.floor((spriteTop + margin) / this.tileMap.getTileSize())
            },
            // Top-right corner
            {
                x: Math.floor((spriteLeft + playerSize - margin) / this.tileMap.getTileSize()),
                y: Math.floor((spriteTop + margin) / this.tileMap.getTileSize())
            },
            // Bottom-left corner
            {
                x: Math.floor((spriteLeft + margin) / this.tileMap.getTileSize()),
                y: Math.floor((spriteTop + playerSize - margin) / this.tileMap.getTileSize())
            },
            // Bottom-right corner
            {
                x: Math.floor((spriteLeft + playerSize - margin) / this.tileMap.getTileSize()),
                y: Math.floor((spriteTop + playerSize - margin) / this.tileMap.getTileSize())
            }
        ];

        // Check if all tiles are walkable
        const canWalk = tilesToCheck.every(tile => 
            this.isWithinBounds(nextPosition.x, nextPosition.y) && 
            this.tileMap.isTileWalkable(tile.x, tile.y)
        );

        if (canWalk) {
            this.player.update(deltaTime);
        }

        this.pc.update(deltaTime);

        // Check for PC interaction range
        if (this.pc.isPlayerInRange(this.player.getBounds())) {
            this.pc.getInteractionZone().alpha = 0.3;
        } else {
            this.pc.getInteractionZone().alpha = 0;
        }

        // Update debug visualization
        if (Game.DEBUG_MODE) {
            this.updateDebugVisualization(nextPosition, playerSize, margin, tilesToCheck, canWalk);
        }
    }

    private updateDebugVisualization(
        nextPosition: { x: number; y: number }, 
        playerSize: number, 
        margin: number, 
        tilesToCheck: { x: number; y: number }[], 
        canWalk: boolean
    ): void {
        this.debugGraphics.clear();

        // Draw tile grid
        const tileSize = this.tileMap.getTileSize();
        const mapWidth = Math.ceil(this.worldBounds.width / tileSize);
        const mapHeight = Math.ceil(this.worldBounds.height / tileSize);

        // Draw walkable/non-walkable tiles
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const isWalkable = this.tileMap.isTileWalkable(x, y);
                this.debugGraphics.lineStyle(1, isWalkable ? 0x00ff00 : 0xff0000, 0.3);
                this.debugGraphics.drawRect(
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize
                );
            }
        }

        // Draw player collision points
        this.debugGraphics.lineStyle(2, canWalk ? 0x00ff00 : 0xff0000, 1);
        
        // Since the sprite is anchored at center (0.5), adjust the position to get the top-left corner
        const spriteLeft = nextPosition.x - playerSize/2;
        const spriteTop = nextPosition.y - playerSize/2;
        
        // Draw collision check points
        const points = [
            { x: spriteLeft + margin, y: spriteTop + margin },
            { x: spriteLeft + playerSize - margin, y: spriteTop + margin },
            { x: spriteLeft + margin, y: spriteTop + playerSize - margin },
            { x: spriteLeft + playerSize - margin, y: spriteTop + playerSize - margin }
        ];

        // Draw lines between points to show collision box
        this.debugGraphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.debugGraphics.lineTo(points[i].x, points[i].y);
        }
        this.debugGraphics.lineTo(points[0].x, points[0].y);

        // Draw points
        points.forEach(point => {
            this.debugGraphics.beginFill(0xffff00);
            this.debugGraphics.drawCircle(point.x, point.y, 2);
            this.debugGraphics.endFill();
        });

        // Draw center point of sprite for reference
        this.debugGraphics.beginFill(0x00ffff);
        this.debugGraphics.drawCircle(nextPosition.x, nextPosition.y, 2);
        this.debugGraphics.endFill();

        // Log debug info
        console.log(`Player position: (${nextPosition.x}, ${nextPosition.y})`);
        console.log(`Sprite bounds: (${spriteLeft}, ${spriteTop}) to (${spriteLeft + playerSize}, ${spriteTop + playerSize})`);
        console.log(`Tiles checked:`, tilesToCheck);
        console.log(`Can walk: ${canWalk}`);
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