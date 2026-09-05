import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, LayoutDashboard, TrendingUp, Network, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { useSocStore } from '../../context/useSocStore';

export const CommandPalette: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen } = useSocStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const quickLinks = [
    { title: 'SOC Overview Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Operations' },
    { title: 'Attack Forecast (K-Step Timeline)', path: '/forecast', icon: TrendingUp, category: 'AI Forecaster' },
    { title: 'Network Topological Graph G_t', path: '/graph', icon: Network, category: 'Graph Twin' },
    { title: 'Explainable AI Feature Drivers', path: '/xai', icon: Lightbulb, category: 'XAI' },
    { title: 'MITRE ATT&CK Matrix', path: '/mitre', icon: Target, category: 'Tactics' },
    { title: 'Incident INC-2026-0042 (WKSTN-042)', path: '/incidents', icon: AlertTriangle, category: 'Incidents' },
  ];

  const filtered = quickLinks.filter(l =>
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl glass-panel rounded-xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.2)] overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-cyan-400 mr-3" />
          <input
            type="text"
            placeholder="Search commands, threats, hosts, MITRE techniques..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={() => setIsSearchOpen(false)} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-xs text-center text-slate-500 font-mono">No matching results found.</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-slate-200 group-hover:text-cyan-300">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{item.category}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
          <span>Navigate with ↵ Enter</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
