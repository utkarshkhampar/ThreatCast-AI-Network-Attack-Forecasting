import React from 'react';
import { Shield, Search, Bell, Terminal, Activity, Lock, Cpu } from 'lucide-react';
import { useSocStore } from '../../context/useSocStore';
import { authStorage } from '../../services/api';

export const Navbar: React.FC = () => {
  const { isWsConnected, activeDefenceMode, setIsSearchOpen } = useSocStore();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Shield className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-wider font-mono text-slate-100">THREATCAST</span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono tracking-widest uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded">
                v1.0-SOC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight">Temporal Graph World Model for Predictive Cyber Defence</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search shortcut */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 px-3.5 py-1.5 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search threats, assets, MITRE...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">⌘K</kbd>
        </button>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono">
          <Activity className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400' : 'text-cyan-400 animate-pulse'}`} />
          <span className="text-slate-300">STREAM:</span>
          <span className={isWsConnected ? 'text-emerald-400' : 'text-cyan-400'}>
            {isWsConnected ? 'LIVE WS' : 'POLLING ACTIVE'}
          </span>
        </div>

        {/* Active Defence Mode Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">GUARDRAIL:</span>
          <span className="text-amber-400 font-semibold">{activeDefenceMode}</span>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
            {(authStorage.getUser()?.username || 'OP').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-medium text-slate-200">
              {authStorage.getUser()?.username || 'Lead SOC Admin'}
            </div>
            <div className="text-[10px] text-cyan-400/80 font-mono">
              {authStorage.getUser()?.role || 'SUPER_ADMIN'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
