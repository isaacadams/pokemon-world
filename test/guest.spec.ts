import { test, expect } from "@playwright/test";
import { enterAsGuestMode, getGuestModeNamePrompt } from "./utils";

test.describe("Guest Mode Flow", () => {
   test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
   });

   test("should display guest mode dialog and submit name", async ({ page }) => {
      await enterAsGuestMode(page);

      const input = await getGuestModeNamePrompt(page);
      const button = await page.$("button:has-text('Start Game')");
      expect(input).toBeTruthy();
      expect(button).toBeTruthy();

      await page.fill("input[placeholder='Enter name']", "Ash");
      await page.click("button:has-text('Start Game')");

      // Verify localStorage has the player data (correct key: "data")
      const storedData = await page.evaluate(() => localStorage.getItem("data"));
      expect(storedData).toBeTruthy();
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.user.name).toBe("Ash");
      expect(parsedData.user.id).toMatch(/^GUEST_/);

      const inputAfterSubmit = await page.$("input[placeholder='Enter name']");
      expect(inputAfterSubmit).toBeNull();
   });
});
