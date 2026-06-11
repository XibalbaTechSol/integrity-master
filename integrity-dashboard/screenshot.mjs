import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:5175/');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });

  // Take screenshot of Telemetry Panel (default)
  await page.screenshot({ path: path.join(process.cwd(), 'screenshot_telemetry.png'), fullPage: true });
  console.log('Took screenshot: screenshot_telemetry.png');

  // Click Identity Tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const identityTab = tabs.find(t => t.innerText.includes('Identity'));
    if (identityTab) identityTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(process.cwd(), 'screenshot_identity.png'), fullPage: true });
  console.log('Took screenshot: screenshot_identity.png');

  // Click Wallet Tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const walletTab = tabs.find(t => t.innerText.includes('Wallet'));
    if (walletTab) walletTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(process.cwd(), 'screenshot_wallet.png'), fullPage: true });
  console.log('Took screenshot: screenshot_wallet.png');

  // Click Ledger Tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const ledgerTab = tabs.find(t => t.innerText.includes('Ledger'));
    if (ledgerTab) ledgerTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(process.cwd(), 'screenshot_ledger.png'), fullPage: true });
  console.log('Took screenshot: screenshot_ledger.png');

  await browser.close();
  console.log('Done.');
})();
