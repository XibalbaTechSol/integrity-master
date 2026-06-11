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

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle' });
  
  // Wait a bit extra for dynamic content and animations to load
  await page.waitForTimeout(3000); 

  const filePath = path.join(outputDir, 'dashboard_full.png');
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Saved full page screenshot to ${filePath}`);

  await browser.close();
}

run();
