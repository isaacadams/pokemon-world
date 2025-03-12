import * as PIXI from 'pixi.js';

interface TileInfo {
    x: number;
    y: number;
    id: number;
}

export class DebugOverlay {
    private container: PIXI.Container;
    private debugGraphics: PIXI.Graphics;
    private debugText: PIXI.Text;
    private debugMode: boolean = false;
    private verboseMode: boolean = false;
    private tileSize: number;
    private layerColors: number[] = [0xff0000, 0x0000ff]; // Red, Blue

    constructor(tileSize: number) {
        this.tileSize = tileSize;
        this.container = new PIXI.Container();

        // Graphics for highlighting
        this.debugGraphics = new PIXI.Graphics();
        this.debugGraphics.visible = false;

        // Text for tile IDs with a new color (e.g., yellow)
        this.debugText = new PIXI.Text('Debug Mode Off', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x00ffff, // Changed from 0xffffff (white) to 0xffff00 (yellow)
            stroke: 0x000000, // Black stroke for contrast
            strokeThickness: 2,
        });
        this.debugText.x = 10;
        this.debugText.y = 10;
        this.debugText.visible = false;

        this.container.addChild(this.debugGraphics, this.debugText);
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public update(
        collisionBox: { x: number; y: number; width: number; height: number },
        tiles: PIXI.Sprite[][][], // 3D array of tile sprites from TileMap
    ): void {
        if (!this.debugMode) {
            this.debugGraphics.clear();
            this.debugText.text = 'Debug Mode Off';
            return;
        }

        if (this.verboseMode) {
            console.log('DebugOverlay updating with collision box:', collisionBox);
        }

        this.debugGraphics.clear();
        let debugInfo = '';

        const startX = Math.floor(collisionBox.x / this.tileSize);
        const startY = Math.floor(collisionBox.y / this.tileSize);
        const endX = Math.floor((collisionBox.x + collisionBox.width - 1) / this.tileSize);
        const endY = Math.floor((collisionBox.y + collisionBox.height - 1) / this.tileSize);

        if (this.verboseMode) {
            console.log(`Tiles checked: (${startX},${startY}) to (${endX},${endY})`);
        }

        for (let layer = 0; layer < tiles.length; layer++) {
            debugInfo += `Layer ${layer}:\n`;
            const touchedTiles: TileInfo[] = [];

            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (y < 0 || y >= tiles[layer].length || x < 0 || x >= tiles[layer][y].length) continue;

                    const tile = tiles[layer][y][x];
                    if (!tile) continue;

                    const tileX = Math.floor(tile.texture.frame.x / this.tileSize);
                    const tileY = Math.floor(tile.texture.frame.y / this.tileSize);
                    const tileId = tileY * 8 + tileX + 1; // Assumes 8 tiles wide in tileset

                    touchedTiles.push({ x, y, id: tileId });

                    this.debugGraphics.lineStyle(2, this.layerColors[layer % this.layerColors.length], 0.8);
                    this.debugGraphics.drawRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }

            debugInfo += touchedTiles.length > 0
                ? touchedTiles.map(t => `(${t.x},${t.y}): ${t.id}`).join(', ') + '\n'
                : 'No tiles touched\n';
        }

        this.debugText.text = debugInfo;

        // Draw collision box
        this.debugGraphics.lineStyle(2, 0xffff00, 1); // Yellow
        this.debugGraphics.drawRect(collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height);

        if (this.verboseMode) {
            console.log('Debug text set to:', debugInfo);
        }
    }

    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        this.debugGraphics.visible = enabled;
        this.debugText.visible = enabled;
        if (!enabled) {
            this.debugGraphics.clear();
            this.debugText.text = 'Debug Mode Off';
        }
        if (this.verboseMode) {
            console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    public setVerboseMode(enabled: boolean): void {
        this.verboseMode = enabled;
    }
}