# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seeded_data_validation.spec.ts >> Seeded Data Validation >> Stability Hub displays benchmarks
- Location: e2e/seeded_data_validation.spec.ts:56:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=GPT-4o')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=GPT-4o')

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
      - row "No benchmark data available. Oracle is accumulating telemetry.":
        - cell "No benchmark data available. Oracle is accumulating telemetry."
  - text: Regional Performance US-East (N. Virginia) 12ms avg. EU-Central (Frankfurt) 18ms avg. AP-Northeast (Tokyo) 45ms avg. Latency Heatmap Visualization Certification Pipeline Apply for Institutional Certification Requires 1M+ tokens processed via Xibalba Integrity Sockets and zero consensus violations. Active Audits 12 ZK-Verifiers Online 8,421
  - button "Start Certification Audit"
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | async function selectTab(page: Page, label: string) {
  4  |   const isMobile = await page.evaluate(() => window.innerWidth <= 768);
  5  |   if (isMobile) {
  6  |     // If it's not already on the tab, open the accordion
  7  |     const activeTabText = await page.locator('.tab-nav-accordion .tab-btn.active').innerText();
  8  |     if (!activeTabText.includes(label)) {
  9  |       await page.locator('.tab-nav-accordion .tab-btn.active').click();
  10 |       await page.waitForTimeout(1000);
  11 |     }
  12 |   }
  13 |   // Click the tab button (works for both desktop nav and mobile accordion list)
  14 |   await page.click(`button:has-text("${label}")`);
  15 | }
  16 | 
  17 | test.describe('Seeded Data Validation', () => {
  18 |   test.beforeEach(async ({ page }) => {
  19 |     page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  20 |     page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  21 |     page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  22 | 
  23 |     await page.goto('http://localhost:5173/dashboard');
  24 |     // Wait for the app shell to load
  25 |     await page.waitForSelector('.app-shell', { timeout: 30000 });
  26 |   });
  27 | 
  28 |   test('Identity page displays seeded agents', async ({ page }) => {
  29 |     // Click on the Identity tab button
  30 |     await selectTab(page, "Identity & DID");
  31 |     await page.waitForTimeout(2000); 
  32 | 
  33 |     // Check for a few seeded agents in the sidebar or identity panel
  34 |     await expect(page.locator('text=Institutional_Ironclad')).toBeVisible();
  35 |     await expect(page.locator('text=Cyber_Sentinel')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('Ledger page displays transactions', async ({ page }) => {
  39 |     await selectTab(page, "Smart Ledger");
  40 |     await page.waitForTimeout(3000);
  41 | 
  42 |     // Ledger should have log entries with links to Basescan
  43 |     const links = page.locator('a[href*="basescan.org/tx/"]');
  44 |     const count = await links.count();
  45 |     expect(count).toBeGreaterThan(0); 
  46 |   });
  47 | 
  48 |   test('Telemetry page displays performance metrics', async ({ page }) => {
  49 |     await selectTab(page, "Telemetry");
  50 |     await page.waitForTimeout(3000);
  51 | 
  52 |     // Check for chart elements (Radar chart)
  53 |     await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 15000 });
  54 |   });
  55 | 
  56 |   test('Stability Hub displays benchmarks', async ({ page }) => {
  57 |     await selectTab(page, "Stability Hub");
  58 |     await page.waitForTimeout(3000);
  59 | 
  60 |     // We seeded stability benchmarks: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro
> 61 |     await expect(page.locator('text=GPT-4o')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  62 |     await expect(page.locator('text=Claude 3.5 Sonnet')).toBeVisible();
  63 |   });
  64 | 
  65 |   test('Wallet page displays balances', async ({ page }) => {
  66 |     await selectTab(page, "Wallet");
  67 |     await page.waitForTimeout(5000);
  68 |     
  69 |     const content = await page.content();
  70 |     console.log("WALLET PAGE CONTENT SNAPSHOT (partial):", content.substring(0, 1000));
  71 |     console.log("PAGE HAS 'ITK Balance':", content.includes('ITK Balance'));
  72 | 
  73 |     // Wallet should be visible - look for the ITK label
  74 |     await expect(page.getByText(/ITK Balance/i).first()).toBeVisible({ timeout: 20000 });
  75 |   });
  76 | });
  77 | 
```