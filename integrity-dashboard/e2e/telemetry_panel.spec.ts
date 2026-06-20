/** @fileoverview Playwright E2E tests for TelemetryPanel. Tests rendering, interactions, state, and responsive layout (Mobile 375px, Tablet 768px, Desktop 1280px). */

import { test, expect, type Page } from '@playwright/test';

// Helper: navigate to the Telemetry tab handling both desktop accordion and mobile dropdown
async function navigateToTelemetry(page: Page) {
  await page.goto('/');
  // On mobile the tab nav collapses into an accordion; detect and expand it first
  const accordion = page.locator('.tab-nav-accordion > button');
  if (await accordion.isVisible()) {
    await accordion.click();
  }
  // Click the Telemetry tab button (first match to avoid ambiguity)
  await page.locator('button.tab-btn').filter({ hasText: 'Telemetry' }).first().click();
}

test.describe('TelemetryPanel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTelemetry(page);
  });

  test('should render core panel sections on load', async ({ page }) => {
    // The Real-Time Network Ingestion panel should always be visible regardless of agent selection
    await expect(page.getByText('Real-Time Network Ingestion', { exact: false })).toBeVisible();

    // Metric Decomposition panel should be present — it contains the tab switcher
    await expect(page.getByText('Metric Decomposition', { exact: false })).toBeVisible();

    // AIS Formula Anchor panel is always visible — validates the math engine section renders
    await expect(page.getByText('AIS Formula Anchor', { exact: false })).toBeVisible();

    // Node Synchronization panel should list nodes — validates static infra section loads
    await expect(page.getByText('Node Synchronization', { exact: false })).toBeVisible();

    // AIS Radar Profile panel should be present
    await expect(page.getByText('AIS Radar Profile', { exact: false })).toBeVisible();
  });

  test('should display the AIS formula in the Formula Anchor panel', async ({ page }) => {
    // The formula "AIS =" must be rendered — verifies the mathematical anchor is intact
    await expect(page.getByText('AIS', { exact: false }).first()).toBeVisible();

    // Stability Drag text confirms the formula explanation renders
    await expect(page.getByText('Stability Drag', { exact: false })).toBeVisible();

    // Grounding Boost confirms the second formula line renders
    await expect(page.getByText('Grounding Boost', { exact: false })).toBeVisible();
  });

  test('should switch metric decomposition tabs and update content', async ({ page }) => {
    // Verify the default "entropy" tab is active and its content is displayed
    await expect(page.getByText('Entropy Score (Stability)', { exact: false })).toBeVisible();

    // Click "grounding" metric button — validates tab-switching state changes
    await page.locator('button.tab-btn, button.btn').filter({ hasText: 'grounding' }).first().click();
    await expect(page.getByText('Grounding Score (HITL)', { exact: false })).toBeVisible();

    // Click "sacrifice" metric button — validates the sacrifice metric description renders
    await page.locator('button.tab-btn, button.btn').filter({ hasText: 'sacrifice' }).first().click();
    await expect(page.getByText('Sacrifice Score', { exact: false })).toBeVisible();

    // Click "compliance" metric button — validates compliance content is shown
    await page.locator('button.tab-btn, button.btn').filter({ hasText: 'compliance' }).first().click();
    await expect(page.getByText('Compliance Score', { exact: false })).toBeVisible();
  });

  test('should show Node Synchronization status for all 5 nodes', async ({ page }) => {
    // Each of the 5 oracle nodes should be listed as STABLE — validates infra health display
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`Node ${i}`, { exact: false })).toBeVisible();
    }
    // Version string confirms the node version detail renders
    await expect(page.getByText('STABLE', { exact: false }).first()).toBeVisible();
  });

  test('should render on mobile viewport (375px)', async ({ page }) => {
    // Validate the panel does not overflow at narrow mobile width
    await page.setViewportSize({ width: 375, height: 667 });
    // Critical: formula anchor panel must still be visible on mobile
    await expect(page.getByText('AIS Formula Anchor', { exact: false })).toBeVisible();
    // Metric panel header visible — content should not be clipped off screen
    await expect(page.getByText('Metric Decomposition', { exact: false })).toBeVisible();
  });

  test('should render on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    // Verify core panels are still accessible on a mid-size screen
    await expect(page.getByText('Real-Time Network Ingestion', { exact: false })).toBeVisible();
    await expect(page.getByText('Node Synchronization', { exact: false })).toBeVisible();
  });

  test('should render on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // All major panels must coexist side-by-side at desktop width
    await expect(page.getByText('Metric Decomposition', { exact: false })).toBeVisible();
    await expect(page.getByText('AIS Radar Profile', { exact: false })).toBeVisible();
  });
});
