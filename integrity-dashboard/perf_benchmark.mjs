import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5173/dashboard');
  await page.waitForSelector('.tab-btn');

  const tabs = [
    'Telemetry', 'Identity & DID', 'Smart Ledger', 'ZK Prover', 'Contract Factory',
    'Xibalba Shield', 'Oracle Registry', 'Credit & Loans', 'A2A Markets', 'Staking',
    'Stability Hub', 'Governance', 'Compliance', 'Wallet', 'Agent Thoughts', 'Advanced', 'API Keys'
  ];

  const results = {};
  let fails = 0;

  for (const tab of tabs) {
    // First click to warm up dev server cache and component
    await page.evaluate(async (tabName) => {
      const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.trim().includes(tabName));
      if (btn) btn.click();
      return new Promise(resolve => setTimeout(resolve, 500)); // wait for render
    }, tab);

    // Click back to telemetry (to reset state)
    await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.trim().includes('Telemetry'));
      if (btn) btn.click();
      return new Promise(resolve => setTimeout(resolve, 100));
    });

    // Second click to measure actual render time
    const time = await page.evaluate(async (tabName) => {
      const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.trim().includes(tabName));
      if (!btn) return -1;
      
      const start = performance.now();
      btn.click();
      
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            resolve(performance.now() - start);
          }, 0);
        });
      });
    }, tab);

    results[tab] = time;
    if (time > 50) fails++;
  }

  console.log(JSON.stringify(results, null, 2));
  
  if (fails > 0) {
    console.log(`\nFound ${fails} components that took >50ms.`);
    process.exit(1);
  } else {
    console.log(`\nAll components loaded in under 50ms!`);
    process.exit(0);
  }
  
  await browser.close();
})();
