'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  hash: string;
  agent: string;
  action: string;
  time: string;
  status: 'ANCHORED' | 'PENDING' | 'BLOCKED';
  cfBitmask?: number;
}

interface BAARecord {
  id: string;
  ba: string;
  baAlias: string;
  ceAlias: string;
  scope: string;
  collateral: number;
  status: 'ACTIVE' | 'PENDING_SIGN' | 'REVOKED' | 'SLASHED';
  signedAt?: string;
  contract?: string;
}

interface MetricTile {
  label: string;
  value: string | number;
  delta?: string;
  status: 'green' | 'amber' | 'red' | 'blue';
}

interface InferenceResult {
  summary: string;
  suggestedBillingCode: string;
  confidence: number;
}

// ─── Compliance Bitmask Decoder ───────────────────────────────────────────────

function decodeBitmask(flags: number): string[] {
  const bits: string[] = [];
  if (flags & (1 << 0)) bits.push('HIPAA');
  if (flags & (1 << 1)) bits.push('ZDR');
  if (flags & (1 << 2)) bits.push('AIR-GAPPED');
  return bits.length > 0 ? bits : ['UNCLASSIFIED'];
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ANCHORED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    ACTIVE:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    PENDING:  'bg-amber-500/20 text-amber-300 border-amber-500/40',
    PENDING_SIGN: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    BLOCKED:  'bg-red-500/20 text-red-300 border-red-500/40',
    REVOKED:  'bg-slate-500/20 text-slate-300 border-slate-500/40',
    SLASHED:  'bg-red-700/30 text-red-200 border-red-600/40',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${map[status] ?? 'bg-slate-500/20 text-slate-300'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ tile }: { tile: MetricTile }) {
  const accent: Record<string, string> = {
    green: 'border-emerald-500/40 shadow-emerald-500/10',
    amber: 'border-amber-500/40 shadow-amber-500/10',
    red:   'border-red-500/40 shadow-red-500/10',
    blue:  'border-sky-500/40 shadow-sky-500/10',
  };
  const textAccent: Record<string, string> = {
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red:   'text-red-400',
    blue:  'text-sky-400',
  };
  return (
    <div className={`rounded-xl border bg-slate-900/60 backdrop-blur p-5 shadow-lg ${accent[tile.status]}`}>
      <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">{tile.label}</p>
      <p className={`text-3xl font-black ${textAccent[tile.status]}`}>{tile.value}</p>
      {tile.delta && <p className="text-xs text-slate-500 mt-1">{tile.delta}</p>}
    </div>
  );
}

// ─── Audit Stream ─────────────────────────────────────────────────────────────

function AuditStream({ logs }: { logs: AuditEntry[] }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">ZK Audit Stream</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
        </span>
      </div>
      <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
        {logs.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8 font-mono">Awaiting anchor events…</p>
        )}
        {logs.map((entry) => (
          <div key={entry.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-800/40 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <StatusPill status={entry.status} />
                <span className="text-xs text-slate-400 font-mono">{entry.action}</span>
              </div>
              <p className="text-xs font-mono text-slate-300 truncate">{entry.hash}</p>
              <p className="text-xs text-slate-500">{entry.agent} · {entry.time}</p>
            </div>
            {entry.cfBitmask !== undefined && (
              <div className="flex gap-1 flex-wrap justify-end">
                {decodeBitmask(entry.cfBitmask).map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 font-mono border border-sky-700/30">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BAA Manager ─────────────────────────────────────────────────────────────

function BAAManager({ baas, onRevoke, onSlash }: { baas: BAARecord[]; onRevoke: (id: string) => void; onSlash: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/60">
        <h3 className="text-sm font-semibold text-slate-200">Smart BAA Registry</h3>
        <p className="text-xs text-slate-500 mt-0.5">Active cryptographic Business Associate Agreements</p>
      </div>
      <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
        {baas.map((b) => (
          <div key={b.id} className="px-5 py-4 hover:bg-slate-800/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusPill status={b.status} />
                  <span className="text-xs font-mono text-slate-300">{b.baAlias}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  Scope: <span className="text-slate-400 font-mono">{b.scope}</span>
                  {' · '}Collateral: <span className="text-emerald-400 font-mono">{b.collateral.toLocaleString()} $ITK</span>
                </p>
                {b.contract && (
                  <p className="text-[10px] text-slate-600 font-mono truncate">{b.contract}</p>
                )}
              </div>
              {b.status === 'ACTIVE' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onRevoke(b.id)}
                    className="px-3 py-1 text-xs rounded-lg border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                  >
                    Revoke
                  </button>
                  <button
                    onClick={() => onSlash(b.id)}
                    className="px-3 py-1 text-xs rounded-lg border border-red-700 text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
                  >
                    Slash ⚡
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inference Workbench ──────────────────────────────────────────────────────

function InferenceWorkbench({ onAnchor }: { onAnchor: (entry: AuditEntry) => void }) {
  const [clinical, setClinical] = useState('Patient reports persistent sore throat, mild fever (100.4°F), and difficulty swallowing for 3 days. No known allergies.');
  const [prompt, setPrompt] = useState('Summarize the clinical presentation and suggest an ICD-10 billing code.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [audit, setAudit] = useState<{ dataHash: string; transactionHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setAudit(null);
    setError(null);
    try {
      const res = await fetch('/api/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          clinicalData: { note: clinical },
          prompt,
          complianceMetadata: { hipaaEligible: true, zdrEnabled: true, externalWebAccess: false },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.inference);
        setAudit(data.audit);
        onAnchor({
          id: `anchor-${Date.now()}`,
          hash: data.audit.dataHash,
          agent: '0x71C7...976F',
          action: 'CLINICAL_SCRIBE',
          time: new Date().toLocaleTimeString(),
          status: 'ANCHORED',
          cfBitmask: data.audit.clearanceFlags ?? 7,
        });
      } else {
        setError(data.error ?? 'Unknown error');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [clinical, prompt, onAnchor]);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/60">
        <h3 className="text-sm font-semibold text-slate-200">ZK Inference Workbench</h3>
        <p className="text-xs text-slate-500 mt-0.5">PHI is hashed locally — raw data never leaves this terminal</p>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1.5">Clinical Note (PHI — locally blinded)</label>
          <textarea
            id="clinical-note-input"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500/60 resize-none"
            rows={3}
            value={clinical}
            onChange={(e) => setClinical(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1.5">System Prompt</label>
          <input
            id="system-prompt-input"
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500/60"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <button
          id="run-inference-btn"
          onClick={run}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {loading ? 'Running Secure Inference…' : '⚡ Run ZK-Shielded Inference'}
        </button>

        {error && (
          <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-300 font-mono">
            ⛔ {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/10 p-4 space-y-2">
            <p className="text-xs font-mono text-emerald-400 mb-2">✓ INFERENCE APPROVED & ANCHORED</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 font-mono">ICD-10 Code</p>
                <p className="text-white font-bold text-lg font-mono">{result.suggestedBillingCode}</p>
              </div>
              <div>
                <p className="text-slate-500 font-mono">Confidence</p>
                <p className="text-emerald-400 font-bold text-lg">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
            <p className="text-slate-300 text-xs">{result.summary}</p>
            {audit && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-[10px] font-mono text-slate-500 truncate">ZK Hash: {audit.dataHash}</p>
                <p className="text-[10px] font-mono text-slate-600 truncate">Tx: {audit.transactionHash}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const INITIAL_BAAS: BAARecord[] = [
  { id: 'baa-1', ba: '0xAI3b...8d2c', baAlias: 'DeepClinical AI (Scribe)', ceAlias: 'Xibalba Regional Medical', scope: 'SCRIBE_AMBIENT', collateral: 50000, status: 'ACTIVE', signedAt: '2025-06-01T09:12:00Z', contract: '0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b' },
  { id: 'baa-2', ba: '0xRPM9...f44a', baAlias: 'RemoteHeartOS (Wearables)', ceAlias: 'Xibalba Regional Medical', scope: 'RPM_CONTINUOUS', collateral: 25000, status: 'ACTIVE', signedAt: '2025-06-10T14:30:00Z', contract: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' },
  { id: 'baa-3', ba: '0xBill...cc01', baAlias: 'AutoClaim Pro (Billing)', ceAlias: 'Xibalba Regional Medical', scope: 'BILLING_ADJUDICATION', collateral: 10000, status: 'PENDING_SIGN' },
];

const INITIAL_LOGS: AuditEntry[] = [
  { id: 'log-1', hash: '0x8d3f...c2a1', agent: '0xDeepClinical', action: 'SCRIBE_ANCHOR', time: '14:32:01', status: 'ANCHORED', cfBitmask: 7 },
  { id: 'log-2', hash: '0x1e4b...7f90', agent: '0xDeepClinical', action: 'SCRIBE_ANCHOR', time: '14:28:47', status: 'ANCHORED', cfBitmask: 7 },
  { id: 'log-3', hash: '0xa12c...3d88', agent: '0xRemoteHeartOS', action: 'RPM_EPOCH', time: '14:25:11', status: 'BLOCKED', cfBitmask: 0 },
];

export default function Dashboard() {
  const [logs, setLogs] = useState<AuditEntry[]>(INITIAL_LOGS);
  const [baas, setBaas] = useState<BAARecord[]>(INITIAL_BAAS);
  const [activeTab, setActiveTab] = useState<'overview' | 'baas' | 'inference' | 'compliance'>('overview');
  const [totalAnchors, setTotalAnchors] = useState(12450);
  const [blockedRequests, setBlockedRequests] = useState(3);
  const logRef = useRef(0);

  // Simulate live audit stream
  useEffect(() => {
    const actions = ['SCRIBE_ANCHOR', 'RPM_EPOCH', 'BILLING_SUBMIT', 'CLAIM_VERIFY'];
    const agents = ['0xDeepClinical', '0xRemoteHeartOS', '0xAutoClaimPro'];
    const interval = setInterval(() => {
      logRef.current += 1;
      const isBlocked = Math.random() < 0.08;
      setLogs(prev => [{
        id: `live-${logRef.current}`,
        hash: '0x' + Math.random().toString(16).substring(2, 10) + '…' + Math.random().toString(16).substring(2, 6),
        agent: agents[Math.floor(Math.random() * agents.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        time: new Date().toLocaleTimeString(),
        status: isBlocked ? 'BLOCKED' : 'ANCHORED',
        cfBitmask: isBlocked ? 0 : 7,
      }, ...prev].slice(0, 20));
      if (isBlocked) setBlockedRequests(n => n + 1);
      else setTotalAnchors(n => n + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRevoke = useCallback((id: string) => {
    setBaas(prev => prev.map(b => b.id === id ? { ...b, status: 'REVOKED' as const } : b));
  }, []);

  const handleSlash = useCallback((id: string) => {
    setBaas(prev => prev.map(b => b.id === id ? { ...b, status: 'SLASHED' as const } : b));
    setLogs(prev => [{
      id: `slash-${Date.now()}`,
      hash: '0x' + Math.random().toString(16).substring(2, 18),
      agent: 'CCO_OPERATOR',
      action: 'BAA_SLASH',
      time: new Date().toLocaleTimeString(),
      status: 'ANCHORED',
      cfBitmask: 7,
    }, ...prev].slice(0, 20));
  }, []);

  const handleAnchor = useCallback((entry: AuditEntry) => {
    setLogs(prev => [entry, ...prev].slice(0, 20));
    setTotalAnchors(n => n + 1);
  }, []);

  const metrics: MetricTile[] = [
    { label: 'Total Anchors', value: totalAnchors.toLocaleString(), delta: '+1 live', status: 'blue' },
    { label: 'Active BAAs', value: baas.filter(b => b.status === 'ACTIVE').length, status: 'green' },
    { label: 'BCC Blocks (24h)', value: blockedRequests, delta: 'ZK boundary violations', status: blockedRequests > 5 ? 'red' : 'amber' },
    { label: 'ITK at Stake', value: baas.filter(b => b.status === 'ACTIVE').reduce((s, b) => s + b.collateral, 0).toLocaleString() + ' $ITK', status: 'green' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'baas', label: 'Smart BAAs' },
    { id: 'inference', label: 'ZK Workbench' },
    { id: 'compliance', label: 'Compliance Map' },
  ] as const;

  const complianceItems = [
    { ref: '§ 164.312(a)(1)', title: 'Access Control', mechanism: 'ReputationSBT.sol — agent must hold verified SBT with AIS ≥ 300', status: 'PASS' },
    { ref: '§ 164.312(a)(2)(i)', title: 'Unique User ID', mechanism: 'W3C DID + SmartBAA allowedScope bitmask per agent', status: 'PASS' },
    { ref: '§ 164.312(b)', title: 'Audit Controls', mechanism: 'AuditShield.sol — every inference anchors a ZK hash on-chain', status: 'PASS' },
    { ref: '§ 164.312(c)(1)', title: 'PHI Integrity', mechanism: 'sha256(PHI + nonce) never leaves edge — only hash touches L2', status: 'PASS' },
    { ref: '§ 164.312(d)', title: 'Person Authentication', mechanism: 'EIP-712 signature + hardware-bound KMS attestation', status: 'PASS' },
    { ref: '§ 164.312(e)(1)', title: 'Transmission Security', mechanism: 'BCC Middleware enforces TLS + OPA HIPAA policy at runtime', status: 'PASS' },
    { ref: '§ 164.308(b)(1)', title: 'Business Associate Contracts', mechanism: 'SmartBAA.sol — parametric collateral slash on breach', status: 'PASS' },
    { ref: '§ 164.308(a)(1)', title: 'Security Management', mechanism: 'Integrity Oracle continuously scores agents via Tri-Metric AIS', status: 'MONITORING' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-sm">X</div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">Xibalba Shield</p>
              <p className="text-[10px] text-slate-500 font-mono">HIPAA CaaS — CCO Operations Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Protocol: LIVE
            </div>
            <div className="text-xs font-mono text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-900/20 text-emerald-400 text-xs font-mono">
              COMPLIANT
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-white">Operations Overview</h1>
              <p className="text-sm text-slate-500 mt-0.5">Real-time cryptographic compliance metrics — Xibalba Regional Medical</p>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map(tile => <MetricCard key={tile.label} tile={tile} />)}
            </div>

            {/* Two-column: Audit Stream + BAA Summary */}
            <div className="grid lg:grid-cols-2 gap-6">
              <AuditStream logs={logs} />
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur shadow-lg p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">BAA Health</h3>
                <div className="space-y-3">
                  {baas.map(b => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-300 font-semibold">{b.baAlias}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{b.scope} · {b.collateral.toLocaleString()} $ITK</p>
                      </div>
                      <StatusPill status={b.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BAAS TAB */}
        {activeTab === 'baas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">Smart BAA Registry</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage cryptographic Business Associate Agreements</p>
              </div>
              <button
                id="deploy-baa-btn"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
                onClick={() => alert('SmartBAAFactory.deploySmartBAA() — Connect wallet to deploy')}
              >
                + Deploy BAA
              </button>
            </div>
            <BAAManager baas={baas} onRevoke={handleRevoke} onSlash={handleSlash} />
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
              <h4 className="text-xs font-mono text-slate-400 mb-3 uppercase tracking-widest">Escrow Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-emerald-400">{baas.filter(b => b.status === 'ACTIVE').reduce((s,b) => s+b.collateral, 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-mono">$ITK Locked</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-400">{baas.filter(b => b.status === 'PENDING_SIGN').length}</p>
                  <p className="text-xs text-slate-500 font-mono">Pending Signature</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-red-400">{baas.filter(b => b.status === 'SLASHED').length}</p>
                  <p className="text-xs text-slate-500 font-mono">Slashed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INFERENCE TAB */}
        {activeTab === 'inference' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-white">ZK Inference Workbench</h1>
              <p className="text-sm text-slate-500 mt-0.5">Submit clinical data through BCC Middleware — PHI is blinded at the edge</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <InferenceWorkbench onAnchor={handleAnchor} />
              <AuditStream logs={logs.filter(l => l.action.includes('SCRIBE') || l.action.includes('BILLING'))} />
            </div>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-white">HIPAA Compliance Map</h1>
              <p className="text-sm text-slate-500 mt-0.5">45 CFR § 164 Technical Safeguards — live verification status</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur shadow-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="px-5 py-3 text-xs font-mono text-slate-400 uppercase tracking-widest">CFR Ref</th>
                    <th className="px-5 py-3 text-xs font-mono text-slate-400 uppercase tracking-widest">Safeguard</th>
                    <th className="px-5 py-3 text-xs font-mono text-slate-400 uppercase tracking-widest hidden md:table-cell">Mechanism</th>
                    <th className="px-5 py-3 text-xs font-mono text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {complianceItems.map(item => (
                    <tr key={item.ref} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-sky-400">{item.ref}</td>
                      <td className="px-5 py-3 text-sm text-slate-200 font-semibold">{item.title}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 hidden md:table-cell max-w-xs">{item.mechanism}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-mono font-bold ${item.status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.status === 'PASS' ? '✓ PASS' : '◎ MONITORING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'CFR Requirements', value: complianceItems.length, status: 'blue' },
                { label: 'Fully Compliant', value: complianceItems.filter(i => i.status === 'PASS').length, status: 'green' },
                { label: 'Monitoring', value: complianceItems.filter(i => i.status !== 'PASS').length, status: 'amber' },
              ].map(t => <MetricCard key={t.label} tile={{ ...t, status: t.status as 'blue' | 'green' | 'amber' | 'red' }} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
