// @ts-nocheck
import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  XIBALBA SHIELD — Violation Blocking Test");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // This run contains a SSN in the prompt, which should trigger the OPA regex violation
  const run = {
    note: "Patient encounter.",
    prompt: "Extract diagnosis for patient with SSN 123-45-6789."
  };

  console.log("Sending clinical encounter with potential PHI leak...");

  try {
    const response = await fetch("http://localhost:3001/api/inference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        clinicalData: { note: run.note, timestamp: Date.now() },
        prompt: run.prompt,
        domain_id: "shield"
      })
    });

    const result = await response.json();
    
    if (response.status === 403 && result.error === "BCC_BLOCKED") {
      console.log("  ✓ SUCCESS: BCC successfully blocked the PHI exfiltration.");
      console.log(`  ✓ Reason: ${result.reason}\n`);
    } else {
      console.error("  ✖ FAILED: Request was not blocked by BCC.");
      console.log("Response:", result);
    }
  } catch (error) {
    console.error(`  ✖ Simulation run failed: ${error.message}\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
