import { test, expect } from "@playwright/test";
import { enterAsGuestMode } from "./utils";

test.describe("Visual Rendering", () => {
   test("should render guest mode dialog correctly", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await enterAsGuestMode(page);

      // Capture screenshot of the dialog
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot("guest-mode-dialog.png");
   });

   test("should render tilemap and player correctly", async ({ page }) => {
      await page.goto("/game.html");
      await page.evaluate(() => localStorage.clear());
      await page.fill("input[placeholder='Enter name']", "Ash");
      await page.click("button:has-text('Start Game')");
      await page.waitForTimeout(500); // Initial render delay
      await page.waitForFunction(() => (window as any).game !== undefined);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot("game-tilemap.png");
   });

   test("renderer config prevents tile seams (roundPixels, integers)", async ({ page }) => {
      await page.goto("/game.html");
      await page.evaluate(() => localStorage.clear());
      await page.fill("input[placeholder='Enter name']", "Ash");
      await page.click("button:has-text('Start Game')");
      await page.waitForFunction(() => (window as any).game !== undefined);

      const result = await page.evaluate(() => {
         const g: any = (window as any).game;
         const roundPixels = !!g?.app?.renderer?.roundPixels;
         const gx = g?.gameContainer?.x;
         const gy = g?.gameContainer?.y;
         const integers = Number.isInteger(gx) && Number.isInteger(gy);
         // find a tile sprite and inspect its baseTexture sampling flags
         let textureOk = false;
         try {
            const stage: any = g.app.stage;
            const sprites: any[] = [];
            const walk = (node: any) => {
               if (!node) return;
               if (node.texture?.baseTexture) sprites.push(node);
               if (node.children) node.children.forEach(walk);
            };
            walk(stage);
            const tileSprite = sprites.find(s => s.texture?.baseTexture);
            const bt = tileSprite?.texture?.baseTexture;
            textureOk = !!bt && bt.scaleMode === (PIXI as any).SCALE_MODES.NEAREST && bt.mipmap === (PIXI as any).MIPMAP_MODES.OFF && bt.wrapMode === (PIXI as any).WRAP_MODES.CLAMP;
         } catch {}
         return { roundPixels, integers, textureOk };
      });

      expect(result.roundPixels).toBeTruthy();
      expect(result.integers).toBeTruthy();
      expect(result.textureOk).toBeTruthy();
   });

   test("no 1px black seams along tile boundaries at odd viewport sizes", async ({ page }) => {
      await page.setViewportSize({ width: 1001, height: 701 });
      await page.goto("/game.html");
      await page.evaluate(() => localStorage.clear());
      await page.fill("input[placeholder='Enter name']", "Misty");
      await page.click("button:has-text('Start Game')");
      await page.waitForFunction(() => (window as any).game !== undefined);
      await page.waitForTimeout(100);

      const seamStats = await page.evaluate(() => {
         const g: any = (window as any).game;
         const canvas: HTMLCanvasElement = g.app.view;
         const tileSize = 32;
         const gcx = g.gameContainer.x;
         const gcy = g.gameContainer.y;
         const worldW = 32 * 30;
         const worldH = 32 * 20;

         // Draw current frame into a 2D canvas to read pixels
         const copy = document.createElement("canvas");
         copy.width = canvas.width;
         copy.height = canvas.height;
         const ctx = copy.getContext("2d")!;
         ctx.drawImage(canvas, 0, 0);

         const isBlack = (r: number, b: number, g: number, a: number) => a === 255 && r === 0 && g === 0 && b === 0;
         let verticalSeamCount = 0;
         let horizontalSeamCount = 0;

         // Sample vertical tile boundaries
         for (let x = gcx + tileSize; x < gcx + worldW; x += tileSize) {
            let blackRun = 0;
            for (let y = gcy + 8; y < gcy + worldH - 8; y += 1) {
               const p = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
               if (isBlack(p[0], p[2], p[1], p[3])) blackRun++; else blackRun = 0;
               if (blackRun >= 2) { verticalSeamCount++; break; }
            }
         }

         // Sample horizontal tile boundaries
         for (let y = gcy + tileSize; y < gcy + worldH; y += tileSize) {
            let blackRun = 0;
            for (let x = gcx + 8; x < gcx + worldW - 8; x += 1) {
               const p = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
               if (isBlack(p[0], p[2], p[1], p[3])) blackRun++; else blackRun = 0;
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
