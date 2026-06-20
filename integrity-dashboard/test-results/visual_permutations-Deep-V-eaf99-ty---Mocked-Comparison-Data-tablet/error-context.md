# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual_permutations.spec.ts >> Deep Visual Audit - Component Permutations >> Stability - Mocked Comparison Data
- Location: e2e/visual_permutations.spec.ts:106:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Visual Audit Agent').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Visual Audit Agent').first()

```

```yaml
- complementary:
  - img "Xibalba"
  - text: Integrity Protocol
  - button
  - heading "Fleet Command" [level=2]
  - text: Sovereign Agent Roster Hermes_Xibalba_Sovereign Tier AAA Inst. 0x67ba5d72...
  - button "Register New Agent"
- heading "Integrity Command Center" [level=1]
- text: "ORACLE REPUTATION NETWORK v9.0 Domain:"
- combobox:
  - option "Global (Mesh)" [selected]
  - option "Shield (Healthcare)"
  - option "Quant (Finance)"
  - option "Logistics (Supply)"
- text: DATABASE ONLINE
- button "Sync"
- button "Connect Wallet"
- button "Stability Hub"
- main:
  - text: Stability Leaderboard
  - button
  - text: Public ranking of LLM providers by performance variance (Entropy) and grounding fidelity. Certified providers maintain 95%+ stability over 30 days.
  - table:
    - rowgroup:
      - row "Model / Provider Simulated AIS Stability (1-E) Grounding Status":
        - columnheader "Model / Provider"
        - columnheader "Simulated AIS"
        - columnheader "Stability (1-E)"
        - columnheader "Grounding"
        - columnheader "Status"
    - rowgroup:
      - row "TEST-HIGH-LOAD MOCK 999 99.0% 99.0% certified":
        - cell "TEST-HIGH-LOAD MOCK"
        - cell "999"
        - cell "99.0%"
        - cell "99.0%"
        - cell "certified"
  - text: Regional Performance US-East (N. Virginia) 12ms avg. EU-Central (Frankfurt) 18ms avg. AP-Northeast (Tokyo) 45ms avg. Latency Heatmap Visualization Certification Pipeline Apply for Institutional Certification Requires 1M+ tokens processed via Xibalba Integrity Sockets and zero consensus violations. Active Audits 12 ZK-Verifiers Online 8,421
  - button "Start Certification Audit"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import fs from 'fs';
  3   | import path from 'path';
  4   | 
  5   | const REPORTS_DIR = path.join(process.cwd(), 'validation_reports', 'screenshots');
  6   | 
  7   | test.beforeAll(async () => {
  8   |   if (!fs.existsSync(REPORTS_DIR)) {
  9   |     fs.mkdirSync(REPORTS_DIR, { recursive: true });
  10  |   }
  11  | });
  12  | 
  13  | const MOCK_AGENT = {
  14  |   agent_id: '88d5ab08-156b-45cf-9b17-32e74a9f2690',
  15  |   eth_address: '0x1234567890abcdef1234567890abcdef12345678',
  16  |   alias: 'Visual Audit Agent',
  17  |   current_ais: 850,
  18  |   staked_itk: 10000,
  19  | };
  20  | 
  21  | const MOCK_CREDIT = { 
  22  |   credit_score: 750, 
  23  |   max_borrow_limit: 10000, 
  24  |   total_borrowed: 0, 
  25  |   active_loans: [] 
  26  | };
  27  | 
  28  | test.beforeEach(async ({ page }) => {
  29  |   // Global mocks to unlock UI
  30  |   await page.route('**/v1/agents', async route => {
  31  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_AGENT]) });
  32  |   });
  33  |   await page.route('**/v1/protocol/stats', async route => {
  34  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total_agents: 1, total_itk_staked: 1000000 }) });
  35  |   });
  36  |   await page.route('**/v1/agent/*/credit', async route => {
  37  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CREDIT) });
  38  |   });
  39  |   
  40  |   // Prevent logs/errors from missing endpoints
  41  |   await page.route('**/v1/ledger/history', async route => {
  42  |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ logs: [] }) });
  43  |   });
  44  | 
  45  |   // Mock benchmarking to avoid timeouts
  46  |   await page.route('**/benchmarks', async route => {
  47  |     await route.fulfill({ 
  48  |         status: 200, 
  49  |         contentType: 'application/json',
  50  |         body: JSON.stringify([
  51  |             { model_name: 'TEST-HIGH-LOAD', provider_name: 'MOCK', simulated_ais: 999, stability_metric: 0.99, grounding_metric: 0.99 }
  52  |         ]) 
  53  |     });
  54  |   });
  55  | });
  56  | 
  57  | test.describe('Deep Visual Audit - Component Permutations', () => {
  58  |   
  59  |   // Helper to ensure page is ready and agent selected
  60  |   async function setupTab(page, tab) {
  61  |     await page.goto(`/dashboard#${tab}`);
  62  |     // Wait for the mock agent alias to appear somewhere (sidebar or context)
> 63  |     await expect(page.getByText('Visual Audit Agent').first()).toBeVisible({ timeout: 15000 });
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  64  |   }
  65  | 
  66  |   test('Identity - Registration Flow State', async ({ page }, testInfo) => {
  67  |     await setupTab(page, 'identity');
  68  |     await page.getByRole('button', { name: /Open Registration Flow/i }).click();
  69  |     await page.waitForTimeout(500);
  70  |     await page.screenshot({ path: path.join(REPORTS_DIR, `${testInfo.project.name}_identity_registration_modal.png`) });
  71  |   });
  72  | 
  73  |   test('ZKProver - Proving Pipeline State', async ({ page }, testInfo) => {
  74  |     await page.route('**/v1/zk/prove/**', async route => {
  75  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ proof: { proof_hash: '0x123', proof_data: '{}' } }) });
  76  |     });
  77  | 
  78  |     await setupTab(page, 'zk');
  79  |     const btn = page.getByRole('button', { name: /Generate Proof/i });
  80  |     await expect(btn).toBeEnabled();
  81  |     await btn.click();
  82  |     await page.waitForSelector('.animate-fade-in', { timeout: 10000 }); 
  83  |     await page.screenshot({ path: path.join(REPORTS_DIR, `${testInfo.project.name}_zk_proving_pipeline.png`) });
  84  |   });
  85  | 
  86  |   test('Markets - Creating Task State', async ({ page }, testInfo) => {
  87  |     await page.route('**/v1/market/tasks', async route => {
  88  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  89  |     });
  90  |     
  91  |     await setupTab(page, 'markets');
  92  |     await page.fill('#task-title', 'Visual Test Task');
  93  |     const btn = page.getByRole('button', { name: /Create A2A Task/i });
  94  |     await expect(btn).toBeEnabled();
  95  |     await btn.click();
  96  |     await page.screenshot({ path: path.join(REPORTS_DIR, `${testInfo.project.name}_markets_task_creation.png`) });
  97  |   });
  98  | 
  99  |   test('Credit - Error and Overlimit State', async ({ page }, testInfo) => {
  100 |     await setupTab(page, 'credit');
  101 |     await page.fill('#borrow-amount', '9999999');
  102 |     await expect(page.locator('text=Exceeds maximum borrow limit')).toBeVisible();
  103 |     await page.screenshot({ path: path.join(REPORTS_DIR, `${testInfo.project.name}_credit_overlimit_error.png`) });
  104 |   });
  105 | 
  106 |   test('Stability - Mocked Comparison Data', async ({ page }, testInfo) => {
  107 |     await setupTab(page, 'stability');
  108 |     await page.waitForSelector('text=TEST-HIGH-LOAD', { state: 'visible' });
  109 |     await page.screenshot({ path: path.join(REPORTS_DIR, `${testInfo.project.name}_stability_mocked_comparison.png`) });
  110 |   });
  111 | });
  112 | 
```