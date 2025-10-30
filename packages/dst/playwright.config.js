// playwright.config.js
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
   // Run tests in a browser context
   projects: [
      {
         name: "chromium",
         use: { browserName: "chromium" }
      },
      /* {
         name: "firefox",
         use: { browserName: "firefox" }
      }, */
      {
         name: "webkit",
         use: { browserName: "webkit" }
      }
   ],

   // Test directory (where your test files will live)
   testDir: "./",

   // Global timeout for tests (in milliseconds)
   timeout: 30000,

   // Use a base URL to load your HTML file
   use: {
      baseURL: "http://localhost:9010",
      headless: true,
      viewport: { width: 1280, height: 720 },
      actionTimeout: 5000,
      ignoreHTTPSErrors: true
   },

   // Reporter to display test results
   reporter: "line",

   // WebServer (optional, if you want to serve the HTML file via a local server)
   webServer: {
      command: "pnpm --filter @pokemon-world/game dev --port 9010",
      port: 9010,
      reuseExistingServer: true
   }
});
