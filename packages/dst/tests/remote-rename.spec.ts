import { test, expect } from "@playwright/test";

test.describe("Remote player name handling", () => {
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
               (window as any).__fakeWS = this;
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

      await page.goto("/devmode.html?name=Tester");

      // Wait for game bootstrap
      await page.waitForFunction(() => (window as any).game && typeof (window as any).game.getPlayerPosition === 'function');

      // Wait until the page attached onopen/onmessage, then drive the fake server
      await page.waitForFunction(() => !!(window as any).__fakeWS && typeof (window as any).__fakeWS.onmessage === 'function');
      await page.evaluate(() => {
         const ws: any = (window as any).__fakeWS;
         ws._serverOpen();
         ws._serverMessage({ type: "init", id: "LOCAL_ID" });
         ws._serverMessage({
            type: "players",
            players: {
               REMOTE_1: { id: "REMOTE_1", position: { x: 100, y: 100 }, name: "Rival" }
            }
         });
         setTimeout(() => ws._serverMessage({ type: "rename", id: "REMOTE_1", name: "Rival" }), 200);
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


