#!/usr/bin/env node
/* eslint-disable */
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");
const os = require("os");

const BASE_URL = process.env.DST_BASE_URL || "http://localhost:1234";
const DEFAULT_CLIENT_PORT = process.env.DST_CLIENT_PORT || "9000";

function pickRandomPort() {
  const min = 20000;
  const max = 39999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  // Node 18+ has global fetch
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

function tryListScenarios() {
  const fs = require("fs");
  const path = require("path");
  const file = path.join(__dirname, "..", "src", "scenarios.ts");
  try {
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(/scenarios\s*:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\}\s*;/);
    if (!match) return null;
    const body = match[1];
    const names = [];
    const propRegex = /\n\s*([a-zA-Z0-9_]+)\s*:\s*\{/g;
    let m;
    while ((m = propRegex.exec(body))) {
      names.push(m[1]);
    }
    return names;
  } catch (_) {
    return null;
  }
}

async function run() {
  if (process.argv.includes("--list") || process.argv.includes("-l")) {
    const names = tryListScenarios();
    if (names && names.length) {
      console.log(names.join("\n"));
      return;
    }
    console.log("demo\nwalk_square");
    return;
  }
  const args = process.argv.slice(2);
  const scenarioName = args.find(a => !a.startsWith("-"));
  if (!scenarioName) {
    console.error("Usage: pnpm -F @repo/dst scenario -- <scenario-name> [--slow] | pnpm -F @repo/dst scenarios");
    process.exit(1);
  }
  const slow = args.includes("--slow");
  const useClient = args.includes("--client");
  const headless = args.includes("--headless");
  const useDevModePage = args.includes("--devmode");
  const portFlagIdx = args.findIndex(a => a === "--port");
  const durationIdx = args.findIndex(a => a === "--duration");
  const desiredPort = portFlagIdx !== -1 ? (args[portFlagIdx + 1] || DEFAULT_CLIENT_PORT) : pickRandomPort();
  // Default to 30s if not specified
  const durationMs = durationIdx !== -1 ? parseInt(args[durationIdx + 1] || "30", 10) * 1000 : 30000;

  // Always start a fresh dev server for isolation on a random port
  let server = null;
  const clientUrl = `http://localhost:${desiredPort}`;
  const targetUrl = useClient ? clientUrl : BASE_URL;
  const argsToSpawn = useClient
    ? ["--filter", "@pokemon-world/game", "dev", "--port", desiredPort]
    : ["serve"];
  server = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", argsToSpawn, {
    cwd: useClient ? __dirname + "/../../.." : __dirname + "/..",
    stdio: "inherit"
  });

  try {
    await waitForServer(targetUrl, 60000);
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    const url = useClient
      ? `${clientUrl}/${useDevModePage ? "devmode" : "game"}.html?scenario=${encodeURIComponent(scenarioName)}&name=Ash${slow ? "&slow=1" : ""}`
      : `${BASE_URL}/?scenario=${encodeURIComponent(scenarioName)}${slow ? "&slow=1" : ""}`;
    await page.goto(url);
    console.log(`Scenario: ${scenarioName}`);
    console.log(`URL: ${url}`);
    console.log(`Port: ${desiredPort}`);
    console.log(`Duration: ${Math.round(durationMs/1000)}s`);
    // Also open system browser as a fallback so the window is visible to the user
    try {
      const isWSL = os.release().toLowerCase().includes("microsoft");
      if (isWSL) {
        spawn("wslview", [url], { stdio: "ignore", detached: true });
      } else {
        const openCmd = process.platform === "win32" ? "start" : (process.platform === "darwin" ? "open" : "xdg-open");
        spawn(openCmd, [url], { shell: true, stdio: "ignore", detached: true });
      }
    } catch {}
    // Wait for game to be ready
    await page.bringToFront();
    await page.evaluate(() => {
      window.focus();
      // try to focus canvas area
      document.body?.focus();
    });
    try {
      await page.waitForFunction(() => (window).game !== undefined, { timeout: 15000 });
    } catch {}
    await page.bringToFront();
    await page.evaluate(() => window.focus());

    // Always auto-timeout and close after durationMs
    await new Promise(r => setTimeout(r, durationMs));
    await browser.close();
    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    if (server) {
      try { server.kill(); } catch {}
    }
  }
}

run();


