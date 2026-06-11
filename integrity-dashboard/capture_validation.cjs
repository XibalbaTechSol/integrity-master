const { chromium } = require('playwright');
const fs = require('fs');

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

const tabs = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'credit', 'governance', 'markets', 'staking'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Connecting to dashboard at http://localhost:8081...');
  
  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.error('Failed to load dashboard. Ensure the dev server is running on port 8081.');
    await browser.close();
    process.exit(1);
  }
  
  await page.waitForTimeout(2000);

  for (const tab of tabs) {
    console.log(`Taking screenshot of tab: ${tab}...`);
    // The dashboard uses hash navigation
    await page.goto(`http://localhost:8081/#${tab}`);
    await page.waitForTimeout(1000); // Wait for data fetch and animations
    await page.screenshot({ path: `screenshots/${tab}.png`, fullPage: false });
  }

  await browser.close();
  console.log('Successfully captured screenshots for all tabs.');
})();
