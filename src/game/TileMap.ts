import * as PIXI from 'pixi.js';
import { TilesetDefinition } from '../types/tiles';
import { tilesetConfig } from '../config/tileset';
import map1Data from '@assets/tilesets/map1.tmx';

interface TmxLayer {
    data: number[];
    width: number;
    height: number;
}

export class TileMap {
    private container: PIXI.Container;
    private tileSize: number;
    private tileset: PIXI.BaseTexture;
    private tiles: PIXI.Sprite[][] = [];
    private config: TilesetDefinition;
    private layers: PIXI.Container[] = [];

    constructor(tilesetPath: string, mapWidth: number, mapHeight: number) {
        this.container = new PIXI.Container();
        this.config = tilesetConfig;
        this.tileSize = this.config.tileSize;
        this.tileset = PIXI.BaseTexture.from(tilesetPath);

        // Parse TMX data
        const parser = new DOMParser();
        const tmx = parser.parseFromString(map1Data, 'text/xml');
        
        // Create layers
        const layerElements = tmx.getElementsByTagName('layer');
        for (let i = 0; i < layerElements.length; i++) {
            const layer = layerElements[i];
            const layerContainer = new PIXI.Container();
            this.layers.push(layerContainer);
            this.container.addChild(layerContainer);

            // Parse layer data
            const dataElement = layer.getElementsByTagName('data')[0];
            const tileIds = dataElement.textContent!
                .trim()
                .split(',')
                .map(id => parseInt(id.trim()));

            // Create sprites for each tile
            const width = parseInt(layer.getAttribute('width')!);
            const height = parseInt(layer.getAttribute('height')!);
            
            if (i === 0) { // Base layer
                this.tiles = Array(height).fill(null).map(() => Array(width));
            }

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tileId = tileIds[y * width + x];
                    if (tileId === 0) continue; // Skip empty tiles

                    const tile = new PIXI.Sprite(
                        new PIXI.Texture(
                            this.tileset,
                            new PIXI.Rectangle(
                                ((tileId - 1) % 8) * this.tileSize,
                                Math.floor((tileId - 1) / 8) * this.tileSize,
                                this.tileSize,
                                this.tileSize
                            )
                        )
                    );
                    tile.x = x * this.tileSize;
                    tile.y = y * this.tileSize;
                    
                    if (i === 0) { // Store base layer tiles for collision
                        this.tiles[y][x] = tile;
                    }
                    
                    layerContainer.addChild(tile);
                }
            }
        }
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public isTileWalkable(x: number, y: number): boolean {
        if (y < 0 || y >= this.tiles.length || x < 0 || x >= this.tiles[y].length) {
            return false;
        }

        const tile = this.tiles[y][x];
        if (!tile) return true; // Empty tiles are walkable

        // Get tile ID from texture frame
        const tileX = tile.texture.frame.x / this.tileSize;
        const tileY = tile.texture.frame.y / this.tileSize;
        const tileId = tileY * 8 + tileX + 1;

        // Define walkable tile IDs
        const walkableTileIds = [9, 10, 11, 26]; // grass tiles
        return walkableTileIds.includes(tileId);
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