import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600 });
  console.log('Navigating...');
  await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot_new.png' });
  console.log('Took screenshot');
  await browser.close();
}

run().catch(console.error);
