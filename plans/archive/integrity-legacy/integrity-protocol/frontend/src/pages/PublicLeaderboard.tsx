import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  AlertCircle, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  ArrowUpRight,
  Globe,
  Activity
} from 'lucide-react';
import { Sparkline } from '../components/ui/Sparkline';

const PROVIDERS = [
  {
    rank: 1,
    name: 'OpenAI (GPT-4o)',
    ais: 842,
    entropy: 0.12,
    uptime: '99.98%',
    tier: 'AAA',
    color: 'var(--accent-emerald)',
    trend: [65, 78, 82, 85, 84, 86, 84],
    verification: 'Certified',
  },
  {
    rank: 2,
    name: 'Anthropic (Claude 3.5)',
    ais: 835,
    entropy: 0.15,
    uptime: '99.92%',
    tier: 'AAA',
    color: 'var(--accent-cyan)',
    trend: [72, 75, 80, 81, 83, 85, 83],
    verification: 'Certified',
  },
  {
    rank: 3,
    name: 'Together.ai (Llama-3-70B)',
    ais: 795,
    entropy: 0.08,
    uptime: '99.85%',
    tier: 'AA',
    color: 'var(--accent-blue)',
    trend: [60, 65, 70, 75, 78, 80, 79],
    verification: 'Community-Audit',
  },
  {
    rank: 4,
    name: 'Akash Network (DePIN)',
    ais: 685,
    entropy: 0.25,
    uptime: '98.50%',
    tier: 'BBB',
    color: 'var(--accent-rose)',
    trend: [50, 55, 62, 68, 65, 72, 68],
    verification: 'Stake-Proven',
  },
  {
    rank: 5,
    name: 'Groq (LPU Inference)',
    ais: 642,
    entropy: 0.35,
    uptime: '99.10%',
    tier: 'BBB',
    color: 'var(--accent-amber)',
    trend: [40, 45, 55, 60, 62, 65, 64],
    verification: 'Pending',
  },
];

export const PublicLeaderboard = () => {
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
            <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black tracking-[0.2em] rounded uppercase border border-amber-500/20">
                Global Index Q2 2026
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 leading-none flex items-center gap-3 tracking-tight">
            <Trophy className="text-amber-500" size={32} /> Integrity <span className="gradient-text">Public Hub</span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium">Real-time stability and reputation tracking for global AI inference providers.</p>
        </div>
        <div className="flex gap-2 text-[10px] items-center text-zinc-500 uppercase tracking-widest font-black mono">
          <span className="status-ping">
            <span className="status-ping-inner bg-emerald-500"></span>
            <span className="status-ping-dot bg-emerald-500"></span>
          </span>
          Live Audit Stream Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Highest Stability', provider: 'Together.ai', val: '0.08 σ', icon: Zap, color: 'var(--accent-cyan)' },
          { label: 'Highest Uptime', provider: 'OpenAI', val: '99.98%', icon: ShieldCheck, color: 'var(--accent-emerald)' },
          { label: 'Most Improved', provider: 'Akash Network', val: '+12% AIS', icon: TrendingUp, color: 'var(--accent-blue)' },
          { label: 'Market Avg AIS', provider: 'Global-Wide', val: '719.4', icon: Cpu, color: 'var(--accent-purple)' },
        ].map((stat, i) => (
          <motion.div key={i} variants={item} className="glass-card p-5 group hover:border-zinc-700 transition-all cursor-default">
            <div className="flex justify-between items-start mb-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{stat.label}</div>
              <stat.icon size={16} style={{ color: stat.color }} strokeWidth={2.5} />
            </div>
            <div className="text-base font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{stat.provider}</div>
            <div className="text-xl font-black tracking-tighter mono" style={{ color: stat.color }}>{stat.val}</div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="glass-card overflow-hidden border-zinc-800/50">
        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h2 className="text-sm font-black flex items-center gap-2 tracking-widest text-zinc-400 uppercase">
             Inference Provider Rankings
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded bg-cyan-400" /> AIS_Stability_Trend
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-zinc-600 uppercase font-black tracking-widest bg-black/20">
                <th className="px-6 py-4">RANK</th>
                <th className="px-6 py-4">PROVIDER_ENTITY</th>
                <th className="px-6 py-4 text-center">STABILITY_TREND</th>
                <th className="px-6 py-4 text-center">UPTIME</th>
                <th className="px-6 py-4 text-center">AIS_SCORE</th>
                <th className="px-6 py-4 text-center">STATUS</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {PROVIDERS.map((p) => (
                <tr key={p.rank} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                  <td className="px-6 py-5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                      {p.rank}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                        {p.name}
                        {p.rank <= 2 && <ShieldCheck size={14} className="text-cyan-500" />}
                      </div>
                      <div className="mono text-[10px] text-zinc-600">ID:0x{p.rank}FF...{p.rank}ED</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-2">
                      <Sparkline data={p.trend} color={p.color} width={80} />
                      <span className="mono text-[10px] font-bold text-zinc-500">{p.entropy} σ</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="text-xs font-black text-emerald-500 mono tracking-tighter">{p.uptime}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-xl font-black text-white leading-none tracking-tighter mb-1">{p.ais}</div>
                      <div className={`text-[9px] font-black uppercase tracking-widest ${p.ais >= 800 ? 'text-cyan-500' : 'text-zinc-600'}`}>{p.tier}_TIER</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-widest ${
                      p.verification === 'Certified' 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                        : 'bg-white/5 text-zinc-500 border-white/10'
                    }`}>
                      {p.verification}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button className="p-2 rounded-lg bg-white/5 text-zinc-600 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-1 glass-card p-6 border-zinc-800/50">
          <h3 className="text-[11px] font-black text-white mb-6 flex items-center gap-2 tracking-[0.2em] uppercase">
            <AlertCircle size={14} className="text-amber-500" /> Integrity Alerts
          </h3>
          <div className="space-y-4">
            {[
              { provider: 'Akash Network', msg: 'Stability detected dipping in US-East-1 nodes.', time: '14m ago', status: 'caution' },
              { provider: 'OpenAI', msg: 'Successfully anchored batch hash 0x7fa...92.', time: '41m ago', status: 'success' },
              { provider: 'Groq', msg: 'Initial AIS manual audit requested.', time: '2h ago', status: 'info' },
            ].map((alert, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className={`w-0.5 h-10 rounded-full mt-0.5 ${
                  alert.status === 'caution' ? 'bg-amber-500' : alert.status === 'success' ? 'bg-emerald-500' : 'bg-cyan-500'
                } group-hover:scale-y-110 transition-transform`} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{alert.provider}</span>
                    <span className="mono text-[9px] text-zinc-600">{alert.time}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium leading-relaxed">{alert.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2 glass-card overflow-hidden h-[260px] relative bg-[#0a0b0d] border-zinc-800/50">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-transparent to-transparent z-10" />
          <div className="cyber-grid absolute inset-0 opacity-20" />
          
          <div className="p-6 relative z-20">
            <h3 className="text-[11px] font-black text-white mb-1 tracking-[0.2em] uppercase">Global Node Distribution</h3>
            <p className="text-[9px] text-zinc-600 mb-8 uppercase tracking-[0.1em] font-black">AIS Density Correlation Matrix</p>
            
            <div className="flex flex-col items-center justify-center h-24">
               <div className="flex items-center gap-3 text-cyan-500/40 text-[10px] font-black tracking-[0.3em] mono">
                  <Activity size={20} className="animate-pulse" /> SYNCING_GLOBAL_HEATMAP...
               </div>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center border-t border-white/5 pt-4">
             <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-10 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-full h-full bg-cyan-500/20"
                    />
                </div>)}
             </div>
             <button className="text-[10px] font-black text-zinc-500 hover:text-white transition-all flex items-center gap-2 tracking-widest uppercase group">
                Full Registry Index <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
