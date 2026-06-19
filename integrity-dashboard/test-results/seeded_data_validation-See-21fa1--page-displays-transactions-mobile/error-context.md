# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seeded_data_validation.spec.ts >> Seeded Data Validation >> Ledger page displays transactions
- Location: e2e/seeded_data_validation.spec.ts:38:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img "Xibalba" [ref=e7]
        - generic [ref=e8]: Integrity Protocol
      - button [ref=e9] [cursor=pointer]:
        - img [ref=e10]
    - generic [ref=e12]:
      - heading "Fleet Command" [level=2] [ref=e13]
      - generic [ref=e14]: Sovereign Agent Roster
    - generic [ref=e18] [cursor=pointer]:
      - generic [ref=e19]:
        - generic [ref=e22]: Hermes_Xibalba_Sovereign
        - generic [ref=e23]:
          - generic [ref=e24]: Tier AAA
          - generic [ref=e25]: Inst.
      - generic [ref=e27]: 0x67ba5d72...
    - button "Register New Agent" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
      - text: Register New Agent
  - generic [ref=e32]:
    - generic [ref=e33]:
      - generic [ref=e34]:
        - img [ref=e35]
        - generic [ref=e37]:
          - heading "Integrity Command Center" [level=1] [ref=e38]
          - generic [ref=e39]: ORACLE REPUTATION NETWORK v9.0
      - generic [ref=e40]:
        - generic [ref=e41]:
          - img [ref=e42]
          - generic [ref=e45]: "Domain:"
          - combobox [ref=e46] [cursor=pointer]:
            - option "Global (Mesh)" [selected]
            - option "Shield (Healthcare)"
            - option "Quant (Finance)"
            - option "Logistics (Supply)"
        - generic [ref=e47]:
          - img [ref=e48]
          - text: DATABASE ONLINE
        - button "Sync" [ref=e51] [cursor=pointer]:
          - img [ref=e52]
          - text: Sync
        - button "Connect Wallet" [ref=e57] [cursor=pointer]:
          - img [ref=e58]
          - text: Connect Wallet
    - button "Smart Ledger" [ref=e62]:
      - generic [ref=e63]:
        - img [ref=e64]
        - text: Smart Ledger
      - img [ref=e68]
    - main [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e74]:
            - img [ref=e76]
            - text: Global Network State
          - generic [ref=e79]:
            - generic [ref=e80]:
              - generic [ref=e81]:
                - img [ref=e83]
                - generic [ref=e87]:
                  - heading "Protocol Workflow" [level=2] [ref=e88]
                  - text: Real-Time State Propagation
              - generic [ref=e89]: "LAST BLOCK: #..."
            - generic [ref=e90]: The cryptographic pipeline of the Integrity Protocol. From raw agent telemetry ingestion to ZK-Reputation proof generation and final settlement on the Base L2 smart contracts. This visualizer traces the lifecycle of a single reputation update, demonstrating how off-chain telemetry is securely aggregated, cryptographically proven via zero-knowledge circuits, and ultimately anchored to a permissionless blockchain for immutable, public verification.
            - generic [ref=e91]:
              - generic [ref=e92]:
                - generic [ref=e94]:
                  - img [ref=e96]
                  - generic [ref=e99]: Agent
                - generic [ref=e100]:
                  - img [ref=e102]
                  - generic [ref=e104]: Tri-Metric
                - generic [ref=e105]:
                  - img [ref=e107]
                  - generic [ref=e110]: Xibalba
                - generic [ref=e111]:
                  - img [ref=e113]
                  - generic [ref=e116]: Oracle
                - generic [ref=e117]:
                  - img [ref=e119]
                  - generic [ref=e122]: On-Chain
              - generic [ref=e123]:
                - img [ref=e125]
                - generic [ref=e128]:
                  - generic [ref=e129]:
                    - generic [ref=e130]: XIBALBA AUTHENTICATION
                    - heading "Agent Interaction" [level=3] [ref=e131]
                  - paragraph [ref=e132]: AI Agent performs a task (e.g. Inference). Telemetry is captured by the Xibalba SDK.
                - generic [ref=e133]:
                  - img [ref=e134]
                  - generic [ref=e137]: AUDITED
              - generic [ref=e139]:
                - generic [ref=e140]:
                  - 'heading "Smart Contract State: `ReputationRegistry.sol`" [level=4] [ref=e141]':
                    - img [ref=e142]
                    - text: "Smart Contract State: `ReputationRegistry.sol`"
                  - generic [ref=e146]: // BASE_L2_CONNECTED
                - generic [ref=e147]:
                  - generic [ref=e148]:
                    - paragraph [ref=e149]: "contract ReputationRegistry {"
                    - paragraph [ref=e150]: "struct AgentProfile {"
                    - paragraph [ref=e151]: "uint256 ais: 840"
                    - paragraph [ref=e152]: "uint256 jobCount: 1422"
                    - paragraph [ref=e153]: "bool isVerified: true"
                    - paragraph [ref=e154]: "}"
                    - paragraph [ref=e155]: "}"
                  - generic [ref=e156]:
                    - generic [ref=e158]:
                      - generic [ref=e159]: NETWORK GAS (L2)
                      - generic [ref=e160]: 0.00012 ETH
                    - generic [ref=e164]:
                      - generic [ref=e165]: ZK-REPUTATION VERIFICATION
                      - generic [ref=e166]: VALID
        - generic [ref=e178]:
          - generic [ref=e180]:
            - img [ref=e182]
            - text: Immutable Settlement Ledger
          - generic [ref=e187]:
            - generic [ref=e188]:
              - generic [ref=e189]:
                - img [ref=e190]
                - textbox "Filter by TX Hash..." [ref=e193]
              - button "EXPORT" [ref=e195] [cursor=pointer]:
                - img [ref=e196]
                - text: EXPORT
            - generic [ref=e199]:
              - img [ref=e200]
              - text: BASE_SEPOLIA_NODE_01 // TRUST_LEDGER_STREAM
            - generic [ref=e203]: No records found on-chain.
            - generic [ref=e204]:
              - generic [ref=e205]: 0 SECURE_RECORDS_INDEXED
              - generic [ref=e206]:
                - button "PREV" [disabled] [ref=e207]
                - button "NEXT" [ref=e208]
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
> 45 |     expect(count).toBeGreaterThan(0); 
     |                   ^ Error: expect(received).toBeGreaterThan(expected)
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
  61 |     await expect(page.locator('text=GPT-4o')).toBeVisible();
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