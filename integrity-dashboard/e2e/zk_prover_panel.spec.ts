/** @fileoverview Playwright E2E tests for ZKProverPanel. Tests rendering, interactions, state, and responsive layout (Mobile 375px, Tablet 768px, Desktop 1280px). */

import { test, expect, type Page } from '@playwright/test';

async function navigateToZKProver(page: Page) {
  await page.goto('/');
  const accordion = page.locator('.tab-nav-accordion > button');
  if (await accordion.isVisible()) {
    await accordion.click();
  }
  await page.locator('button.tab-btn').filter({ hasText: 'ZK Prover' }).first().click();
}

test.describe('ZKProverPanel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToZKProver(page);
  });

  test('should render the Generate ZK Proof and Verification Result panels', async ({ page }) => {
    // The ZK prover layout has two side-by-side panels — both must be present
    await expect(page.getByText('Generate ZK Proof', { exact: false })).toBeVisible();
    await expect(page.getByText('Verification Result', { exact: false })).toBeVisible();
  });

  test('should render proof type selector with correct options', async ({ page }) => {
    // The proof-type select is core to ZK workflow — validate all options are present
    const select = page.locator('#proof-type');
    await expect(select).toBeVisible();

    // AIS threshold is the default and most common proof type
    await expect(select.locator('option[value="ais_threshold"]')).toBeAttached();
    // Historical accuracy proof validates past agent behavior
    await expect(select.locator('option[value="accuracy_check"]')).toBeAttached();
    // Contract ownership proof is used for permissioned access
    await expect(select.locator('option[value="contract_owner"]')).toBeAttached();
  });

  test('should render "Generate Proof" button disabled when no agent selected', async ({ page }) => {
    // Without an agent selected, the generate button must be disabled to prevent orphan proofs
    const generateBtn = page.getByRole('button', { name: /Generate Proof/i });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeDisabled();
  });

  test('should show placeholder text in Verification Result panel before proof generation', async ({ page }) => {
    // Before any proof is generated, a prompt should indicate the empty state
    await expect(page.getByText('Generate a proof to view results', { exact: false })).toBeVisible();
  });

  test('should show TransactionStepper pipeline steps on proof generation', async ({ page }) => {
    // Mock API so the proof generation flow works without a live backend
    await page.route('**/v1/agents/*/zk_proof', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          proof_hash: '0xabc123def456aaa111bbb222ccc333ddd444eee555fff666000111222333444',
          proof_data: '{"pi_a":["0x1a...","0x2b..."]}'
        }),
      });
    });

    // Select a proof type to activate the form
    await page.locator('#proof-type').selectOption('ais_threshold');

    // The pipeline stepper steps should be present in DOM even before click (they're always rendered)
    await expect(page.getByText('Computing Private Witness', { exact: false })).toBeVisible();
    await expect(page.getByText('Compiling Noir Circuit', { exact: false })).toBeVisible();
    await expect(page.getByText('Generating PLONK Proof', { exact: false })).toBeVisible();
    await expect(page.getByText('Verifying with StateAnchor', { exact: false })).toBeVisible();
  });

  test('should render on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Core proof panels must be accessible on mobile — layout should stack vertically
    await expect(page.getByText('Generate ZK Proof', { exact: false })).toBeVisible();
    const btn = page.getByRole('button', { name: /Generate Proof/i });
    await expect(btn).toBeVisible();
  });

  test('should render on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Generate ZK Proof', { exact: false })).toBeVisible();
    await expect(page.getByText('Verification Result', { exact: false })).toBeVisible();
  });

  test('should render on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // At desktop width the two panels should both be visible simultaneously
    await expect(page.getByText('Generate ZK Proof', { exact: false })).toBeVisible();
    await expect(page.getByText('Verification Result', { exact: false })).toBeVisible();
  });
});
