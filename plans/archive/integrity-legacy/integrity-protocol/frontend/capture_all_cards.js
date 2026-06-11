import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1800 }); // Large viewport to load all elements if lazy

  const outputDir = '/home/xibalba/Projects/integrity-protocol/web/assets/docs/cards';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  
  // Wait a bit extra for dynamic content and animations
  await page.waitForTimeout(3000); 

  // Grab all elements with the 'enterprise-card' class
  const cards = await page.$$('.enterprise-card');
  console.log(`Found ${cards.length} enterprise-cards.`);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    // Attempt to guess the name from a header if present
    let name = `card_${i + 1}`;
    try {
      const header = await card.$('.card-header h3, .card-header h2, h6');
      if (header) {
        let text = await header.innerText();
        text = text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        if (text) {
          name = text;
        }
      }
    } catch (e) {
      // ignore
    }

    const filePath = path.join(outputDir, `${name}_${i}.png`);
    await card.screenshot({ path: filePath });
    console.log(`Saved screenshot for card ${i + 1} to ${filePath}`);
  }

  await browser.close();
}

run();
