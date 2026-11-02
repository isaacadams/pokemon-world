import { defineConfig } from "@playwright/test";

export default defineConfig({
   testDir: "./playwright",
   timeout: 30000,
   use: {
      headless: true, // Run in headless mode for CI, set to false for debugging
      viewport: { width: 1280, height: 720 },
      actionTimeout: 5000,
      baseURL: "http://localhost:9000" // Update with your dev server URL
   },
   webServer: {
      cwd: "../",
      command: "bun apps/client/scripts/dev.ts",
      url: "http://localhost:9000",
      timeout: 120000,
      reuseExistingServer: !process.env.CI
   },
   expect: {
      // Small allowance for font anti-aliasing differences between machines
      toHaveScreenshot: { maxDiffPixelRatio: 0.01 }
   },
   retries: 0,
   reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]]
});
