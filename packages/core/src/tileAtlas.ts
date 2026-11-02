import * as PIXI from "pixi.js";

// Every WebGL GPU supports at least this texture size; the overworld tileset
// (256x12000) exceeds the 8192 limit common on laptops, phones and headless
// Chromium, where uploading it fails and no tiles render.
const MAX_TEXTURE_SIZE = 4096;

/**
 * Serves tile textures from a tall tileset image, split into chunks no taller
 * than MAX_TEXTURE_SIZE. Textures are usable immediately; chunks are filled
 * once the image loads.
 */
export class TileAtlas {
   private readonly image = new Image();
   private readonly chunks = new Map<number, { canvas: HTMLCanvasElement; base: PIXI.TextureSource }>();
   private readonly rowsPerChunk: number;
   readonly loaded: Promise<void>;

   constructor(
      imageUrl: string,
      private readonly tileSize: number,
      private readonly columns = 8
   ) {
      this.rowsPerChunk = Math.floor(MAX_TEXTURE_SIZE / tileSize);
      this.loaded = new Promise((resolve, reject) => {
         this.image.onload = () => {
            this.chunks.forEach((chunk, index) => this.fill(chunk, index));
            resolve();
         };
         this.image.onerror = () => reject(new Error(`failed to load tileset ${imageUrl}`));
      });
      this.image.src = imageUrl;
   }

   get isLoaded(): boolean {
      return this.image.complete && this.image.naturalWidth > 0;
   }

   texture(id: number): PIXI.Texture {
      const row = Math.floor(id / this.columns);
      const { base } = this.chunk(Math.floor(row / this.rowsPerChunk));
      const frame = new PIXI.Rectangle(
         (id % this.columns) * this.tileSize,
         (row % this.rowsPerChunk) * this.tileSize,
         this.tileSize,
         this.tileSize
      );
      return new PIXI.Texture({ source: base, frame });
   }

   baseTextures(): PIXI.TextureSource[] {
      return [...this.chunks.values()].map(c => c.base);
   }

   private chunk(index: number) {
      let chunk = this.chunks.get(index);
      if (!chunk) {
         const canvas = document.createElement("canvas");
         canvas.width = this.columns * this.tileSize;
         canvas.height = this.rowsPerChunk * this.tileSize;
         // Crisp sampling avoids seams between tiles.
         const base = new PIXI.CanvasSource({
            resource: canvas,
            scaleMode: "nearest",
            autoGenerateMipmaps: false,
            addressMode: "clamp-to-edge"
         });
         chunk = { canvas, base };
         this.chunks.set(index, chunk);
         if (this.isLoaded) this.fill(chunk, index);
      }
      return chunk;
   }

   private fill({ canvas, base }: { canvas: HTMLCanvasElement; base: PIXI.TextureSource }, index: number) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.image, 0, -index * canvas.height);
      base.update();
   }
}
