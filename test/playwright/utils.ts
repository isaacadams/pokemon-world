import { Page } from "@playwright/test";

export const getGuestModeNamePrompt = (page: Page) => {
   return page.waitForSelector("input[placeholder='Enter name']", { timeout: 5000 });
};

export const enterAsGuestMode = async (page: Page) => {
   // The menu appears after the landing page's intro animation (several seconds, slower under load).
   await page.click("button:has-text('Enter as Guest')", { timeout: 20_000 });
   await getGuestModeNamePrompt(page);
   await page.waitForSelector("button:has-text('Start Game')");
};

export const getPlayerPosition = async (page: Page) => {
   return page.evaluate(() => {
      const game = (window as any).game;
      const pos = game.getPlayerPosition();
      return [Math.floor(pos.x), Math.floor(pos.y)];
   });
};

// Opens the game as a guest and waits until the player and tileset are ready.
export const startGame = async (page: Page, name: string) => {
   await page.goto("/game.html");
   await page.evaluate(() => localStorage.clear());
   await page.fill("input[placeholder='Enter name']", name);
   await page.click("button:has-text('Start Game')");
   await waitForGame(page);
};

// Waits until the player and tileset are ready.
export const waitForGame = async (page: Page) => {
   await page.waitForFunction(() => {
      const game = (window as any).game;
      return game?.player && game.tileMap?.isTilesetLoaded();
   });
};

// Hides the randomly spawned wild Pokemon and stops the game loop so the frame is deterministic.
export const freezeFrame = async (page: Page) => {
   await page.evaluate(() => {
      const game = (window as any).game;
      for (const wild of game.wild?.pokemons ?? []) {
         wild.state.sprite.visible = false;
         wild.label.visible = false;
      }
      game.app.ticker.stop();
      game.app.renderer.render(game.app.stage);
   });
};
