import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('================================================================================');
  console.log('🚀 INTEGRITY COMMAND CENTER: 48-STATE COMBINATORIC UI VALIDATION SWEEP');
  console.log('================================================================================');

  const outputDir = '/home/xibalba/Projects/integrity-protocol/.screenshots';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean old screenshots
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    if (file.startsWith('state_') && file.endsWith('.png')) {
      fs.unlinkSync(path.join(outputDir, file));
    }
  }

  console.log('[SWEEP] Cleaned old state screenshots.');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Handle page errors
  page.on('pageerror', (err) => {
    console.error(`[PAGE_ERROR]: ${err.message}`);
  });

  console.log('[SWEEP] Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('[SWEEP] Authenticating as Master Agent (xibalbasolutions@gmail.com)...');
  await page.fill('input[type="text"]', 'xibalbasolutions@gmail.com');
  await page.fill('input[type="password"]', 'Holl@2026');
  await page.click('button[type="submit"]');

  console.log('[SWEEP] Waiting for dashboard bootstrap...');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000); // Give dashboard time to fetch agents list

  // State axes definitions
  const tabs = ['command', 'sandbox', 'settings'];
  const wallets = [false, true];
  const agents = [false, true];
  const registries = [false, true];
  const onboardings = [false, true];

  let stateCounter = 0;
  const totalStates = tabs.length * wallets.length * agents.length * registries.length * onboardings.length;

  console.log(`[SWEEP] Commencing combinatoric sweep across all ${totalStates} UI states...`);

  for (const tab of tabs) {
    for (const wallet of wallets) {
      for (const agent of agents) {
        for (const registry of registries) {
          for (const onboarding of onboardings) {
            stateCounter++;

            // Inject state changes via the custom exposed window hooks
            await page.evaluate(({ tab, wallet, agent, registry, onboarding }) => {
              if (typeof window.__setTab === 'function') {
                window.__setTab(tab);
                window.__setSelectedAgentState(agent);
                window.__setRegistryOpen(registry);
                window.__setOnboardingOpen(onboarding);
                window.__setMetaMaskAddress(wallet ? '0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556' : null);
              } else {
                throw new Error("Automation hooks not found on window object! Check Dashboard.tsx compile.");
              }
            }, { tab, wallet, agent, registry, onboarding });

            // A short delay to allow React state updates and CSS transitions to complete
            await page.waitForTimeout(150);

            // Construct screenshot file name
            const filename = `state_${String(stateCounter).padStart(2, '0')}_tab_${tab}_wallet_${wallet}_agent_${agent}_registry_${registry}_onboard_${onboarding}.png`;
            const filepath = path.join(outputDir, filename);

            await page.screenshot({ path: filepath });

            console.log(`  [State ${String(stateCounter).padStart(2, '0')}/${totalStates}] Saved: ${filename}`);
          }
        }
      }
    }
  }

  await browser.close();

  console.log('================================================================================');
  console.log(`✅ SUCCESS: All ${stateCounter}/${totalStates} combinatoric UI states captured successfully!`);
  console.log(`📂 Screenshots directory: ${outputDir}`);
  console.log('================================================================================');
}

run().catch((err) => {
  console.error('[SWEEP_FAILED]', err);
  process.exit(1);
});
