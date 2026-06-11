// --- Mock Telemetry & Audit Stream Data ---
const TELEMETRY_TEMPLATES = [
    { title: "CryptoTrader Sweep Execution", provider: "OpenAI gpt-4o", entropy: 0.05, grounding: 0.98, subagent: "XibalbaTrader", detail: "Buy 10 ETH, size: 2.1% equity. Compliance: Approved." },
    { title: "Risk Compliance Auditing Run", provider: "System Engine", entropy: 0.02, grounding: 1.00, subagent: "IntegrityAuditor", detail: "Checked 12 active ledger entries. Violations: 0." },
    { title: "Sentiment Oracle Parsing", provider: "Anthropic Claude-3.5", entropy: 0.12, grounding: 0.94, subagent: "SentimentAnalyst", detail: "Scraped 24 social feeds. Confidence: High." },
    { title: "Volatility Target Drift Scan", provider: "System Engine", entropy: 0.08, grounding: 0.96, subagent: "MacroOracle", detail: "Oil and Bitcoin delta checks. Trend: Flat." },
    { title: "Yield Arbitrage Sizing Hook", provider: "OpenAI gpt-4o", entropy: 0.04, grounding: 0.99, subagent: "XibalbaTrader", detail: "Swept 5 pools on Base Aerodrome. Sizing limit: COMPLIANT." }
];

const VIOLATIONS = [
    {
        title: "Leverage Limit Overreach Violation",
        text: "The XibalbaTrader subagent attempted to initiate a trade sweep committing 23.5% of total portfolio equity, heavily breaching the safety boundary (Max 5.0% single position).",
        subagent: "XibalbaTrader",
        type: "volatility_breach",
        proof: "NoirProof::Verify[\n  PublicInputs: [SizingLimit: 0.05, AttemptedSize: 0.235],\n  VerificationKey: 0x9f8e7d...,\n  ProofHash: 0x5a4b3c2d1e...\n]\nResult: BREACH_DETERMINISTIC_TRUE",
        entropy: 0.85,
        grounding: 0.90
    },
    {
        title: "Cognitive Hallucination Flag",
        text: "The SentimentAnalyst subagent recorded severe cognitive divergence with a perplexity value of 4.82, showing erratic, non-grounded trading assumptions.",
        subagent: "SentimentAnalyst",
        type: "hallucination_breach",
        proof: "NoirProof::Verify[\n  PublicInputs: [PerplexityThreshold: 1.5, ObservedPerplexity: 4.82],\n  VerificationKey: 0x8a7b6c...,\n  ProofHash: 0x4f3e2d1c0b...\n]\nResult: BREACH_DETERMINISTIC_TRUE",
        entropy: 0.55,
        grounding: 0.50
    },
    {
        title: "TPU Attestation Signature Mismatch",
        text: "Active telemetry envelop signatures did not verify against the registered hardware fingerprints, indicating DID/hardware enclave spoofing.",
        subagent: "System Gateway",
        type: "identity_tampering",
        proof: "NoirProof::Verify[\n  PublicInputs: [HardwareFp: 0xb8a27d..., SignedFp: 0x000000...],\n  VerificationKey: 0x7a6b5c...,\n  ProofHash: 0x3e2d1c0b9a...\n]\nResult: BREACH_DETERMINISTIC_TRUE",
        entropy: 0.10,
        grounding: 0.40
    }
];

// --- State Variables ---
let aisScore = 991;
let totalStake = 10000;
let isStreaming = true;
let streamInterval = null;
let currentViolIndex = 0;

// --- Elements ---
const elAis = document.getElementById("ais-value");
const elStake = document.getElementById("stake-value");
const elStream = document.getElementById("telemetry-stream");
const elTimeline = document.getElementById("anchor-timeline");
const btnPause = document.getElementById("btn-pause-stream");
const btnSimulate = document.getElementById("btn-simulate-violation");

// Sliders & Slider values
const sliderVolatility = document.getElementById("slider-volatility");
const valVolatility = document.getElementById("val-volatility");
const sliderHallucination = document.getElementById("slider-hallucination");
const valHallucination = document.getElementById("val-hallucination");
const sliderForgery = document.getElementById("slider-forgery");
const valForgery = document.getElementById("val-forgery");

// Modal Elements
const alertModal = document.getElementById("alert-modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalProof = document.getElementById("modal-proof");
const btnModalSlash = document.getElementById("btn-modal-slash");
const btnModalCancel = document.getElementById("btn-modal-cancel");
const modalClose = document.getElementById("modal-close");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialise live telemetry stream
    for (let i = 0; i < 4; i++) {
        insertTelemetryRow(TELEMETRY_TEMPLATES[i]);
    }
    startStream();

    // 2. Initialise Merkle timeline
    insertAnchorNode("0x1a2b3c4d...e5f6", "1 min ago", 12);
    insertAnchorNode("0x8e9d0c1b...a2f3", "6 mins ago", 50);
    insertAnchorNode("0xf4e5d6c7...b8a9", "11 mins ago", 50);

    // 3. Event Listeners
    btnPause.addEventListener("click", toggleStream);
    btnSimulate.addEventListener("click", triggerViolationModal);
    
    // Sliders
    sliderVolatility.addEventListener("input", (e) => {
        valVolatility.innerText = `${e.target.value}%`;
    });
    sliderHallucination.addEventListener("input", (e) => {
        valHallucination.innerText = `${e.target.value}%`;
    });
    sliderForgery.addEventListener("input", (e) => {
        valForgery.innerText = `${e.target.value}%`;
    });

    // Modal Close
    modalClose.addEventListener("click", closeModal);
    btnModalCancel.addEventListener("click", closeModal);
    btnModalSlash.addEventListener("click", executeSlashingSeizure);
});

// --- Stream Management ---
function startStream() {
    streamInterval = setInterval(() => {
        const randTemplate = TELEMETRY_TEMPLATES[Math.floor(Math.random() * TELEMETRY_TEMPLATES.length)];
        insertTelemetryRow(randTemplate);
        
        // Occasionally insert a Merkle anchor
        if (Math.random() > 0.8) {
            const randomHash = "0x" + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join("") + "...anchor";
            insertAnchorNode(randomHash, "Just now", 50);
        }
    }, 4000);
}

function toggleStream() {
    if (isStreaming) {
        clearInterval(streamInterval);
        btnPause.innerText = "Resume Stream";
        btnPause.classList.add("btn-primary");
        btnPause.classList.remove("btn-outline");
    } else {
        startStream();
        btnPause.innerText = "Pause Stream";
        btnPause.classList.remove("btn-primary");
        btnPause.classList.add("btn-outline");
    }
    isStreaming = !isStreaming;
}

// --- Dynamic Row Insertion Helpers ---
function insertTelemetryRow(data) {
    const row = document.createElement("div");
    row.className = "telemetry-row";
    
    row.innerHTML = `
        <div class="telemetry-main">
            <span class="telemetry-title">${data.title}</span>
            <div class="telemetry-meta">
                <span>🤖 ${data.subagent}</span>
                <span>📡 ${data.provider}</span>
                <span>💡 ${data.detail}</span>
            </div>
        </div>
        <div class="telemetry-metrics">
            <span class="zk-badge">ZK verified</span>
            <div class="t-metric">
                <span class="t-metric-label">Entropy</span>
                <span class="t-metric-value" style="color: ${data.entropy > 0.5 ? 'var(--accent-red)' : 'var(--text-primary)'}">${data.entropy.toFixed(2)}</span>
            </div>
            <div class="t-metric">
                <span class="t-metric-label">Grounding</span>
                <span class="t-metric-value" style="color: ${data.grounding < 0.75 ? 'var(--accent-red)' : 'var(--accent-green)'}">${data.grounding.toFixed(2)}</span>
            </div>
        </div>
    `;

    elStream.prepend(row);
    if (elStream.children.length > 20) {
        elStream.removeChild(elStream.lastChild);
    }
}

function insertAnchorNode(hash, timeLabel, batchSize) {
    const node = document.createElement("div");
    node.className = "anchor-node";
    node.innerHTML = `
        <div class="anchor-indicator">⛓</div>
        <div class="anchor-details">
            <span class="anchor-hash">${hash}</span>
            <div class="anchor-meta">
                <span>Batch: ${batchSize} txs</span>
                <span>${timeLabel}</span>
            </div>
        </div>
    `;
    elTimeline.prepend(node);
    if (elTimeline.children.length > 5) {
        elTimeline.removeChild(elTimeline.lastChild);
    }
}

// --- Simulation Violations and Slashing ---
let activeBreach = null;

function triggerViolationModal() {
    activeBreach = VIOLATIONS[currentViolIndex];
    currentViolIndex = (currentViolIndex + 1) % VIOLATIONS.length;

    modalTitle.innerText = activeBreach.title;
    modalText.innerText = activeBreach.text;
    modalProof.innerText = activeBreach.proof;

    // Open Modal
    alertModal.classList.add("active");
}

function closeModal() {
    alertModal.classList.remove("active");
    activeBreach = null;
}

function executeSlashingSeizure() {
    if (!activeBreach) return;

    // Compute dynamic slash based on slider settings
    let slashPercent = 0.3;
    if (activeBreach.type === "volatility_breach") {
        slashPercent = parseInt(sliderVolatility.value) / 100;
    } else if (activeBreach.type === "hallucination_breach") {
        slashPercent = parseInt(sliderHallucination.value) / 100;
    } else if (activeBreach.type === "identity_tampering") {
        slashPercent = parseInt(sliderForgery.value) / 100;
    }

    const slashAmount = totalStake * slashPercent;
    totalStake = Math.max(0, totalStake - slashAmount);
    
    // Recalculate AIS
    // Baseline calculations
    const s_entropy = Math.exp(-1.5 * (activeBreach.entropy ** 2)) * 1000;
    const s_grounding = activeBreach.grounding * 1000;
    const s_sacrifice = 400; // Tier 1 degradation
    aisScore = Math.min(1000, Math.max(0, Math.floor((s_entropy * 0.35) + (s_grounding * 0.35) + (s_sacrifice * 0.30))));

    // Update UI elements with shiny effects
    elStake.innerText = `${totalStake.toLocaleString()} $ITK`;
    elStake.style.color = "var(--accent-red)";
    elAis.innerText = `${aisScore}/1000`;
    elAis.style.color = "var(--accent-red)";
    elAis.style.textShadow = "0 0 15px rgba(255, 56, 56, 0.4)";

    // Insert telemetry breach event in stream
    const breachEvent = {
        title: `🚨 OUT-OF-BOUNDS BREACH: ${activeBreach.title}`,
        provider: "Base L2 Slashing Engine",
        entropy: activeBreach.entropy,
        grounding: activeBreach.grounding,
        subagent: activeBreach.subagent,
        detail: `CONFISCATED ${slashAmount.toLocaleString()} $ITK collateral via Solidity. AIS score reduced.`
    };
    insertTelemetryRow(breachEvent);

    closeModal();
}
