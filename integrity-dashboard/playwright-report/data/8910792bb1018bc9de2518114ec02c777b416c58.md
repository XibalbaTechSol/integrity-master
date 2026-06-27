# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: telemetry-graphs.spec.ts >> TelemetryGraphs Component >> should render multiple metrics and agent xibalba correctly when API responds
- Location: e2e/telemetry-graphs.spec.ts:4:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('select').first()
Expected substring: "Agent Xibalba"
Received string:    ""
Timeout: 10000ms

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for locator('select').first()
    24 × locator resolved to <select class="select"></select>
       - unexpected value ""

```

```yaml
- combobox
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('TelemetryGraphs Component', () => {
  4  |   test('should render multiple metrics and agent xibalba correctly when API responds', async ({ page }) => {
  5  |     // Mock the backend API response
  6  |     await page.route('**/v1/telemetry/latest', async (route) => {
  7  |       const json = [
  8  |         {
  9  |           timestamp: new Date().toISOString(),
  10 |           latency: 45,
  11 |           accuracy: 0.99,
  12 |           deal_value: 120,
  13 |           agent: 'Agent Xibalba',
  14 |           metadata: {
  15 |             discrepancy_ratio: 0.01,
  16 |             semantic_drift: 0.05,
  17 |             transaction_velocity: 15,
  18 |             environment: { cpu_percent: 20, memory_percent: 40 }
  19 |           }
  20 |         }
  21 |       ];
  22 |       await route.fulfill({ json });
  23 |     });
  24 | 
  25 |     // Navigate to the dashboard where TelemetryGraphs is rendered
  26 |     await page.goto('http://localhost:5174/dashboard#telemetry');
  27 | 
  28 |     // Wait for the UI to hydrate
  29 |     await page.waitForTimeout(2000);
  30 | 
  31 |     // Check for the Multi-Metric Telemetry header
  32 |     await expect(page.getByText('Multi-Metric Telemetry')).toBeVisible({ timeout: 10000 });
  33 | 
  34 |     // Verify Agent Xibalba is in the dropdown
  35 |     const selectLocator = page.locator('select').first();
> 36 |     await expect(selectLocator).toContainText('Agent Xibalba');
     |                                 ^ Error: expect(locator).toContainText(expected) failed
  37 | 
  38 |     // Select Agent Xibalba
  39 |     await selectLocator.selectOption({ label: 'Agent Xibalba' });
  40 | 
  41 |     // Verify Metric Toggles are visible
  42 |     await expect(page.getByRole('button', { name: 'Latency (ms)' })).toBeVisible();
  43 |     await expect(page.getByRole('button', { name: 'Accuracy (%)' })).toBeVisible();
  44 | 
  45 |     // Verify we can toggle a metric off and on
  46 |     const semanticDriftBtn = page.getByRole('button', { name: 'Semantic Drift' });
  47 |     await expect(semanticDriftBtn).toBeVisible();
  48 |     await semanticDriftBtn.click(); // Should toggle it on
  49 |   });
  50 | });
  51 | 
  52 | 
```