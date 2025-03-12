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
    private tiles: PIXI.Sprite[][][] = []; // Array of layers, each containing a 2D grid of sprites
    private config: TilesetDefinition;
    private layers: PIXI.Container[] = [];
    private debugMode: boolean = false;

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
            
            // Initialize the layer's tile array
            this.tiles[i] = Array(height).fill(null).map(() => Array(width).fill(null));

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
                    
                    // Store tile in the appropriate layer
                    this.tiles[i][y][x] = tile;
                    layerContainer.addChild(tile);
                }
            }
        }
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public isTileWalkable(x: number, y: number): boolean {
        if (y < 0 || y >= this.tiles[0].length || x < 0 || x >= this.tiles[0][y].length) {
            return false;
        }

        // Check both layers for non-walkable tiles
        for (let layer = 0; layer < this.tiles.length; layer++) {
            const tile = this.tiles[layer][y][x];
            if (!tile) continue; // Skip empty tiles

            // Get tile ID from texture frame
            const tileX = Math.floor(tile.texture.frame.x / this.tileSize);
            const tileY = Math.floor(tile.texture.frame.y / this.tileSize);
            const tileId = tileY * 8 + tileX + 1; // 8 is the number of columns in the tileset

            if (this.debugMode) {
                console.log(`Checking tile at (${x},${y}) Layer ${layer}: ID=${tileId}, frame=(${tileX},${tileY})`);
            }

            // Check if the tile has the canWalk property
            const tileElement = this.getTileElement(tileId);
            if (tileElement) {
                const canWalkProperty = tileElement.querySelector('property[name="canWalk"]');
                if (canWalkProperty && canWalkProperty.getAttribute('value') === 'true') {
                    if (this.debugMode) {
                        console.log(`Tile ${tileId} in layer ${layer} is walkable (canWalk property)`);
                    }
                    continue;
                }
            }

            // Define non-walkable tile ranges for tiles without properties
            const nonWalkableTiles = [
                // Pokemon Center building
                [105, 109], // Top row
                [113, 117], // Second row
                [121, 125], // Third row
                [129, 133], // Fourth row
                [137, 141], // Fifth row
                
                // Trees and borders
                [346, 348], // Tree tops
                [354, 356], // Tree middles
                [362, 364], // Tree bottoms
                
                // Special tiles
                [82], // Barrier/wall
                [97], // Special barrier
                [714, 715], // Decorative elements
                [721, 723],
                [729, 731],
                [737, 739],
                [801, 802], // Additional barriers
                [809, 810],
                [2566, 2567], // Additional decorative elements
                [2574, 2575],
                [2582, 2583]
            ];

            // Check if the tile ID falls within any of the non-walkable ranges
            for (const range of nonWalkableTiles) {
                if (range.length === 1) {
                    if (tileId === range[0]) {
                        if (this.debugMode) {
                            console.log(`Tile ${tileId} in layer ${layer} is non-walkable (exact match)`);
                        }
                        return false;
                    }
                } else if (range.length === 2) {
                    if (tileId >= range[0] && tileId <= range[1]) {
                        if (this.debugMode) {
                            console.log(`Tile ${tileId} in layer ${layer} is non-walkable (in range ${range[0]}-${range[1]})`);
                        }
                        return false;
                    }
                }
            }
        }

        // If we get here, no non-walkable tiles were found in any layer
        if (this.debugMode) {
            console.log(`Position (${x},${y}) is walkable`);
        }
        return true;
    }

    private getTileElement(tileId: number): Element | null {
        const parser = new DOMParser();
        const tmx = parser.parseFromString(map1Data, 'text/xml');
        return tmx.querySelector(`tile[id="${tileId}"]`);
    }

    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
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