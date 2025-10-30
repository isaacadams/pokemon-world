import { test, expect } from "@playwright/test";

test.describe("Player name label", () => {
   test("shows guest name above player", async ({ page }) => {
      const guest = {
         ok: true,
         user: { name: "Guesty", id: "GUEST_123", email: "guest@example.com" },
         team: { id: "GUEST_TEAM" }
      };

      await page.addInitScript(value => {
         localStorage.setItem("data", JSON.stringify(value));
      }, guest);

      await page.goto("/game.html");
      await page.waitForFunction(() => !!(window as any).game && (window as any).game.getPlayerName() !== "");
      const name = await page.evaluate(() => (window as any).game.getPlayerName());
      expect(name).toBe("Guesty");
   });

   test("shows Slack user name above player", async ({ page }) => {
      const slack = {
         ok: true,
         user: { name: "slacky", id: "U123456", email: "slack@example.com" },
         team: { id: "T123456" }
      };

      await page.addInitScript(value => {
         localStorage.setItem("data", JSON.stringify(value));
      }, slack);

      await page.goto("/game.html");
      await page.waitForFunction(() => !!(window as any).game && (window as any).game.getPlayerName() !== "");
      const name = await page.evaluate(() => (window as any).game.getPlayerName());
      expect(name).toBe("slacky");
   });
});


