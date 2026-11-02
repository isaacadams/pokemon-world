const { describe, it, expect, beforeAll, afterAll, setDefaultTimeout } = require("bun:test");
const { spawn } = require("child_process");
const path = require("path");
const WebSocket = require("ws");

const PORT = 19082;
const SERVER_URL = `ws://localhost:${PORT}`;
const ORIGIN = "http://game.example";

setDefaultTimeout(15000);

function delay(ms) {
   return new Promise(r => setTimeout(r, ms));
}

function waitForMessage(ws, predicate, timeoutMs = 2000) {
   return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout waiting for message")), timeoutMs);
      ws.on("message", data => {
         try {
            const msg = JSON.parse(String(data));
            if (predicate(msg)) {
               clearTimeout(timer);
               resolve(msg);
            }
         } catch (e) {}
      });
   });
}

async function connect() {
   const ws = new WebSocket(SERVER_URL, { origin: ORIGIN });
   const { id } = await waitForMessage(ws, m => m.type === "init");
   return { ws, id };
}

describe("server hardening", () => {
   let serverProc;

   beforeAll(async () => {
      serverProc = spawn(process.execPath, [path.join(__dirname, "server.js")], {
         env: { ...process.env, PORT: String(PORT), ALLOWED_ORIGINS: ORIGIN },
         stdio: ["ignore", "pipe", "pipe"]
      });
      await delay(400);
   });

   afterAll(() => {
      try {
         serverProc?.kill();
      } catch {}
   });

   it("rejects connections from other origins", async () => {
      const ws = new WebSocket(SERVER_URL, { origin: "http://evil.example" });
      const error = await new Promise(resolve => ws.on("error", resolve));
      expect(String(error.message)).toContain("401");
   });

   it("survives malformed messages", async () => {
      const a = await connect();
      a.ws.send("not json");
      a.ws.send("null");
      await delay(200);
      expect(serverProc.exitCode).toBeNull();

      const b = await connect();
      expect(b.id).toBeDefined();
      a.ws.close();
      b.ws.close();
   });

   it("broadcasts updates under the sender's id, not a client-supplied one", async () => {
      const a = await connect();
      const b = await connect();
      const update = waitForMessage(b.ws, m => m.type === "update");
      a.ws.send(JSON.stringify({ type: "update", id: b.id, x: 1, y: 2 }));
      expect(await update).toEqual({ type: "update", id: a.id, x: 1, y: 2 });
      a.ws.close();
      b.ws.close();
   });

   it("ignores updates with non-numeric positions", async () => {
      const a = await connect();
      const b = await connect();
      const updates = [];
      b.ws.on("message", data => {
         const msg = JSON.parse(String(data));
         if (msg.type === "update") updates.push(msg);
      });
      a.ws.send(JSON.stringify({ type: "update", x: "<b>", y: null }));
      await delay(200);
      expect(updates).toEqual([]);
      a.ws.close();
      b.ws.close();
   });
});
