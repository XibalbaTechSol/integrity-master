#!/usr/bin/env python3
"""
Xibalba Solutions - Integrity Protocol Telemetry Analyzer
Queries the PostgreSQL database, generates high-fidelity visualization charts using matplotlib,
and saves them to the ~/Pictures/ directory with premium design aesthetics.
"""

import os
import sys
import json
import subprocess
import matplotlib.pyplot as plt
import numpy as np

DB_URL = "postgres://xibalba_admin:integrity_secret_123@localhost:5432/integrity_protocol"
PICTURES_DIR = "/home/xibalba/Pictures"

def fetch_telemetry_data():
    cmd = [
        "psql", DB_URL, "-A", "-t", "-c",
        "SELECT json_agg(t) FROM (SELECT current_ais, gpu_hours_verified, performance_entropy, penalty_points, staked_itk, metadata->>'alias' as alias FROM agents WHERE metadata->>'alias' LIKE 'trace_%') t;"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not res.stdout.strip():
        print("❌ Failed to query database.")
        sys.exit(1)
        
    try:
        return json.loads(res.stdout.strip())
    except json.JSONDecodeError:
        print("❌ Failed to parse database response as JSON.")
        sys.exit(1)

def analyze_and_plot():
    data = fetch_telemetry_data()
    if not data:
        print("⚠️ No trace agent records found in database.")
        return
        
    # Extract values
    ais = np.array([float(a["current_ais"]) for a in data])
    entropy = np.array([float(a["performance_entropy"]) for a in data])
    gpu = np.array([float(a["gpu_hours_verified"]) for a in data])
    penalty = np.array([float(a["penalty_points"]) for a in data])
    staked = np.array([float(a["staked_itk"]) for a in data])
    
    # Configure Premium Styling Parameters
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
    plt.rcParams['text.color'] = '#2d3748'
    plt.rcParams['axes.labelcolor'] = '#4a5568'
    plt.rcParams['xtick.color'] = '#718096'
    plt.rcParams['ytick.color'] = '#718096'
    
    # Palette definition (Flat Premium Light Theme)
    bg_color = '#ffffff'
    grid_color = '#e2e8f0'
    primary_color = '#2b6cb0'  # Deep Slate Blue
    accent_green = '#319795'   # Teal/Emerald
    accent_orange = '#dd6b20'  # Warm Amber
    accent_blue = '#4299e1'    # Sky Blue
    
    fig, axs = plt.subplots(2, 2, figsize=(16, 12), facecolor='#f7fafc')
    
    # 1. Entropy vs AIS Scatter
    ax1 = axs[0, 0]
    ax1.set_facecolor(bg_color)
    sc1 = ax1.scatter(entropy, ais, c=penalty, cmap='coolwarm', edgecolor='#4a5568', linewidths=0.5, alpha=0.9, s=80, zorder=3)
    ax1.set_title("Performance Entropy vs. AIS", fontsize=14, fontweight='bold', pad=15, color='#1a202c')
    ax1.set_xlabel("Entropy (Latency Variance / Plan Loops)", fontsize=11, labelpad=10)
    ax1.set_ylabel("Agent Integrity Score (AIS)", fontsize=11, labelpad=10)
    ax1.grid(True, color=grid_color, linestyle='-', linewidth=0.75, zorder=1)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_color('#cbd5e0')
    ax1.spines['bottom'].set_color('#cbd5e0')
    cbar1 = fig.colorbar(sc1, ax=ax1, shrink=0.8)
    cbar1.set_label("Penalty Points (Security Infractions)", fontsize=10, labelpad=10)
    cbar1.ax.tick_params(labelsize=9)
    cbar1.outline.set_visible(False)
    
    # 2. GPU Hours vs AIS (logarithmic)
    ax2 = axs[0, 1]
    ax2.set_facecolor(bg_color)
    ax2.scatter(gpu, ais, color=accent_green, edgecolor='#4a5568', linewidths=0.5, alpha=0.9, s=80, zorder=3)
    ax2.set_title("Verifiable Compute (GPU Hours) vs. AIS", fontsize=14, fontweight='bold', pad=15, color='#1a202c')
    ax2.set_xlabel("GPU Hours (Sacrifice Index)", fontsize=11, labelpad=10)
    ax2.set_ylabel("Agent Integrity Score (AIS)", fontsize=11, labelpad=10)
    ax2.set_xscale('log')
    ax2.grid(True, which='both', color=grid_color, linestyle='-', linewidth=0.75, zorder=1)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.spines['left'].set_color('#cbd5e0')
    ax2.spines['bottom'].set_color('#cbd5e0')
    
    # 3. Penalty vs AIS Boxplot (binned by penalty levels)
    ax3 = axs[1, 0]
    ax3.set_facecolor(bg_color)
    bins = [0, 0.1, 0.5, 1.0]
    binned_ais = [ais[(penalty >= bins[i]) & (penalty < bins[i+1])] for i in range(len(bins)-1)]
    
    # Custom colored boxplot
    bp = ax3.boxplot(binned_ais, tick_labels=["Low\n(0.0 - 0.1)", "Medium\n(0.1 - 0.5)", "High\n(0.5 - 1.0)"], 
                     patch_artist=True, zorder=3)
    
    colors = [accent_blue, accent_orange, '#e53e3e']
    for patch, color in zip(bp['boxes'], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.8)
        patch.set_edgecolor('#2d3748')
    for median in bp['medians']:
        median.set_color('#ffffff')
        median.set_linewidth(2)
        
    ax3.set_title("AIS Distribution by Security Infractions", fontsize=14, fontweight='bold', pad=15, color='#1a202c')
    ax3.set_xlabel("Penalty Severity Level", fontsize=11, labelpad=10)
    ax3.set_ylabel("Agent Integrity Score (AIS)", fontsize=11, labelpad=10)
    ax3.grid(True, color=grid_color, linestyle='-', linewidth=0.75, zorder=1)
    ax3.spines['top'].set_visible(False)
    ax3.spines['right'].set_visible(False)
    ax3.spines['left'].set_color('#cbd5e0')
    ax3.spines['bottom'].set_color('#cbd5e0')
    
    # 4. Staked ITK vs AIS Scatter (logarithmic)
    ax4 = axs[1, 1]
    ax4.set_facecolor(bg_color)
    ax4.scatter(staked, ais, color=primary_color, edgecolor='#4a5568', linewidths=0.5, alpha=0.9, s=80, zorder=3)
    ax4.set_title("Staked ITK Collateral vs. AIS", fontsize=14, fontweight='bold', pad=15, color='#1a202c')
    ax4.set_xlabel("Staked ITK (Tokens)", fontsize=11, labelpad=10)
    ax4.set_ylabel("Agent Integrity Score (AIS)", fontsize=11, labelpad=10)
    ax4.grid(True, color=grid_color, linestyle='-', linewidth=0.75, zorder=1)
    ax4.spines['top'].set_visible(False)
    ax4.spines['right'].set_visible(False)
    ax4.spines['left'].set_color('#cbd5e0')
    ax4.spines['bottom'].set_color('#cbd5e0')
    
    # Add page header info
    fig.text(0.04, 0.96, "🏛️ Xibalba Solutions", fontsize=20, fontweight='black', color='#1a202c')
    fig.text(0.04, 0.93, "Integrity Protocol Telemetry Analysis | Live Ingestion Dashboard", fontsize=12, color='#718096')
    
    plt.tight_layout(rect=[0.02, 0.02, 0.98, 0.91])
    
    # Ensure Pictures directory exists and save chart
    os.makedirs(PICTURES_DIR, exist_ok=True)
    out_path = os.path.join(PICTURES_DIR, "integrity_telemetry_analysis.png")
    plt.savefig(out_path, dpi=300, facecolor='#f7fafc')
    print(f"🎨 Saved updated telemetry visualization chart to: {out_path}")
    plt.close()

if __name__ == "__main__":
    analyze_and_plot()
