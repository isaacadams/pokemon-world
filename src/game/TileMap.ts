import * as PIXI from 'pixi.js';

export class TileMap {
    private container: PIXI.Container;
    private tileSize: number = 32; // We can adjust this based on your tileset
    private tileset: PIXI.BaseTexture;
    private tiles: PIXI.Sprite[][] = [];

    constructor(tilesetPath: string, mapWidth: number, mapHeight: number) {
        this.container = new PIXI.Container();
        this.tileset = PIXI.BaseTexture.from(tilesetPath);

        // Create initial grass tiles
        for (let y = 0; y < mapHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < mapWidth; x++) {
                // Create a new tile sprite
                const tile = new PIXI.Sprite(new PIXI.Texture(this.tileset, new PIXI.Rectangle(0, 0, this.tileSize, this.tileSize)));
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