import { test, expect } from '@playwright/test';

test.describe('Seeded Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    // Navigate directly to the dashboard
    await page.goto('http://localhost:5173/dashboard');
    // Wait for the app shell to load
    await page.waitForSelector('.app-shell');
  });

  test('Identity page displays seeded agents', async ({ page }) => {
    // Click on the Identity tab button
    await page.click('button:has-text("Identity & DID")');
    await page.waitForTimeout(1000); 

    // Check for a few seeded agents in the sidebar or identity panel
    // Sidebar should have them
    await expect(page.locator('.sidebar')).toContainText('Institutional_Ironclad');
    await expect(page.locator('.sidebar')).toContainText('Cyber_Sentinel');
    await expect(page.locator('.sidebar')).toContainText('Sovereign_Slacker');
  });

  test('Ledger page displays transactions', async ({ page }) => {
    await page.click('button:has-text("Smart Ledger")');
    await page.waitForTimeout(2000);

    // Ledger should have rows in the table.
    const rows = page.locator('table tr');
    const count = await rows.count();
    // We expect more than 1 row (header + data)
    expect(count).toBeGreaterThan(1); 
  });

  test('Telemetry page displays performance metrics', async ({ page }) => {
    await page.click('button:has-text("Telemetry")');
    await page.waitForTimeout(2000);

    // Check for chart elements
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 15000 });
  });

  test('Stability Hub displays benchmarks', async ({ page }) => {
    await page.click('button:has-text("Stability Hub")');
    await page.waitForTimeout(2000);

    // We seeded stability benchmarks: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro
    await expect(page.locator('text=GPT-4o')).toBeVisible();
    await expect(page.locator('text=Claude 3.5 Sonnet')).toBeVisible();
  });

  test('Wallet page displays balances', async ({ page }) => {
    await page.click('button:has-text("Wallet")');
    await page.waitForTimeout(2000);

    // Wallet should be visible
    await expect(page.locator('text=ITK Balance')).toBeVisible();
  });
});
