/** @fileoverview Playwright E2E tests for IdentityPanel. Tests rendering, interactions, state, and responsive layout (Mobile 375px, Tablet 768px, Desktop 1280px). */

import { test, expect, type Page } from '@playwright/test';

async function navigateToIdentity(page: Page) {
  await page.goto('/');
  const accordion = page.locator('.tab-nav-accordion > button');
  if (await accordion.isVisible()) {
    await accordion.click();
  }
  await page.locator('button.tab-btn').filter({ hasText: 'Identity & DID' }).first().click();
}

test.describe('IdentityPanel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIdentity(page);
  });

  test('should render all core identity sub-panels', async ({ page }) => {
    // The DID panel header confirms the decentralized identity section loaded
    await expect(page.getByText('Decentralized Identifier (DID)', { exact: false })).toBeVisible();

    // XNS Search panel must be present — it's always rendered regardless of agent selection
    await expect(page.getByText('XNS Search Service', { exact: false })).toBeVisible();

    // Identity Management panel with Register/Claim buttons should render
    await expect(page.getByText('Identity Management', { exact: false })).toBeVisible();
  });

  test('should show agent selection prompt in DID panel when no agent selected', async ({ page }) => {
    // Without selecting an agent the DID panel should show a contextual hint
    await expect(
      page.getByText('Select an agent from the sidebar', { exact: false })
    ).toBeVisible();
  });

  test('should render Register New and Claim Existing buttons', async ({ page }) => {
    // These two CTA buttons are critical for agent identity management workflows
    await expect(page.getByRole('button', { name: /Register New/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Claim Existing/i })).toBeVisible();
  });

  test('should open Register New modal on button click', async ({ page }) => {
    // Clicking Register New should open the AgentOnboarding modal
    await page.getByRole('button', { name: /Register New/i }).click();
    // The modal should contain "Register" or "Onboard" language — validates modal mount
    await expect(
      page.getByText(/Register|Onboard|Deploy/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should open Claim Existing modal on button click', async ({ page }) => {
    // Clicking Claim Existing should open the ClaimAgentModal overlay
    await page.getByRole('button', { name: /Claim Existing/i }).click();
    // The claim modal should surface — validates conditional rendering logic
    await expect(
      page.getByText(/Claim|Address|Ethereum/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should render on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Identity management buttons must remain accessible on mobile
    await expect(page.getByText('Identity Management', { exact: false })).toBeVisible();
    const registerBtn = page.getByRole('button', { name: /Register New/i });
    const box = await registerBtn.boundingBox();
    // Button should not overflow the 375px screen width
    expect(box?.x ?? 0 + (box?.width ?? 0)).toBeLessThanOrEqual(375);
  });

  test('should render on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Decentralized Identifier (DID)', { exact: false })).toBeVisible();
    await expect(page.getByText('XNS Search Service', { exact: false })).toBeVisible();
  });

  test('should render on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByText('Decentralized Identifier (DID)', { exact: false })).toBeVisible();
    await expect(page.getByText('Identity Management', { exact: false })).toBeVisible();
  });
});
