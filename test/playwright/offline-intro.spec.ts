import { test, expect } from "@playwright/test";

test("menu still appears when the intro sprites can't load", async ({ page }) => {
   await page.route("https://raw.githubusercontent.com/**", route => route.abort());
   await page.goto("/");
   await expect(page.locator("#guest-login")).toBeVisible({ timeout: 10_000 });
});
