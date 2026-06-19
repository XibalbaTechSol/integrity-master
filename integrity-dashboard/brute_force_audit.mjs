import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

const TABS = [
  'telemetry', 'identity', 'ledger', 'zk', 'factory', 
  'compliance', 'credit', 'governance', 'markets', 
  'staking', 'stability', 'wallet', 'advanced', 'apikeys'
];

const REPORTS_DIR = path.join(process.cwd(), 'validation_reports');

async function runAudit() {
  console.log("Starting Brute-Force Visual Audit...");
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Basic DOM layout metric extraction
  const extractMetrics = async () => {
    return page.evaluate(() => {
      const issues = [];
      const allElements = document.querySelectorAll('*');
      const bodyWidth = document.body.clientWidth;

      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Check for horizontal overflow
        if (rect.right > bodyWidth + 5 && rect.width > 0) {
          issues.push({ 
            tag: el.tagName, 
            class: el.className, 
            issue: 'Overflows horizontal viewport',
            right: rect.right,
            bodyWidth
          });
        }
        // Check for negative margins that break layout
        if (rect.left < -5) {
          issues.push({ 
            tag: el.tagName, 
            class: el.className, 
            issue: 'Bleeds off left edge',
            left: rect.left
          });
        }
      });
      return issues;
    });
  };

  const results = {};

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    await page.setViewport({ width: vp.width, height: vp.height });
    
    for (const tab of TABS) {
      const url = `http://localhost:5173/dashboard#${tab}`;
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for layout stability
      await new Promise(resolve => setTimeout(resolve, 500));

      const screenshotPath = path.join(REPORTS_DIR, `${vp.name}_${tab}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const metrics = await extractMetrics();
      if (metrics.length > 0) {
        console.warn(`[WARNING] Layout issues detected on ${tab} (${vp.name}):`, metrics.length);
        if (!results[tab]) results[tab] = {};
        results[tab][vp.name] = metrics;
      }
    }
  }

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'audit_report.json'),
    JSON.stringify(results, null, 2)
  );

  await browser.close();
  console.log("\nAudit Complete! Screenshots and report saved to validation_reports/");
}

runAudit().catch(console.error);
