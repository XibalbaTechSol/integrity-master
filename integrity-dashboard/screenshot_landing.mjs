import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const server = spawn('npm', ['run', 'dev'], { stdio: 'ignore', detached: true });
  await delay(3000); // Wait for dev server to start

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to landing page...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'screenshot_landing.png', fullPage: true });
  console.log('Took screenshot: screenshot_landing.png');

  await browser.close();
  process.kill(-server.pid);
  console.log('Done.');
}

run().catch(console.error);
