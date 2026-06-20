/** @fileoverview Playwright E2E tests for FactoryPanel. Tests rendering, interactions, state, and responsive layout (Mobile 375px, Tablet 768px, Desktop 1280px). */

import { test, expect, type Page } from '@playwright/test';

async function navigateToFactory(page: Page) {
  await page.goto('/');
  const accordion = page.locator('.tab-nav-accordion > button');
  if (await accordion.isVisible()) {
    await accordion.click();
  }
  await page.locator('button.tab-btn').filter({ hasText: 'Contract Factory' }).first().click();
}

test.describe('FactoryPanel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFactory(page);
  });

  test('should render Contract Logic Template and Deployment Pipeline panels', async ({ page }) => {
    // The factory has two primary panels: template selection and the deploy stepper
    await expect(page.getByText('Contract Logic Template', { exact: false })).toBeVisible();
    // Deployment pipeline panel should be visible on the right column
    await expect(page.getByText('Deploy to Base L2', { exact: false }).or(
      page.getByText('Deployment Pipeline', { exact: false })
    )).toBeVisible();
  });

  test('should render the contract type selector with all template options', async ({ page }) => {
    // Validate all 5 contract templates are available — verifying the templates record completeness
    const select = page.locator('#contract-type');
    await expect(select).toBeVisible();

    await expect(select.locator('option[value="SLA"]')).toBeAttached();
    await expect(select.locator('option[value="Escrow"]')).toBeAttached();
    await expect(select.locator('option[value="RevenueShare"]')).toBeAttached();
    await expect(select.locator('option[value="LoanAgreement"]')).toBeAttached();
    await expect(select.locator('option[value="Custom"]')).toBeAttached();
  });

  test('should update code editor content when contract type changes', async ({ page }) => {
    // Default template is SLA — confirm the Solidity SLA contract code is displayed
    await expect(page.getByText('ServiceLevelAgreement', { exact: false })).toBeVisible();

    // Switch to Escrow — the code editor must update with the Escrow template
    await page.locator('#contract-type').selectOption('Escrow');
    await expect(page.getByText('AutonomousEscrow', { exact: false })).toBeVisible();

    // Switch to RevenueShare — verifies template switching state update
    await page.locator('#contract-type').selectOption('RevenueShare');
    await expect(page.getByText('RevShare', { exact: false })).toBeVisible();
  });

  test('should show TransactionStepper pipeline steps', async ({ page }) => {
    // The deployment pipeline stepper lists 4 steps — all must be present in DOM
    await expect(page.getByText('Compiling Source Code', { exact: false })).toBeVisible();
    await expect(page.getByText('Generating ZK-Integrity Proof', { exact: false })).toBeVisible();
    await expect(page.getByText('Broadcasting to Base L2', { exact: false })).toBeVisible();
    await expect(page.getByText('Waiting for Oracle Finality', { exact: false })).toBeVisible();
  });

  test('should have Deploy button disabled when no agent is selected', async ({ page }) => {
    // The deploy action requires an agent to set the owner_address — must be gated
    const deployBtn = page.getByRole('button', { name: /Deploy|Broadcast/i }).first();
    await expect(deployBtn).toBeVisible();
    await expect(deployBtn).toBeDisabled();
  });

  test('should render on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Template selector must be accessible on mobile
    await expect(page.locator('#contract-type')).toBeVisible();
    await expect(page.getByText('Contract Logic Template', { exact: false })).toBeVisible();
  });

  test('should render on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Contract Logic Template', { exact: false })).toBeVisible();
  });

  test('should render on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // At desktop, both columns should be visible simultaneously
    await expect(page.getByText('Contract Logic Template', { exact: false })).toBeVisible();
    await expect(page.getByText('Compiling Source Code', { exact: false })).toBeVisible();
  });
});
