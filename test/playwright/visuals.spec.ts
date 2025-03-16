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
});
