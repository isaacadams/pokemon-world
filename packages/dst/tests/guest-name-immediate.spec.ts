import { test, expect } from "@playwright/test";

test.describe("Guest name prompt", () => {
   test("updates local label immediately after submitting name", async ({ page }) => {
      // Ensure no prior user data so the guest prompt appears
      await page.addInitScript(() => localStorage.removeItem("data"));

      await page.goto("/game.html");

      // Wait for the guest input to appear
      const input = page.getByPlaceholder("Enter name");
      await expect(input).toBeVisible();

      // Type a name and submit
      const typedName = "GuestNow";
      await input.fill(typedName);
      await input.press("Enter");

      // The prompt should disappear and the in-game label should update immediately
      await expect(input).toBeHidden();

      // Wait until the game is initialized and label is set
      await page.waitForFunction(() => {
         const g: any = (window as any).game;
         return !!g && typeof g.getPlayerName === "function" && g.getPlayerName() !== "";
      });

      const name = await page.evaluate(() => (window as any).game.getPlayerName());
      expect(name).toBe(typedName);
   });
});


