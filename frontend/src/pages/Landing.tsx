import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, TrendingUp, Cpu, Network, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 cyber-grid flex flex-col justify-between">
      {/* Navbar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-bold font-mono tracking-wider text-slate-100">THREATCAST</span>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              WORLD MODEL
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-400 border border-cyan-500/30 hover:bg-cyan-950/40 transition-colors"
          >
            Register Clearance (OTP)
          </Link>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white transition-colors"
          >
            Operator Login
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
          >
            <span>SOC Mission Control</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <span>Smart India Hackathon · National Technical Research Organisation (NTRO)</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-sans">
          Don't Just Detect the Attack. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            Forecast Where It's Going.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
          ThreatCast transforms network intrusion detection into a sequential forecasting problem. By representing
          host communications as an evolving temporal graph, our latent world model simulates multi-step attacker
          progression before compromise is complete.
        </p>

        {/* Operating Loop Flow Diagram */}
        <div className="pt-8">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">
            Unified Predictive Cyber Defence Loop
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-w-4xl mx-auto text-xs font-mono">
            {['Observe', 'Understand', 'Predict', 'Explain', 'Simulate', 'Defend'].map((step, idx) => (
              <div key={step} className="p-3 rounded-lg glass-panel border border-slate-800">
                <div className="text-[10px] text-slate-500">0{idx + 1}</div>
                <div className="text-cyan-300 font-bold mt-0.5">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 flex justify-center gap-4">
          <Link
            to="/dashboard"
            className="px-8 py-3.5 rounded-xl text-sm font-mono font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:brightness-110 transition-all flex items-center gap-2"
          >
            <span>Launch Live Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/simulation"
            className="px-8 py-3.5 rounded-xl text-sm font-mono font-medium glass-panel border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            What-If Simulator
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-slate-800/80 text-center text-xs font-mono text-slate-500">
        ThreatCast Platform · Built for Critical Information Infrastructure & Enterprise SOCs
      </footer>
    </div>
  );
};
