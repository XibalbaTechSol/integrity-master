import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const browser = await puppeteer.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

const dir = '/home/xibalba/Projects/INTEGRITY/integrity-dashboard/screenshots';

// Helper: take a crop from the full-page screenshot at a specific Y offset
async function takeSection(page, yOffset, height, name) {
  // Navigate again fresh with custom viewport
  await page.setViewport({ width: 1440, height: height });
  await page.evaluate((y) => window.scrollTo(0, y), yOffset);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ 
    path: `${dir}/${name}.png`,
    clip: { x: 0, y: 0, width: 1440, height: height }
  });
}

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

const totalHeight = await page.evaluate(() => document.body.scrollHeight);
console.log('Total page height:', totalHeight);

// Take full page screenshot using scrollY trick - emulate printing
const sectionHeight = 1000;
const labels = ['hero', 'trust_gap', 'devstart', 'escrows', 'tiers', 'guardian_dao', 'vitals', 'economics', 'zk', 'token', 'dao', 'chains', 'roadmap', 'footer'];

let current = 0;
let idx = 0;
while (current < totalHeight && idx < labels.length) {
  await page.setViewport({ width: 1440, height: sectionHeight });
  await page.evaluate((y) => window.scrollTo(0, y), current);
  await new Promise(r => setTimeout(r, 800));
  
  const scrollY = await page.evaluate(() => window.scrollY);
  const name = `section_${String(idx+1).padStart(2,'0')}_${labels[idx] || 'section'}`;
  
  // Screenshot the visible area (viewport)
  await page.screenshot({ 
    path: `${dir}/${name}.png`,
    clip: { x: 0, y: 0, width: 1440, height: sectionHeight }
  });
  console.log(`${name}: scrollY=${scrollY}`);
  
  current += sectionHeight;
  idx++;
}

await browser.close();
console.log('Done!');
