const { ScoringEngine } = require("./dist/scoring");

function validateScoring() {
    console.log("--------------------------------------------------");
    console.log("🚀 VALIDATING SDK REPUTATION CALCULATIONS");
    console.log("--------------------------------------------------");

    const testCases = [
        {
            name: "High Stability Institutional Agent",
            params: {
                avgPartnerAis: 900,
                xibalbaAuditScore: 1.0,
                gpuHoursVerified: 1000,
                hgiRaw: 0.95,
                performanceVariance: 0.05,
                stakedRatio: 0.8,
                agentAgeDays: 365,
                totalVolumeIntg: 1000000,
                verificationTier: 3
            }
        },
        {
            name: "High Variance Sovereign Agent (Ceiling Applied)",
            params: {
                avgPartnerAis: 800,
                xibalbaAuditScore: 0.8,
                gpuHoursVerified: 500,
                hgiRaw: 0.9,
                performanceVariance: 0.8, // Should cause high drag
                stakedRatio: 0.5,
                agentAgeDays: 100,
                totalVolumeIntg: 50000,
                verificationTier: 1 // Max 600
            }
        }
    ];

    testCases.forEach(tc => {
        console.log(`\nTesting: ${tc.name}`);
        const result = ScoringEngine.integrityScore(tc.params);
        console.log(`   - Entropy Score: ${result.entropyScore}`);
        console.log(`   - Grounding Score: ${result.groundingScore}`);
        console.log(`   - Stability Drag: ${result.stabilityDrag}`);
        console.log(`   - Grounding Boost: ${result.groundingBoost}`);
        console.log(`   - FINAL AIS: ${result.integrityScore}`);
        
        // Basic sanity checks
        if (result.integrityScore > 0 && result.integrityScore <= 1000) {
            console.log("✅ Score within valid range (0-1000)");
        } else {
            console.log("❌ Score out of bounds!");
        }

        if (tc.params.verificationTier === 1 && result.integrityScore > 600) {
            console.log("❌ Identity Ceiling NOT enforced!");
        } else if (tc.params.verificationTier === 1) {
            console.log("✅ Identity Ceiling (600) respected");
        }
    });

    console.log("\n--------------------------------------------------");
    console.log("✨ SCORING VALIDATION COMPLETE");
    console.log("--------------------------------------------------");
}

validateScoring();
