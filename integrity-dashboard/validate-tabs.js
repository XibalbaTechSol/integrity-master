import { chromium } from 'playwright';

const tabs = ['telemetry', 'identity', 'ledger', 'zk', 'factory', 'compliance', 'credit', 'governance', 'markets', 'advanced'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let hasErrors = false;

  page.on('pageerror', exception => {
    console.log(`[EXCEPTION] ${exception}`);
    hasErrors = true;
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404')) {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
      hasErrors = true;
    }
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000); // let initial load finish

  for (const tab of tabs) {
    console.log(`Checking /#${tab}...`);
    await page.goto(`http://localhost:5173/#${tab}`);
    await page.waitForTimeout(500);
  }

  await browser.close();
  
  if (hasErrors) {
    console.log('Validation failed with errors.');
    process.exit(1);
  } else {
    console.log('All tabs validated successfully with no runtime errors.');
  }
})();
