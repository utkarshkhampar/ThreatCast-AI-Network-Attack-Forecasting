import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Lock, Clock, Activity, ChevronDown, User, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useSocStore } from '../../context/useSocStore';
import { api, authStorage } from '../../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isWsConnected, activeDefenceMode, setIsSearchOpen } = useSocStore();
  const [liveTime, setLiveTime] = useState<string>('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = authStorage.getUser();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    api.auth.logout();
    navigate('/login');
  };

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

        {/* Real-time Live SOC Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-cyan-500/30 rounded-lg text-xs font-mono shadow-[0_0_10px_rgba(0,240,255,0.1)]">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">SOC TIME:</span>
          <span className="text-cyan-300 font-bold tracking-wider">
            {liveTime || 'SYNCING...'}
          </span>
        </div>

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

        {/* User profile with Interactive Dropdown Menu */}
        <div className="relative pl-2 border-l border-slate-800" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-expanded={isProfileMenuOpen}
            className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {(currentUser?.username || 'OP').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-medium text-slate-200">
                {currentUser?.username || 'Lead SOC Admin'}
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono">
                {currentUser?.role || 'SUPER_ADMIN'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0B0F19]/95 border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl py-2 z-50 font-mono">
              {/* User Header */}
              <div className="px-4 py-3 border-b border-slate-800/80">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentUser?.full_name || currentUser?.username || 'SOC Lead Operator'}
                </div>
                <div className="text-[11px] text-cyan-400 truncate mt-0.5">
                  {currentUser?.email || 'admin@threatcast.soc'}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-slate-400">Clearance:</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                    {currentUser?.role || 'SUPER_ADMIN'}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-colors text-left"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Profile & Clearance</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-colors text-left"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>Change Password</span>
                </button>
              </div>

              {/* Logout Action */}
              <div className="p-1 border-t border-slate-800/80 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors text-left font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out / Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
