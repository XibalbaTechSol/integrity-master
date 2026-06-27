import { test, expect } from '@playwright/test';

const MOCK_AGENTS = [
  {
    eth_address: '0x1234567890abcdef1234567890abcdef12345678',
    alias: 'Alpha Node',
    current_ais: 850,
    model_class: 'gpt-4o',
    tee_verified: true,
    staked_itk: 5000,
    verification_tier: 2,
    compliance_score: 98,
    entropy_score: 12,
    grounding_score: 950,
    sacrifice_score: 800,
    registered_at: new Date().toISOString(),
    last_active: new Date().toISOString()
  }
];

const MOCK_STATS = {
  active_nodes: 10,
  aggregate_ais: 820,
  protocol_staked_itk: 150000,
  active_disputes: 0,
  tvl: 12450200
};

test.describe('Master Specification Alignment Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Core API
    await page.route('**/v1/user/agents', async route => {
      await route.fulfill({ json: MOCK_AGENTS });
    });
    await page.route('**/v1/protocol/stats', async route => {
      await route.fulfill({ json: MOCK_STATS });
    });
    await page.route('**/v1/agent/*/reputation/history', async route => {
      await route.fulfill({ json: [{ date: new Date().toISOString(), ais: 850 }] });
    });
    
    // Mock Marketplace
    await page.route('**/v1/market/tasks', async route => {
      await route.fulfill({ json: [
        { task_id: 'task_001', title: 'Medical Data Inference', reward_itk: 500, min_ais_required: 800, status: 'OPEN', created_at: new Date().toISOString() }
      ]});
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
  });

  test('Domain Context Selector - Multi-Tenant Isolation', async ({ page }) => {
    const selector = page.locator('select').first(); // The domain selector is in Topbar
    await expect(selector).toBeVisible();
    
    // Check initial value
    await expect(selector).toHaveValue('global');
    
    // Switch to Shield
    await selector.selectOption('shield');
    await expect(selector).toHaveValue('shield');
    
    // Switch to Quant
    await selector.selectOption('quant');
    await expect(selector).toHaveValue('quant');
  });

  test('Xibalba Shield - Smart BAA & HIPAA Safeguards', async ({ page, viewport }) => {
    // For mobile/tablet, we might need to open a menu first or just use hashes
    const isMobile = viewport && viewport.width < 1024;
    if (isMobile) {
      await page.goto('/dashboard#shield');
    } else {
      await page.click('text=Xibalba Shield');
    }
    
    // Verify Smart BAA Management
    await expect(page.getByText('Xibalba Shield: Smart BAA Management')).toBeVisible();
    await expect(page.getByRole('cell', { name: '0xHospital_A' })).toBeVisible();
    
    // Verify Technical Safeguards
    await expect(page.getByText('HIPAA Technical Safeguards')).toBeVisible();
    
    // Verify Shield Telemetry
    await expect(page.getByText('Shield Telemetry: PHI Prevention Logs')).toBeVisible();
    await expect(page.getByText('BLOCKED').first()).toBeVisible(); // Handle multiple matches
  });

  test('Oracle Registry - World Awareness Protocol', async ({ page, viewport }) => {
    const isMobile = viewport && viewport.width < 1024;
    if (isMobile) {
      await page.goto('/dashboard#oracle');
    } else {
      await page.click('text=Oracle Registry');
    }
    
    // Verify Registry Table
    await expect(page.getByText('World Awareness: Oracle Registry')).toBeVisible();
    await expect(page.getByText('National Medical Library')).toBeVisible();
    
    // Verify Consensus Status
    await expect(page.getByText('Oracle Consensus')).toBeVisible();
    
    // Verify Data Provenance Proofs
    await expect(page.getByText('Data Provenance Proofs')).toBeVisible();
    await expect(page.getByText('0xDataProof_').first()).toBeVisible(); // Fix strict mode violation
  });

  test('Forensic Provenance - BCC Intent-Locking audit', async ({ page, viewport }) => {
    const isMobile = viewport && viewport.width < 1024;
    if (isMobile) {
      await page.goto('/dashboard#advanced');
    } else {
      await page.click('text=Advanced');
    }
    
    // Verify Forensic Explorer
    await expect(page.getByText('Forensic Provenance Explorer')).toBeVisible();
    
    // Verify MEV Protection (Private RPC)
    await expect(page.getByText('MEV Protection Settings (Private RPC)')).toBeVisible();
  });

  test('A2A Marketplace - Autonomous Task Creation', async ({ page, viewport }) => {
    const isMobile = viewport && viewport.width < 1024;
    if (isMobile) {
      await page.goto('/dashboard#markets');
    } else {
      await page.click('text=A2A Markets');
    }
    
    // Verify Task Creation Form
    await expect(page.getByText('Create Autonomous Task')).toBeVisible();
    
    // Verify Protocol Logs console
    await expect(page.getByText('Protocol Logs')).toBeVisible();
    
    // Verify Open Tasks table
    await expect(page.getByText('Open Marketplace Tasks')).toBeVisible();
  });
});
