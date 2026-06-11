const { IntegrityClient } = require("./dist/index");

async function validateSDK() {
    console.log("🚀 Validating Xibalba Integrity SDK...");

    const client = new IntegrityClient({
        agentAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        apiUrl: "http://localhost:8001",
        masterToken: "Bearer master_agent_token"
    });

    try {
        // 1. Pre-transaction trust check
        console.log("\n[1/3] Performing trust handshake...");
        const targetAgent = "0xBB88b098defB751B7401B5f6FD89761B7401B5F";
        const handshake = await client.handshake(targetAgent);
        console.log(`✅ Handshake result: ${handshake.trustDecision} (AIS: ${handshake.ais})`);

        // 2. Report a completed deal
        console.log("\n[2/3] Reporting completed transaction...");
        const dealId = `sdk_val_${Date.now()}`;
        const report = await client.reportDeal(
            dealId,
            "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", // Performer
            500, // Amount
            150, // Latency
            0.99 // Accuracy
        );
        console.log(`✅ Deal reported. Integrity Hash: ${report.integrityHash}`);
        console.log(`✅ New AIS impact: ${report.integrityScore}`);

        // 3. Telemetry buffering and flushing
        console.log("\n[3/3] Testing telemetry heartbeat...");
        client.trackEvent({
            eventType: "inference",
            latencyMs: 120,
            tokensIn: 100,
            tokensOut: 200,
            model: "gpt-4",
            accuracy: 0.98
        });

        console.log("Flushing telemetry batch...");
        const telemetryResult = await client.flushTelemetry();
        console.log(`✅ Telemetry processed. New AIS: ${telemetryResult.new_ais}`);

        console.log("\n✨ SDK VALIDATION SUCCESSFUL");
    } catch (error) {
        console.error("\n❌ SDK VALIDATION FAILED");
        console.error(error.message);
        if (error.response) {
            console.error(error.response.data);
        }
        process.exit(1);
    }
}

validateSDK();
