import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Terminal, Book, Cpu, Shield, Zap, ArrowUpRight, Activity } from 'lucide-react';

export const SDKDocs = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-black tracking-[0.2em] rounded uppercase border border-blue-500/20">
                Developer Integration v2.0
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 leading-none flex items-center gap-3 tracking-tight">
            <Code2 className="text-cyan-400" size={32} /> Developer <span className="gradient-text">Resources</span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium">Integrate Decentralized Reputation v2.0 into your agentic workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card p-8 group border-zinc-800/50 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Terminal size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Python SDK</h2>
            </div>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed font-medium">
              The primary SDK for Python-based LLM frameworks. Includes native support for LangChain, Autogen, and CrewAI orchestration.
            </p>
          </div>
          <div>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-[11px] text-cyan-500/80 mb-8 border border-white/5 flex items-center justify-between group-hover:border-cyan-500/30 transition-colors">
              <span>pip install xibalba-integrity-sdk</span>
              <Code2 size={14} className="opacity-40" />
            </div>
            <a 
              href="https://github.com/XibalbaTechSol/integrity-protocol/blob/main/sdk/python/README.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
              className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 border border-white/5 hover:border-white/10 mt-auto"
            >
              View Python Documentation <ArrowUpRight size={16} />
            </a>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-8 group border-zinc-800/50 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Code2 size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Node.js SDK</h2>
            </div>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed font-medium">
              High-performance TypeScript SDK for Node.js environments. Perfect for server-side agent orchestration and real-time monitoring.
            </p>
          </div>
          <div>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-[11px] text-emerald-500/80 mb-8 border border-white/5 flex items-center justify-between group-hover:border-emerald-500/30 transition-colors">
              <span>npm install @xibalba/integrity-sdk</span>
              <Terminal size={14} className="opacity-40" />
            </div>
            <a 
              href="https://github.com/XibalbaTechSol/integrity-protocol/blob/main/docs/integration-guide.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
              className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 border border-white/5 hover:border-white/10 mt-auto"
            >
              View Node.js Documentation <ArrowUpRight size={16} />
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass-card p-8 border-zinc-800/50">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white flex items-center gap-2 tracking-[0.2em] uppercase">
                <Book size={16} className="text-cyan-400" /> Integration Pattern
            </h3>
            <div className="text-[10px] text-zinc-600 font-mono">FLOW_ID: PROTO_V8_SYNC</div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
          {[
            { title: '1. Register Identity', desc: 'Deploy your SovereignAgent contract via the on-chain AgentFactory.', icon: Shield },
            { title: '2. Capture Telemetry', desc: 'The SDK automatically calculates tri-metric impact for every model call via interceptors.', icon: Zap },
            { title: '3. Async Anchoring', desc: 'Telemetry is ingested by Xibalba and queued for background blockchain anchoring.', icon: Activity },
            { title: '4. Verify Reputation', desc: 'Smart contracts permissionlessly verify your AIS score for high-stakes transactions.', icon: Cpu },
          ].map((step, i) => (
            <div key={i} className="p-6 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-cyan-500/30 transition-all">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-6 font-black text-sm border border-cyan-500/20 group-hover:scale-110 transition-transform">
                {i + 1}
              </div>
              <h4 className="font-black text-white mb-2 tracking-tight uppercase text-xs">{step.title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
          
          {/* Connecting Line Decoration */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10" />
        </div>
      </motion.div>
    </motion.div>
  );
};
