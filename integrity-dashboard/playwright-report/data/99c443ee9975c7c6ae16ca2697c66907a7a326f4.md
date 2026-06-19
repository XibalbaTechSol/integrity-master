# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: master_alignment.spec.ts >> Master Specification Alignment Workflows >> Xibalba Shield - Smart BAA & HIPAA Safeguards
- Location: e2e/master_alignment.spec.ts:69:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Xibalba Shield: Smart BAA Management')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Xibalba Shield: Smart BAA Management')

```

```yaml
- complementary:
  - img "Xibalba"
  - text: Integrity Protocol
  - button
  - heading "Fleet Command" [level=2]
  - text: Sovereign Agent Roster Alpha Node Tier AA Linked 0x12345678...
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
- button "Xibalba Shield"
- main:
  - text: Smart BAA Registry
  - button "Propose New"
  - text: Cryptographically-bound Business Associate Agreements (BAAs) mapping AI Agents to Healthcare Providers.
  - table:
    - rowgroup:
      - row "Assoc (Agent) Status Stake Doc Hash":
        - columnheader "Assoc (Agent)"
        - columnheader "Status"
        - columnheader "Stake"
        - columnheader "Doc Hash"
    - rowgroup:
      - row "No BAAs found.":
        - cell "No BAAs found."
  - text: HIPAA Gateway Controls Pre-execution filters enforced by the BCC (Boundary Control Concept) Middleware. PHI Edge-Blinding HMAC-SHA256 Anonymous Pointers Intent Locking (BCC) Prompt-level compliance gating Parametric Liability Automated ITK Slashing logic active Medical Record Interaction Logs
  - button "Export Logs"
  - table:
    - rowgroup:
      - row "Time Action Agent BAA Ref BCC Result":
        - columnheader "Time"
        - columnheader "Action"
        - columnheader "Agent"
        - columnheader "BAA Ref"
        - columnheader "BCC Result"
    - rowgroup:
      - row "Scanning for gateway activity...":
        - cell "Scanning for gateway activity..."
  - text: Compliance Review Queue No pending violations for manual review.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const MOCK_AGENTS = [
  4   |   {
  5   |     eth_address: '0x1234567890abcdef1234567890abcdef12345678',
  6   |     alias: 'Alpha Node',
  7   |     current_ais: 850,
  8   |     model_class: 'gpt-4o',
  9   |     tee_verified: true,
  10  |     staked_itk: 5000,
  11  |     verification_tier: 2,
  12  |     compliance_score: 98,
  13  |     entropy_score: 12,
  14  |     grounding_score: 950,
  15  |     sacrifice_score: 800,
  16  |     registered_at: new Date().toISOString(),
  17  |     last_active: new Date().toISOString()
  18  |   }
  19  | ];
  20  | 
  21  | const MOCK_STATS = {
  22  |   active_nodes: 10,
  23  |   aggregate_ais: 820,
  24  |   protocol_staked_itk: 150000,
  25  |   active_disputes: 0,
  26  |   tvl: 12450200
  27  | };
  28  | 
  29  | test.describe('Master Specification Alignment Workflows', () => {
  30  |   test.beforeEach(async ({ page }) => {
  31  |     // Mock Core API
  32  |     await page.route('**/v1/user/agents', async route => {
  33  |       await route.fulfill({ json: MOCK_AGENTS });
  34  |     });
  35  |     await page.route('**/v1/protocol/stats', async route => {
  36  |       await route.fulfill({ json: MOCK_STATS });
  37  |     });
  38  |     await page.route('**/v1/agent/*/reputation/history', async route => {
  39  |       await route.fulfill({ json: [{ date: new Date().toISOString(), ais: 850 }] });
  40  |     });
  41  |     
  42  |     // Mock Marketplace
  43  |     await page.route('**/v1/market/tasks', async route => {
  44  |       await route.fulfill({ json: [
  45  |         { task_id: 'task_001', title: 'Medical Data Inference', reward_itk: 500, min_ais_required: 800, status: 'OPEN', created_at: new Date().toISOString() }
  46  |       ]});
  47  |     });
  48  | 
  49  |     await page.goto('http://localhost:5173/dashboard');
  50  |     await page.waitForTimeout(1000);
  51  |   });
  52  | 
  53  |   test('Domain Context Selector - Multi-Tenant Isolation', async ({ page }) => {
  54  |     const selector = page.locator('select').first(); // The domain selector is in Topbar
  55  |     await expect(selector).toBeVisible();
  56  |     
  57  |     // Check initial value
  58  |     await expect(selector).toHaveValue('global');
  59  |     
  60  |     // Switch to Shield
  61  |     await selector.selectOption('shield');
  62  |     await expect(selector).toHaveValue('shield');
  63  |     
  64  |     // Switch to Quant
  65  |     await selector.selectOption('quant');
  66  |     await expect(selector).toHaveValue('quant');
  67  |   });
  68  | 
  69  |   test('Xibalba Shield - Smart BAA & HIPAA Safeguards', async ({ page, viewport }) => {
  70  |     // For mobile/tablet, we might need to open a menu first or just use hashes
  71  |     const isMobile = viewport && viewport.width < 1024;
  72  |     if (isMobile) {
  73  |       await page.goto('http://localhost:5173/dashboard#shield');
  74  |     } else {
  75  |       await page.click('text=Xibalba Shield');
  76  |     }
  77  |     
  78  |     // Verify Smart BAA Management
> 79  |     await expect(page.getByText('Xibalba Shield: Smart BAA Management')).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  80  |     await expect(page.getByRole('cell', { name: '0xHospital_A' })).toBeVisible();
  81  |     
  82  |     // Verify Technical Safeguards
  83  |     await expect(page.getByText('HIPAA Technical Safeguards')).toBeVisible();
  84  |     
  85  |     // Verify Shield Telemetry
  86  |     await expect(page.getByText('Shield Telemetry: PHI Prevention Logs')).toBeVisible();
  87  |     await expect(page.getByText('BLOCKED').first()).toBeVisible(); // Handle multiple matches
  88  |   });
  89  | 
  90  |   test('Oracle Registry - World Awareness Protocol', async ({ page, viewport }) => {
  91  |     const isMobile = viewport && viewport.width < 1024;
  92  |     if (isMobile) {
  93  |       await page.goto('http://localhost:5173/dashboard#oracle');
  94  |     } else {
  95  |       await page.click('text=Oracle Registry');
  96  |     }
  97  |     
  98  |     // Verify Registry Table
  99  |     await expect(page.getByText('World Awareness: Oracle Registry')).toBeVisible();
  100 |     await expect(page.getByText('National Medical Library')).toBeVisible();
  101 |     
  102 |     // Verify Consensus Status
  103 |     await expect(page.getByText('Oracle Consensus')).toBeVisible();
  104 |     
  105 |     // Verify Data Provenance Proofs
  106 |     await expect(page.getByText('Data Provenance Proofs')).toBeVisible();
  107 |     await expect(page.getByText('0xDataProof_').first()).toBeVisible(); // Fix strict mode violation
  108 |   });
  109 | 
  110 |   test('Forensic Provenance - BCC Intent-Locking audit', async ({ page, viewport }) => {
  111 |     const isMobile = viewport && viewport.width < 1024;
  112 |     if (isMobile) {
  113 |       await page.goto('http://localhost:5173/dashboard#advanced');
  114 |     } else {
  115 |       await page.click('text=Advanced');
  116 |     }
  117 |     
  118 |     // Verify Forensic Explorer
  119 |     await expect(page.getByText('Forensic Provenance Explorer')).toBeVisible();
  120 |     
  121 |     // Verify MEV Protection (Private RPC)
  122 |     await expect(page.getByText('MEV Protection Settings (Private RPC)')).toBeVisible();
  123 |   });
  124 | 
  125 |   test('A2A Marketplace - Autonomous Task Creation', async ({ page, viewport }) => {
  126 |     const isMobile = viewport && viewport.width < 1024;
  127 |     if (isMobile) {
  128 |       await page.goto('http://localhost:5173/dashboard#markets');
  129 |     } else {
  130 |       await page.click('text=A2A Markets');
  131 |     }
  132 |     
  133 |     // Verify Task Creation Form
  134 |     await expect(page.getByText('Create Autonomous Task')).toBeVisible();
  135 |     
  136 |     // Verify Protocol Logs console
  137 |     await expect(page.getByText('Protocol Logs')).toBeVisible();
  138 |     
  139 |     // Verify Open Tasks table
  140 |     await expect(page.getByText('Open Marketplace Tasks')).toBeVisible();
  141 |   });
  142 | });
  143 | 
```