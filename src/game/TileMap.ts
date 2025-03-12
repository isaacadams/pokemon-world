import * as PIXI from 'pixi.js';
import { TilesetDefinition } from '../types/tiles';
import { tilesetConfig } from '../config/tileset';

export class TileMap {
    private container: PIXI.Container;
    private tileSize: number;
    private tileset: PIXI.BaseTexture;
    private tiles: PIXI.Sprite[][] = [];
    private config: TilesetDefinition;

    constructor(tilesetPath: string, mapWidth: number, mapHeight: number) {
        this.container = new PIXI.Container();
        this.config = tilesetConfig;
        this.tileSize = this.config.tileSize;
        this.tileset = PIXI.BaseTexture.from(tilesetPath);

        // Create initial grass tiles
        for (let y = 0; y < mapHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < mapWidth; x++) {
                const defaultTile = this.config.tiles.GRASS_1;
                const tile = new PIXI.Sprite(
                    new PIXI.Texture(
                        this.tileset,
                        new PIXI.Rectangle(
                            defaultTile.coordinate.x * this.tileSize,
                            defaultTile.coordinate.y * this.tileSize,
                            this.tileSize,
                            this.tileSize
                        )
                    )
                );
                tile.x = x * this.tileSize;
                tile.y = y * this.tileSize;
                this.tiles[y][x] = tile;
                this.container.addChild(tile);
            }
        }
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public setTileByType(x: number, y: number, tileType: keyof typeof tilesetConfig.tiles): void {
        if (y < 0 || y >= this.tiles.length || x < 0 || x >= this.tiles[y].length) {
            return;
        }

        const tileConfig = this.config.tiles[tileType];
        if (!tileConfig) {
            console.warn(`Tile type ${tileType} not found in config`);
            return;
        }

        const tile = this.tiles[y][x];
        tile.texture = new PIXI.Texture(
            this.tileset,
            new PIXI.Rectangle(
                tileConfig.coordinate.x * this.tileSize,
                tileConfig.coordinate.y * this.tileSize,
                this.tileSize,
                this.tileSize
            )
        );
    }

    public setTile(x: number, y: number, tileX: number, tileY: number): void {
        if (y < 0 || y >= this.tiles.length || x < 0 || x >= this.tiles[y].length) {
            return;
        }

        const tile = this.tiles[y][x];
        tile.texture = new PIXI.Texture(
            this.tileset,
            new PIXI.Rectangle(
                tileX * this.tileSize,
                tileY * this.tileSize,
                this.tileSize,
                this.tileSize
            )
        );
    }

    public isTileWalkable(x: number, y: number): boolean {
        if (y < 0 || y >= this.tiles.length || x < 0 || x >= this.tiles[y].length) {
            return false;
        }

        // Find the tile type by comparing textures
        for (const [tileType, tileConfig] of Object.entries(this.config.tiles)) {
            const tileX = tileConfig.coordinate.x * this.tileSize;
            const tileY = tileConfig.coordinate.y * this.tileSize;
            
            const currentFrame = this.tiles[y][x].texture.frame;
            if (currentFrame.x === tileX && 
                currentFrame.y === tileY && 
                currentFrame.width === this.tileSize && 
                currentFrame.height === this.tileSize) {
                return tileConfig.walkable;
            }
        }

        return false; // Default to not walkable if tile type not found
    }

    public getTileSize(): number {
        return this.tileSize;
    }

    public getWorldWidth(): number {
        return this.tiles[0]?.length * this.tileSize || 0;
    }

    public getWorldHeight(): number {
        return this.tiles.length * this.tileSize || 0;
    }
} 