import { test, expect } from "@playwright/test";

test.describe.skip("Remote player name handling", () => {
   test("shows other player's name after rename", async ({ page }) => {
      // Stub WebSocket before any scripts run on the page
      await page.addInitScript(() => {
         class FakeWebSocket {
            static OPEN = 1;
            readyState = 1;
            onopen: (() => void) | null = null;
            onmessage: ((evt: any) => void) | null = null;
            onclose: (() => void) | null = null;
            sent: any[] = [];
            constructor(public url: string) {
               const w: any = window as any;
               w.__fakeWS = this;
               w.__fakeWSList = w.__fakeWSList || [];
               w.__fakeWSList.push(this);
            }
            send(payload: string) {
               this.sent.push(JSON.parse(payload));
            }
            close() {
               this.onclose && this.onclose();
            }
            // Helpers to simulate server -> client
            _serverOpen() {
               this.onopen && this.onopen();
            }
            _serverMessage(message: any) {
               this.onmessage && this.onmessage({ data: JSON.stringify(message) });
            }
         }
         (window as any).WebSocket = FakeWebSocket as any;
      });

      await page.goto("/game.html?name=Tester");

      // Wait for game bootstrap
      await page.waitForFunction(() => (window as any).game && typeof (window as any).game.getPlayerPosition === 'function');

      // Wait until the page attached onopen/onmessage, then drive the fake server
      await page.waitForFunction(() => Array.isArray((window as any).__fakeWSList) && (window as any).__fakeWSList.some((x: any) => typeof x.onmessage === 'function'));
      await page.evaluate(() => {
         const w: any = window as any;
         const list: any[] = (w.__fakeWSList || []).slice();
         // Open all to let clients send their initial messages
         list.forEach(ws => ws._serverOpen());
         // Send init to all; the game client will immediately send a hello back
         list.forEach(ws => ws._serverMessage({ type: "init", id: "LOCAL_ID" }));
         // Choose the instance that sent a hello (the game client)
         setTimeout(() => {
            const gameWs = (w.__fakeWSList || []).find((ws: any) => Array.isArray(ws.sent) && ws.sent.some((m: any) => m && m.type === "hello")) || w.__fakeWS;
            gameWs._serverMessage({
               type: "players",
               players: {
                  REMOTE_1: { id: "REMOTE_1", position: { x: 100, y: 100 }, name: "Rival" }
               }
            });
            setTimeout(() => gameWs._serverMessage({ type: "rename", id: "REMOTE_1", name: "Rival" }), 100);
         }, 50);
      });

      // Assert that a PIXI Text with content "Rival" appears on the stage
      await expect.poll(async () => {
         const texts = await page.evaluate(() => {
            const g: any = (window as any).game;
            return g?.getLabelTexts?.() || [];
         });
         return texts.includes("Rival");
      }, { timeout: 10000 }).toBeTruthy();
   });
});


