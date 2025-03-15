import { test, expect } from "@playwright/test";
import { getPlayerPosition } from "./utils";

test.describe("Player Movement", () => {
   test.beforeEach(async ({ page }) => {
      await page.goto("/game.html");
      await page.evaluate(() => localStorage.clear());
      await page.fill("input[placeholder='Enter name']", "Ash");
      await page.click("button:has-text('Start Game')");
      await page.waitForTimeout(500); // Initial render delay
      await page.waitForFunction(() => (window as any).game !== undefined);
      // Ensure the page is active and focused
      await page.bringToFront();
   });

   test("should move player with WASD keys", async ({ page }) => {
      const initialPosition = await getPlayerPosition(page);

      expect(initialPosition).toEqual([480, 320]); // Default position (WORLD_BOUNDS / 2)

      await page.bringToFront();
      // Simulate moving right (D key) with a single press
      await page.keyboard.down("d");
      await page.waitForTimeout(25); // Wait for one frame
      await page.keyboard.up("d");
      //await page.pause();

      const positionAfterD = await getPlayerPosition(page);
      //await page.bringToFront();

      expect(positionAfterD[0]).toBeGreaterThan(480); // should be higher than original
      expect(positionAfterD[1]).toEqual(320); // should be unchanged

      // Simulate moving down (S key) with a single press
      await page.keyboard.down("s");
      await page.waitForTimeout(25); // Wait for one frame
      await page.keyboard.up("s");

      const positionAfterS = await getPlayerPosition(page);

      expect(positionAfterS[0]).toBeGreaterThan(480); // should be higher than original
      expect(positionAfterS[1]).toBeGreaterThan(320); // should be higher than original
   });
});
