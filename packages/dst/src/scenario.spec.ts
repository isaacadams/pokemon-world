import { test, expect } from "@playwright/test";

test.describe("Headless scenario assertions (devmode)", () => {
   test("walk_square ends near start position", async ({ page }) => {
      // Seed name to skip prompt and run scenario via query
      await page.goto("/devmode.html?name=Test&scenario=walk_square");
      await page.waitForFunction(() => (window as any).game && typeof (window as any).game.getPlayerPosition === 'function');

      // Give time for scheduled inputs to complete
      await page.waitForTimeout(1800);

      // Read final position from the Game API
      const pos = await page.evaluate(() => {
         const g: any = (window as any).game;
         return { x: g.getPlayerPosition().x, y: g.getPlayerPosition().y };
      });

      // Assert: after a square, should be close to starting tile
      // We don't expect exact equality due to per-frame movement and collision,
      // so allow a small threshold around the central tile
      const startX = 480;
      const startY = 320;
      const threshold = 96; // allow ~3 tiles tolerance due to continuous movement
      expect(Math.abs(pos.x - startX)).toBeLessThanOrEqual(threshold);
      expect(Math.abs(pos.y - startY)).toBeLessThanOrEqual(threshold);
   });
});


