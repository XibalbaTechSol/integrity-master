# 🚀 YC Launch & Deployment Guide: Xibalba Solutions

This repository contains the landing page introducing the **Integrity Protocol** and **Jacob Vickers** (Founder, Xibalba Solutions) optimized for YC application review. 

Below is the comprehensive checklist of exactly what you need to verify, set up, and configure before submitting your application.

---

## 📋 YC Application Launch Checklist

### 1. Update the Loom Demo Link
YC reviewers heavily prioritize 1-minute video walkthroughs.
1. Record a **1-minute video** showing:
   * A terminal demonstrating the Python/Rust SDK wrapping a dummy medical LLM agent.
   * An action execution that triggers a HIPAA boundary violation (e.g., trying to export unencrypted patient data).
   * The SDK instantly intercepting the action ($<15\text{ms}$), blocking the network request, generating Aztec ZK logs, and downgrading the agent's AIS reputation score.
2. Upload the video to Loom or YouTube.
3. Open [index.html](file:///home/xibalba/Desktop/personal-site/index.html) and locate the "Watch Demo" button:
   ```html
   <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" class="btn-outline" ...>Watch Demo (1 Min) &rarr;</a>
   ```
4. Replace `https://www.youtube.com/watch?v=dQw4w9WgXcQ` with your active video link.

### 2. Verify GitHub Organizations & Public Repos
YC partners will click documentation and protocol links. Ensure the following paths are active:
* **GitHub Org:** `https://github.com/XibalbaTechSol` must be active.
* **Repositories:** Create public repos (or redirect placeholders) for:
  * `https://github.com/XibalbaTechSol/integrity-master/tree/master/docs/wiki` (Docs)
  * `https://github.com/XibalbaTechSol/integrity-master/tree/master/contracts` (Protocol core)
  * `https://github.com/XibalbaTechSol/integrity-master/tree/master/integrity-sdk` (SDK wrapper)
  * `https://github.com/XibalbaTechSol/integrity-master/tree/master/integrity-oracle` (Axum backend telemetry)

### 3. Upload the Whitepaper PDF
* Ensure your whitepaper is compiled and saved as `whitepaper.pdf`.
* Place it in the correct public directory matching your deployment (e.g., `/docs/xibalba_shield_proposal.pdf` or host it via GitHub Pages at `https://xibalbatechsol.github.io/docs/xibalba_shield_proposal.pdf`).

### 4. Warm Up the Waitlist Backend (Render)
* The waitlist form uses AJAX to send data to `https://xibalba-api.onrender.com/contact`.
* **Important:** Since Render free tiers sleep after 15 minutes of inactivity, YC reviewers could experience a 50-second hang if they are the first to submit their email.
* **Action:** Send a test request to your Render endpoint immediately before YC submission to ensure it is warm.

---

## 🛠️ Local Development & QA Commands

If you make modifications to the styling or HTML copy, run the following automated checks to preserve visual quality:

### Prerequisites
Install Playwright dependencies:
```bash
npm install
```

### Run Layout Integrity Audits
Verify there are no clipping, container width, or horizontal scrollbar regressions:
```bash
node audit.js
```

### Regenerate Verification Screenshots
Re-capture standard desktop and mobile preview screenshots to verify design updates:
```bash
node capture_verification.js
```

---

## 🌐 Deploying to GitHub Pages
To host the site for free on your GitHub custom domains:
1. Initialize the git repository and commit all local files.
2. Create a repository on GitHub named `XibalbaTechSol.github.io` (or your personal username repo).
3. Push your code:
   ```bash
   git remote add origin git@github.com:XibalbaTechSol/XibalbaTechSol.github.io.git
   git branch -M main
   git push -u origin main
   ```
4. Go to **Settings > Pages** on GitHub and verify your site is active.
