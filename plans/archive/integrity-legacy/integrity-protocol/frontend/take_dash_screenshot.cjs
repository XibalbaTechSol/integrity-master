const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3002/dashboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'assets/docs/dash_hero.png', fullPage: false });
  await browser.close();
})();
