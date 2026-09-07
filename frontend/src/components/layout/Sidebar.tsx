import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, TrendingUp, Network, AlertTriangle,
  Lightbulb, Target, UserCheck, PlayCircle, ShieldAlert,
  Link2, Globe, Server, BarChart3, CheckSquare,
  Cpu, FileText, Settings, LogOut
} from 'lucide-react';
import { api, authStorage } from '../../services/api';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navSections = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'SOC Overview', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Live Monitoring', path: '/monitoring', icon: Activity, badge: 'LIVE' },
      { name: 'Attack Forecast', path: '/forecast', icon: TrendingUp, badge: 'K-STEP' },
      { name: 'Network Graph', path: '/graph', icon: Network },
      { name: 'Incidents', path: '/incidents', icon: AlertTriangle }
    ]
  },
  {
    title: 'AI INTELLIGENCE',
    items: [
      { name: 'Explainable AI', path: '/xai', icon: Lightbulb },
      { name: 'MITRE ATT&CK', path: '/mitre', icon: Target },
      { name: 'UEBA Analytics', path: '/ueba', icon: UserCheck },
      { name: 'Threat Intel', path: '/threat-intel', icon: Globe }
    ]
  },
  {
    title: 'DECISION & DEFENCE',
    items: [
      { name: 'What-If Simulation', path: '/simulation', icon: PlayCircle },
      { name: 'Active Defence', path: '/response', icon: ShieldAlert, badge: 'GATE' },
      { name: 'Blockchain Ledger', path: '/blockchain', icon: Link2 }
    ]
  },
  {
    title: 'GOVERNANCE & SYSTEM',
    items: [
      { name: 'Assets & Hosts', path: '/assets', icon: Server },
      { name: 'Historical Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Compliance & Audit', path: '/compliance', icon: CheckSquare },
      { name: 'AI Models & Drift', path: '/models', icon: Cpu },
      { name: 'Audit Logs', path: '/audit', icon: FileText },
      { name: 'System Settings', path: '/settings', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authStorage.getUser();

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0B0F19] flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex-1 py-4 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-[11px] font-mono tracking-wider text-slate-500 uppercase font-semibold">
              {section.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-all group ${
                        isActive
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operator Status & Quick Logout Footer Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-colors">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 text-left overflow-hidden min-w-0 flex-1 hover:opacity-80 transition-opacity"
            title="View Profile & Security"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold shrink-0">
              {(currentUser?.username || 'OP').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 truncate font-mono">
                {currentUser?.username || 'SOC Lead'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono truncate">
                {currentUser?.role || 'SUPER_ADMIN'}
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Log Out of SOC Console"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all shrink-0 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="py-2 px-3 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 text-center">
        NTRO · Smart India Hackathon
      </div>
    </aside>
  );
};
