import { test, expect, Page } from '@playwright/test';

async function selectTab(page: Page, label: string) {
  const isMobile = await page.evaluate(() => window.innerWidth <= 768);
  if (isMobile) {
    // If it's not already on the tab, open the accordion
    const activeTabText = await page.locator('.tab-nav-accordion .tab-btn.active').innerText();
    if (!activeTabText.includes(label)) {
      await page.locator('.tab-nav-accordion .tab-btn.active').click();
      await page.waitForTimeout(1000);
    }
  }
  // Click the tab button (works for both desktop nav and mobile accordion list)
  await page.click(`button:has-text("${label}")`);
}

test.describe('Seeded Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    await page.goto('http://localhost:5173/dashboard');
    // Wait for the app shell to load
    await page.waitForSelector('.app-shell', { timeout: 30000 });
  });

  test('Identity page displays seeded agents', async ({ page }) => {
    // Click on the Identity tab button
    await selectTab(page, "Identity & DID");
    await page.waitForTimeout(2000); 

    // Check for a few seeded agents in the sidebar or identity panel
    await expect(page.locator('text=Institutional_Ironclad')).toBeVisible();
    await expect(page.locator('text=Cyber_Sentinel')).toBeVisible();
  });

  test('Ledger page displays transactions', async ({ page }) => {
    await selectTab(page, "Smart Ledger");
    await page.waitForTimeout(3000);

    // Ledger should have log entries with links to Basescan
    const links = page.locator('a[href*="basescan.org/tx/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0); 
  });

  test('Telemetry page displays performance metrics', async ({ page }) => {
    await selectTab(page, "Telemetry");
    await page.waitForTimeout(3000);

    // Check for chart elements (Radar chart)
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 15000 });
  });

  test('Stability Hub displays benchmarks', async ({ page }) => {
    await selectTab(page, "Stability Hub");
    await page.waitForTimeout(3000);

    // We seeded stability benchmarks: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro
    await expect(page.locator('text=GPT-4o')).toBeVisible();
    await expect(page.locator('text=Claude 3.5 Sonnet')).toBeVisible();
  });

  test('Wallet page displays balances', async ({ page }) => {
    await selectTab(page, "Wallet");
    await page.waitForTimeout(5000);
    
    const content = await page.content();
    console.log("WALLET PAGE CONTENT SNAPSHOT (partial):", content.substring(0, 1000));
    console.log("PAGE HAS 'ITK Balance':", content.includes('ITK Balance'));

    // Wallet should be visible - look for the ITK label
    await expect(page.getByText(/ITK Balance/i).first()).toBeVisible({ timeout: 20000 });
  });
});
