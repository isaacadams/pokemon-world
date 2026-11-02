import { test, expect, Page } from "@playwright/test";
import { getPlayerPosition, startGame } from "./utils";

// Holds a key until the player has moved as expected, so the test doesn't depend on frame timing.
async function holdUntil(page: Page, key: string, moved: (position: number[]) => boolean) {
   await page.keyboard.down(key);
   await expect.poll(async () => moved(await getPlayerPosition(page))).toBe(true);
   await page.keyboard.up(key);
   return getPlayerPosition(page);
}

test.describe("Player Movement", () => {
   test.beforeEach(async ({ page }) => {
      await startGame(page, "Ash");
      // Ensure the page is active and focused
      await page.bringToFront();
   });

   test("should move player with WASD keys", async ({ page }) => {
      const initialPosition = await getPlayerPosition(page);

      expect(initialPosition).toEqual([480, 320]); // Default position (WORLD_BOUNDS / 2)

      const positionAfterD = await holdUntil(page, "d", ([x]) => x > 480);
      expect(positionAfterD[0]).toBeGreaterThan(480); // should be higher than original
      expect(positionAfterD[1]).toEqual(320); // should be unchanged

      const positionAfterS = await holdUntil(page, "s", ([, y]) => y > 320);
      expect(positionAfterS[0]).toBeGreaterThan(480); // should be higher than original
      expect(positionAfterS[1]).toBeGreaterThan(320); // should be higher than original
   });
});
