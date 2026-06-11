const { chromium } = require('playwright');
const fs = require('fs');

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

const tabs = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'credit', 'governance', 'markets', 'advanced', 'staking', 'stability'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://127.0.0.1:4173');
  await page.waitForTimeout(1000);

  for (const tab of tabs) {
    console.log(`Taking screenshot of /#${tab}...`);
    await page.goto(`http://127.0.0.1:4173/#${tab}`);
    await page.waitForTimeout(500); // let animations settle
    await page.screenshot({ path: `screenshots/${tab}.png` });
  }

  await browser.close();
  console.log('Done!');
})();
