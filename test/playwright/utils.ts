import { Page } from "@playwright/test";

export const getGuestModeNamePrompt = (page: Page) => {
   return page.waitForSelector("input[placeholder='Enter name']", { timeout: 5000 });
};

export const enterAsGuestMode = async (page: Page) => {
   await page.click("button:has-text('Enter as Guest')");
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
