import * as PIXI from 'pixi.js';

export class PC {
    public sprite: PIXI.Sprite;
    private isOpen: boolean = false;
    private interface: PIXI.Container;

    constructor(x: number, y: number) {
        // Create a blue rectangle for the PC
        const texture = PIXI.Texture.WHITE;
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.width = 48;
        this.sprite.height = 48;
        this.sprite.tint = 0x0000FF;
        this.sprite.x = x;
        this.sprite.y = y;

        // Create the PC interface container (initially hidden)
        this.interface = new PIXI.Container();
        this.interface.visible = false;
        
        // Create a background for the PC interface
        const background = new PIXI.Graphics();
        background.beginFill(0x333333, 0.9);
        background.drawRect(0, 0, 600, 400);
        background.endFill();
        this.interface.addChild(background);

        // Add title text
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 'white'
        });
        const title = new PIXI.Text('Pokémon Storage System', style);
        title.x = 20;
        title.y = 20;
        this.interface.addChild(title);

        // Center the interface on screen
        this.interface.x = (window.innerWidth - this.interface.width) / 2;
        this.interface.y = (window.innerHeight - this.interface.height) / 2;
    }

    public interact(): void {
        if (!this.isOpen) {
            this.openInterface();
        }
    }

    private openInterface(): void {
        this.isOpen = true;
        this.interface.visible = true;
        
        // Add close button functionality
        const closeButton = new PIXI.Text('X', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 'white'
        });
        closeButton.x = this.interface.width - 30;
        closeButton.y = 10;
        closeButton.eventMode = 'static';
        closeButton.cursor = 'pointer';
        closeButton.on('pointerdown', () => this.closeInterface());
        this.interface.addChild(closeButton);
    }

    private closeInterface(): void {
        this.isOpen = false;
        this.interface.visible = false;
    }

    public update(delta: number): void {
        // Add any animation or update logic here
    }

    public getInterface(): PIXI.Container {
        return this.interface;
    }
} 