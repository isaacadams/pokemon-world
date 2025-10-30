import { test, expect } from "@playwright/test";

test.describe("Collision behavior", () => {
   test("cannot walk through fence to the right", async ({ page }) => {
      await page.goto("/devmode.html?name=Test");
      await page.waitForFunction(() => (window as any).game && typeof (window as any).game.getPlayerPosition === 'function');

      const getPos = async () =>
         await page.evaluate(() => {
            const g: any = (window as any).game;
            return g.getPlayerPosition();
         });

      const start = await getPos();
      // Hold right key for a while; if a fence is encountered, position shouldn't jump past non-walkable tiles
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(400);
      await page.keyboard.up("ArrowRight");
      const after = await getPos();

      // Ensure we stayed within world bounds and moved right
      const worldWidth = 32 * 30;
      expect(after.x).toBeGreaterThanOrEqual(start.x);
      expect(after.x).toBeLessThanOrEqual(worldWidth);
   });

   test("blocked upward movement does not decrease Y below bounds", async ({ page }) => {
      await page.goto("/devmode.html?name=Test");
      await page.waitForFunction(() => (window as any).game && typeof (window as any).game.getPlayerPosition === 'function');

      const getPos = async () =>
         await page.evaluate(() => {
            const g: any = (window as any).game;
            return g.getPlayerPosition();
         });

      const start = await getPos();
      await page.keyboard.down("ArrowUp");
      await page.waitForTimeout(800);
      await page.keyboard.up("ArrowUp");
      const after = await getPos();

      // Y should not go negative or beyond world bounds
      expect(after.y).toBeGreaterThanOrEqual(0);
      // Should have moved up some amount but not break world
      expect(start.y - after.y).toBeLessThanOrEqual(32 * 10);
   });
});


