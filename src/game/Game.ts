import * as PIXI from 'pixi.js';
import { Player } from './Player';
import { PC } from './PC';
import { TileMap } from './TileMap';
import tileset from '@assets/tilesets/tileset.png';

// Types
interface Point {
    x: number;
    y: number;
}

interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CollisionBox {
    points: Point[];
    tiles: Point[];
    canWalk: boolean;
}

// Constants
const GAME_CONSTANTS = {
    PLAYER_SIZE: 32,
    COLLISION_MARGIN: 8,
    WORLD_BOUNDS: {
        x: 0,
        y: 0,
        width: 800,
        height: 600
    }
} as const;

export class Game {
    private app: PIXI.Application;
    private player!: Player;
    private pc!: PC;
    private gameContainer: PIXI.Container;
    private tileMap!: TileMap;
    private debugGraphics!: PIXI.Graphics;
    private debugMode: boolean = false;

    constructor() {
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
        });

        this.gameContainer = new PIXI.Container();
        this.app.stage.addChild(this.gameContainer);

        this.initializeGame();
        this.setupEventListeners();
    }

    private initializeGame(): void {
        this.initializeTileMap();
        this.initializeGameObjects();
        this.initializeDebugGraphics();
        this.centerGameContainer();
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onResize.bind(this));
        this.app.ticker.add(this.gameLoop.bind(this));

        // Add debug mode toggle
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === '`') { // Toggle debug mode with backtick key
                this.debugMode = !this.debugMode;
                this.debugGraphics.visible = this.debugMode;
                this.pc.setDebugMode(this.debugMode);
                console.log('Debug mode:', this.debugMode ? 'enabled' : 'disabled');
            }
        });
    }

    private initializeTileMap(): void {
        this.tileMap = new TileMap(
            tileset,
            Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.width / GAME_CONSTANTS.PLAYER_SIZE),
            Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.height / GAME_CONSTANTS.PLAYER_SIZE)
        );
        this.gameContainer.addChild(this.tileMap.getContainer());
        this.setupInitialMap();
    }

    private initializeGameObjects(): void {
        // Initialize player at center of world
        this.player = new Player(
            GAME_CONSTANTS.WORLD_BOUNDS.width / 2,
            GAME_CONSTANTS.WORLD_BOUNDS.height / 2
        );

        // Initialize PC with current debug mode
        this.pc = new PC(100, 100, this.debugMode);

        // Add objects to container in correct order
        this.gameContainer.addChild(this.pc.getInteractionZone());
        this.gameContainer.addChild(this.player.sprite);
        this.gameContainer.addChild(this.pc.sprite);
        this.app.stage.addChild(this.pc.getInterface());
    }

    private initializeDebugGraphics(): void {
        this.debugGraphics = new PIXI.Graphics();
        this.debugGraphics.visible = this.debugMode;
        this.gameContainer.addChild(this.debugGraphics);
    }

    private gameLoop(deltaTime: number): void {
        const nextPosition = this.player.getNextPosition(deltaTime);
        const collisionBox = this.calculateCollisionBox(nextPosition);

        if (collisionBox.canWalk) {
            this.player.update(deltaTime);
        }

        this.updatePCInteraction();
        this.updateDebug(nextPosition, collisionBox);
    }

    private updatePCInteraction(): void {
        const isInRange = this.pc.isPlayerInRange(this.player.getBounds());
        this.pc.getInteractionZone().alpha = isInRange ? 0.3 : 0;
        this.pc.update(0); // Update PC state
    }

    private updateDebug(position: Point, collisionBox: CollisionBox): void {
        if (!this.debugMode) {
            this.debugGraphics.clear();
            return;
        }

        this.debugGraphics.clear();
        this.drawTileGrid();
        this.drawCollisionBox(collisionBox);
        
        if (this.debugMode) {
            console.log({
                position: `(${position.x}, ${position.y})`,
                tiles: collisionBox.tiles,
                canWalk: collisionBox.canWalk
            });
        }
    }

    private calculateCollisionBox(position: Point): CollisionBox {
        const spriteLeft = position.x - GAME_CONSTANTS.PLAYER_SIZE/2;
        const spriteTop = position.y - GAME_CONSTANTS.PLAYER_SIZE/2;

        // Calculate collision points
        const points = [
            { x: spriteLeft + GAME_CONSTANTS.COLLISION_MARGIN, y: spriteTop + GAME_CONSTANTS.COLLISION_MARGIN },
            { x: spriteLeft + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN, y: spriteTop + GAME_CONSTANTS.COLLISION_MARGIN },
            { x: spriteLeft + GAME_CONSTANTS.COLLISION_MARGIN, y: spriteTop + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN },
            { x: spriteLeft + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN, y: spriteTop + GAME_CONSTANTS.PLAYER_SIZE - GAME_CONSTANTS.COLLISION_MARGIN }
        ];

        // Convert points to tile coordinates
        const tiles = points.map(point => ({
            x: Math.floor(point.x / this.tileMap.getTileSize()),
            y: Math.floor(point.y / this.tileMap.getTileSize())
        }));

        // Check if all tiles are walkable
        const canWalk = this.isWithinBounds(position) && 
            tiles.every(tile => this.tileMap.isTileWalkable(tile.x, tile.y));

        return { points, tiles, canWalk };
    }

    private drawTileGrid(): void {
        const tileSize = this.tileMap.getTileSize();
        const mapWidth = Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.width / tileSize);
        const mapHeight = Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.height / tileSize);

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const isWalkable = this.tileMap.isTileWalkable(x, y);
                this.debugGraphics.lineStyle(1, isWalkable ? 0x00ff00 : 0xff0000, 0.3);
                this.debugGraphics.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }

    private drawCollisionBox(collisionBox: CollisionBox): void {
        // Draw collision box outline
        this.debugGraphics.lineStyle(2, collisionBox.canWalk ? 0x00ff00 : 0xff0000, 1);
        
        // Draw lines between points
        const { points } = collisionBox;
        this.debugGraphics.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(point => {
            this.debugGraphics.lineTo(point.x, point.y);
        });
        this.debugGraphics.lineTo(points[0].x, points[0].y);

        // Draw collision points
        points.forEach(point => {
            this.debugGraphics.beginFill(0xffff00);
            this.debugGraphics.drawCircle(point.x, point.y, 2);
            this.debugGraphics.endFill();
        });

        // Draw sprite center point
        const centerX = points[0].x + (points[1].x - points[0].x) / 2;
        const centerY = points[0].y + (points[2].y - points[0].y) / 2;
        this.debugGraphics.beginFill(0x00ffff);
        this.debugGraphics.drawCircle(centerX, centerY, 2);
        this.debugGraphics.endFill();
    }

    private isWithinBounds(position: Point): boolean {
        const margin = GAME_CONSTANTS.PLAYER_SIZE/2;
        const bounds = GAME_CONSTANTS.WORLD_BOUNDS;
        return position.x >= bounds.x + margin &&
               position.x <= bounds.width - margin &&
               position.y >= bounds.y + margin &&
               position.y <= bounds.height - margin;
    }

    private centerGameContainer(): void {
        this.gameContainer.x = (window.innerWidth - GAME_CONSTANTS.WORLD_BOUNDS.width) / 2;
        this.gameContainer.y = (window.innerHeight - GAME_CONSTANTS.WORLD_BOUNDS.height) / 2;
    }

    private onResize(): void {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
        this.centerGameContainer();
    }

    public start(): void {
        document.getElementById('game-container')?.appendChild(this.app.view as HTMLCanvasElement);
    }

    private setupInitialMap(): void {
        const mapWidth = Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.width / GAME_CONSTANTS.PLAYER_SIZE);
        const mapHeight = Math.ceil(GAME_CONSTANTS.WORLD_BOUNDS.height / GAME_CONSTANTS.PLAYER_SIZE);

        // Fill with grass tiles
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const grassType = Math.random() < 0.33 ? 'GRASS_1' : 
                                Math.random() < 0.5 ? 'GRASS_2' : 'GRASS_3';
                this.tileMap.setTileByType(x, y, grassType);
            }
        }

        this.addBoulders(mapWidth, mapHeight);
        this.createCenterPaths(mapWidth, mapHeight);
    }

    private addBoulders(mapWidth: number, mapHeight: number): void {
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
    }

    private createCenterPaths(mapWidth: number, mapHeight: number): void {
        const centerX = Math.floor(mapWidth / 2);
        const centerY = Math.floor(mapHeight / 2);
        
        // Create horizontal path
        for (let x = 0; x < mapWidth; x++) {
            for (let offset = -1; offset <= 1; offset++) {
                const y = centerY + offset;
                if (y >= 0 && y < mapHeight) {
                    this.tileMap.setTileByType(x, y, 'GRASS_1');
                }
            }
        }

        // Create vertical path
        for (let y = 0; y < mapHeight; y++) {
            for (let offset = -1; offset <= 1; offset++) {
                const x = centerX + offset;
                if (x >= 0 && x < mapWidth) {
                    this.tileMap.setTileByType(x, y, 'GRASS_1');
                }
            }
        }
    }
} 