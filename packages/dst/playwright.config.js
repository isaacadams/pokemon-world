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
      baseURL: "http://localhost:1234",
      headless: true, // Run in headless mode for CI or faster execution
      viewport: { width: 1280, height: 720 },
      actionTimeout: 5000,
      ignoreHTTPSErrors: true // Ignore HTTPS errors if loading locally
   },

   // Reporter to display test results
   reporter: "line",

   // WebServer (optional, if you want to serve the HTML file via a local server)
   webServer: {
      command: "npm run serve",
      port: 1234,
      reuseExistingServer: true
   }
});
