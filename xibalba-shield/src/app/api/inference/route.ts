import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyIntegrityScore, anchorAuditLog } from "@/lib/web3/integrityProtocol";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentAddress, clinicalData, prompt, complianceMetadata } = body;

    if (!agentAddress || !clinicalData || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Identity-Based Access Control via ReputationSBT
    const isAuthorized = await verifyIntegrityScore(agentAddress);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Agent reputation score too low or not found" }, { status: 403 });
    }

    // 1.5 Verify Smart BAA Status (Cryptographic Firewall)
    // The proxy queries SmartBAA.isActive() for this specific agent.
    // If false, the proxy hard-rejects the request before any PHI is processed.
    const isBAAActive = true; // Mocked for MVP: await verifySmartBAA(agentAddress);
    if (!isBAAActive) {
      return NextResponse.json({ error: "Smart BAA inactive or slashed. EMR access denied." }, { status: 403 });
    }

    // 1.75 BCC Middleware Interception (Pre-Execution Guardrails)
    const bccUrl = process.env.BCC_MIDDLEWARE_URL || "http://localhost:8000";
    console.log(`[DEBUG] Calling BCC at ${bccUrl}/v1/bcc/intercept`);
    try {
      const context = {
        clinicalData,
        prompt,
        hospital_id: "HOSPITAL_XIBALBA_01"
      };
      
      // Middleware uses Python's json.dumps(sort_keys=True)
      // We replicate this with a sorted object
      const sortedContext = Object.keys(context).sort().reduce((acc: any, key) => {
        acc[key] = context[key as keyof typeof context];
        return acc;
      }, {});
      
      const intendedStateHash = crypto.createHash("sha256").update(JSON.stringify(sortedContext)).digest("hex");
      
      const bccResp = await fetch(`${bccUrl}/v1/bcc/intercept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment: {
            id: `comm_${Date.now()}`,
            timestamp: Date.now() / 1000,
            agent_id: agentAddress,
            action_type: "CLINICAL_SCRIBE_INFERENCE",
            intended_state_hash: intendedStateHash,
            opa_policy_id: "hipaa_guardrails_v1"
          },
          actual_context: context
        })
      });

      console.log(`[DEBUG] BCC Response Status: ${bccResp.status}`);
      if (bccResp.ok) {
        const bccResult = await bccResp.json();
        console.log(`[DEBUG] BCC Authorized: ${bccResult.authorized}`);
        if (!bccResult.authorized) {
          return NextResponse.json({ 
            error: "BCC_BLOCKED", 
            reason: bccResult.reason 
          }, { status: 403 });
        }
      } else {
        console.warn("BCC Middleware unreachable or errored, operating in FAIL_SAFE mode.");
      }
    } catch (err) {
      console.error("BCC Middleware Error:", err);
      // In production, we might want to block if BCC is down. For MVP, we proceed.
    }

    // 2. Zero-Knowledge "Blind" Execution - Hash the PHI
    // Raw PHI must NEVER touch the blockchain.
    const dataString = JSON.stringify(clinicalData) + prompt;
    const dataHash = "0x" + crypto.createHash("sha256").update(dataString).digest("hex");

    // 2b. Compile the Compliance Bitmask for the generic Integrity Oracle Telemetry
    let clearanceFlags = 0;
    if (complianceMetadata) {
      if (complianceMetadata.hipaaEligible) clearanceFlags |= (1 << 0);
      if (complianceMetadata.zdrEnabled) clearanceFlags |= (1 << 1);
      if (!complianceMetadata.externalWebAccess) clearanceFlags |= (1 << 2);
    }

    // 3. Perform AI Inference (Mocked for MVP)
    const inferenceResult = {
      summary: "Patient presents with symptoms consistent with acute pharyngitis.",
      suggestedBillingCode: "J02.9",
      confidence: 0.95
    };

    // 4. Anchor the interaction on-chain using AuditShield
    const txHash = await anchorAuditLog(dataHash);

    // 5. Dispatch telemetry to Integrity Protocol Oracle with clearanceFlags (Mocked)
    // await dispatchToOracle({ agentId: agentAddress, clearance_flags: clearanceFlags });

    return NextResponse.json({
      success: true,
      inference: inferenceResult,
      audit: {
        dataHash,
        transactionHash: txHash,
        clearanceFlags
      }
    });
  } catch (error) {
    console.error("Inference Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
