import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1080 });

  const outputDir = '/home/xibalba/.gemini/antigravity/brain/1535cc75-cb85-4d71-b93d-90341d1bdec6';

  console.log('Navigating to landing page...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); 
  await page.screenshot({ path: path.join(outputDir, 'landing_page.png'), fullPage: true });
  console.log('Landing page screenshot saved.');

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  
  console.log('Entering credentials...');
  await page.fill('input[type="text"]', 'DEMO');
  await page.fill('input[type="password"]', 'Password');
  await page.click('button[type="submit"]');

  console.log('Waiting for dashboard...');
  await page.waitForURL('http://localhost:3000/dashboard');
  await page.waitForTimeout(4000); // Wait for agents and graphs to load
  await page.screenshot({ path: path.join(outputDir, 'dashboard_registry.png'), fullPage: true });
  console.log('Dashboard registry screenshot saved.');

  // Click Analytics tab
  const analyticsTab = await page.getByText('Logic Suite');
  if (analyticsTab) {
      await analyticsTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outputDir, 'dashboard_analytics.png'), fullPage: true });
      console.log('Dashboard analytics screenshot saved.');
  }

  await browser.close();
}

run();
