const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'validation_reports');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR);
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

const tabs = [
  'telemetry', 'identity', 'ledger', 'zk', 'factory', 
  'compliance', 'credit', 'governance', 'markets', 
  'staking', 'stability', 'wallet', 'advanced'
];

(async () => {
  console.log('🚀 Starting Comprehensive Dashboard Validation...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Mock window.ethereum before each page load
  await context.addInitScript(() => {
    window.ethereum = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return ['0x5B5670D93038406468E0FA2c9683bF1673DEDbf3'];
        }
        if (method === 'personal_sign') {
          return '0x' + 'a'.repeat(130); // dummy sig
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // 1. Visit Dashboard
  console.log('--- Step 1: Initial Load ---');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_load.png') });

  // 2. Connect Wallet
  console.log('--- Step 2: Wallet Connection ---');
  await page.click('text=Connect Wallet');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_wallet_connected.png') });

  // 2.5 Select Agent
  console.log('--- Step 2.5: Selecting Agent ---');
  // Click the first agent in the list
  await page.locator('.sidebar-content >> .status-badge').first().click().catch(() => {});
  await page.waitForTimeout(1000);

  // 3. Tab Traversal & Baseline Screenshots
  console.log('--- Step 3: Tab Traversal ---');
  for (const tab of tabs) {
    console.log(`Checking tab: ${tab}...`);
    await page.goto(`http://localhost:5173/#${tab}`);
    await page.waitForTimeout(1000); // let data load
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `tab_${tab}.png`) });
  }

  // 4. Workflow: Register Agent
  console.log('--- Step 4: Workflow - Register Agent ---');
  await page.goto('http://localhost:5173/#identity');
  await page.waitForSelector('text=Register New Agent', { timeout: 10000 });
  
  await page.fill('input[required]', 'Validator-Prime'); 
  await page.fill('input[placeholder="e.g. gpt-4o, claude-3-opus"]', 'playwright-validator-bot');
  
  await page.click('text=Deploy Agent Identity');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow_agent_registered.png') });

  // 5. Workflow: Create Leveraged Market Task
  console.log('--- Step 5: Workflow - Create Market Task (Leveraged) ---');
  await page.goto('http://localhost:5173/#markets');
  await page.fill('input[placeholder="e.g. Data Inference SLA"]', 'E2E Validation Task');
  await page.check('#useCredit');
  await page.click('text=Create A2A Task');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow_market_task_leveraged.png') });

  // 6. Workflow: Request Institutional Loan
  console.log('--- Step 6: Workflow - Request Loan ---');
  await page.goto('http://localhost:5173/#credit');
  // Fill the principal input
  await page.locator('input[type="number"]').first().fill('5000');
  await page.click('text=Submit Loan Application');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow_loan_approved.png') });

  // 7. Workflow: Wallet Transfer
  console.log('--- Step 7: Workflow - Wallet Transfer ---');
  await page.goto('http://localhost:5173/#wallet');
  await page.fill('input[placeholder="0x... or select agent"]', '0xd62982a313FfA10966e76CD9dA11708eDbb01B3f');
  // Fill amount
  await page.locator('input[type="number"]').fill('500');
  await page.click('text=Execute Secure Transfer');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow_wallet_transfer.png') });

  console.log('🏁 Validation Complete. Report generated in validation_reports/');
  await browser.close();
})();
