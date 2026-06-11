const { chromium } = require('playwright');

(async () => {
  console.log("================================================================");
  console.log("    PLAYWRIGHT UI VALIDATION: INTEGRITY EXPLORER DASHBOARD");
  console.log("================================================================");
  console.log("Launching headless Chromium browser...\n");
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the local HTML file
  const fileUrl = `file:///home/xibalba/integrity/explorer/index.html`;
  console.log(`Navigating to: ${fileUrl}\n`);
  await page.goto(fileUrl);
  
  let allPassed = true;

  async function checkElement(name, selector) {
      process.stdout.write(`Checking for [${name}]... `);
      try {
          const isVisible = await page.locator(selector).first().isVisible();
          if (isVisible) {
              console.log(`✅ FOUND`);
          } else {
              console.log(`❌ MISSING`);
              allPassed = false;
          }
      } catch (e) {
          console.log(`❌ ERROR: ${e.message}`);
          allPassed = false;
      }
  }

  // Check Xibalba Shield Section
  await checkElement('Xibalba Shield Header', 'text=Xibalba Shield: Compliance-as-a-Service');
  await checkElement('HIPAA Pilot Badge', 'text=HIPAA PILOT ACTIVE');
  await checkElement('Raw Telemetry Panel', 'text=Raw Telemetry (Contains PII)');
  await checkElement('ZK Blinding Gateway', 'text=ZK BLINDING');
  await checkElement('Oracle Payload Panel', 'text=Oracle Payload (Zero-Knowledge)');

  console.log("");

  // Check Agent-Fi Polymarket Section
  await checkElement('Agent-Fi Header', 'text=Agent-Fi: Polymarket Oracle Protocol');
  await checkElement('Live Markets Badge', 'text=LIVE MARKETS');
  await checkElement('Market 1042', 'text=MARKET ID #1042');
  await checkElement('Market 1042 Question', 'text=Will the SBF_Bot_v4 Agent be slashed');
  await checkElement('Market 1043 Question', 'text=Will Xibalba maintain an Integrity Score');
  await checkElement('Buy Buttons', 'button:has-text("Buy YES")');

  console.log("\n================================================================");
  if (allPassed) {
      console.log("✅ SUCCESS: All newly implemented components perfectly rendered!");
  } else {
      console.log("❌ ERROR: One or more components failed to render on the DOM.");
      process.exit(1);
  }
  console.log("================================================================\n");
  
  await browser.close();
})();
