import { test, expect } from "@playwright/test";
import { enterAsGuestMode, freezeFrame, startGame, waitForGame } from "./utils";

// Tileset sampling flags (pixi.js v8 TextureSource).
const SCALE_MODE_NEAREST = "nearest";
const MIPMAPS = false;
const ADDRESS_CLAMP = "clamp-to-edge";

test.describe("Visual Rendering", () => {
   test("should render guest mode dialog correctly", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await enterAsGuestMode(page);
      // The dialog sits over the running game; freeze it for a deterministic frame.
      await waitForGame(page);
      await freezeFrame(page);
      await page.evaluate(() => document.fonts.ready);

      await expect(page).toHaveScreenshot("guest-mode-dialog.png");
   });

   test("should render tilemap and player correctly", async ({ page }) => {
      await startGame(page, "Ash");
      await freezeFrame(page);

      await expect(page).toHaveScreenshot("game-tilemap.png");
   });

   test("tilemap renders (tileset fits within WebGL texture limits)", async ({ page }) => {
      await startGame(page, "Ash");

      const result = await page.evaluate(() => {
         const g: any = (window as any).game;
         const sizes = g.tileMap.getTilesetTextures().map((t: any) => Math.max(t.width, t.height));

         // Render and read back in the same task; WebGL clears the buffer after compositing.
         g.app.renderer.render(g.app.stage);
         const canvas: HTMLCanvasElement = g.app.canvas;
         const copy = document.createElement("canvas");
         copy.width = canvas.width;
         copy.height = canvas.height;
         const ctx = copy.getContext("2d")!;
         ctx.drawImage(canvas, 0, 0);
         const world = ctx.getImageData(g.gameContainer.x, g.gameContainer.y, 32 * 30, 32 * 20).data;
         let black = 0;
         for (let i = 0; i < world.length; i += 4) if (world[i] === 0 && world[i + 1] === 0 && world[i + 2] === 0) black++;
         return { sizes, blackRatio: black / (world.length / 4) };
      });

      expect(result.sizes.length).toBeGreaterThan(0);
      for (const size of result.sizes) expect(size).toBeLessThanOrEqual(4096);
      expect(result.blackRatio).toBeLessThan(0.1);
   });

   test("renderer config prevents tile seams (roundPixels, integers)", async ({ page }) => {
      await startGame(page, "Ash");

      const result = await page.evaluate(() => {
         const g: any = (window as any).game;
         const textures = g.tileMap.getTilesetTextures();
         return {
            roundPixels: !!g.app.renderer.roundPixels,
            integers: Number.isInteger(g.gameContainer.x) && Number.isInteger(g.gameContainer.y),
            sampling: textures.map((t: any) => [t.scaleMode, t.autoGenerateMipmaps, t.addressMode])
         };
      });

      expect(result.roundPixels).toBe(true);
      expect(result.integers).toBe(true);
      expect(result.sampling.length).toBeGreaterThan(0);
      for (const sampling of result.sampling) expect(sampling).toEqual([SCALE_MODE_NEAREST, MIPMAPS, ADDRESS_CLAMP]);
   });

   test("no 1px black seams along tile boundaries at odd viewport sizes", async ({ page }) => {
      await page.setViewportSize({ width: 1001, height: 701 });
      await startGame(page, "Misty");
      await freezeFrame(page);

      const seamStats = await page.evaluate(() => {
         const g: any = (window as any).game;
         const canvas: HTMLCanvasElement = g.app.canvas;
         const tileSize = 32;
         const gcx = g.gameContainer.x;
         const gcy = g.gameContainer.y;
         const worldW = 32 * 30;
         const worldH = 32 * 20;

         // Render and read back in the same task; WebGL clears the buffer after compositing.
         g.app.renderer.render(g.app.stage);
         const copy = document.createElement("canvas");
         copy.width = canvas.width;
         copy.height = canvas.height;
         const ctx = copy.getContext("2d")!;
         ctx.drawImage(canvas, 0, 0);
         const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
         const isBlack = (x: number, y: number) => {
            const i = (Math.round(y) * copy.width + Math.round(x)) * 4;
            return pixels[i + 3] === 255 && pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0;
         };

         let verticalSeamCount = 0;
         let horizontalSeamCount = 0;

         // Sample vertical tile boundaries
         for (let x = gcx + tileSize; x < gcx + worldW; x += tileSize) {
            let blackRun = 0;
            for (let y = gcy + 8; y < gcy + worldH - 8; y += 1) {
               blackRun = isBlack(x, y) ? blackRun + 1 : 0;
               if (blackRun >= 2) { verticalSeamCount++; break; }
            }
         }

         // Sample horizontal tile boundaries
         for (let y = gcy + tileSize; y < gcy + worldH; y += tileSize) {
            let blackRun = 0;
            for (let x = gcx + 8; x < gcx + worldW - 8; x += 1) {
               blackRun = isBlack(x, y) ? blackRun + 1 : 0;
               if (blackRun >= 2) { horizontalSeamCount++; break; }
            }
         }

         return { verticalSeamCount, horizontalSeamCount };
      });

      // Expect no detected 1px black seams across tile boundaries
      expect(seamStats.verticalSeamCount).toBe(0);
      expect(seamStats.horizontalSeamCount).toBe(0);
   });
});
