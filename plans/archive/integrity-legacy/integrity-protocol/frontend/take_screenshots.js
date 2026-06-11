import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const outputDir = '/home/xibalba/Projects/integrity-protocol/web/assets/docs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Taking screenshot of Overview...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); 
  await page.screenshot({ path: path.join(outputDir, 'dashboard.png') });
  console.log('Saved dashboard.png to ' + outputDir);

  console.log('Taking screenshot of Leaderboard...');
  await page.click('nav button, .sidebar button', { timeout: 5000 }).catch(() => console.log('Click failed, skipping next step'));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outputDir, 'leaderboard.png') });
  console.log('Saved leaderboard.png to ' + outputDir);

  await browser.close();
}

run();
