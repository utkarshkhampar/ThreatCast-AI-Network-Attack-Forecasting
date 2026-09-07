import React, { useEffect, useState } from 'react';
import { UserCheck, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';

export const Ueba: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const load = () => {
      api.getUebaProfiles().then(setProfiles).catch(console.error);
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            USER & ENTITY BEHAVIOUR ANALYTICS (UEBA)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical host baselining, communication peer novelty, and behavioural deviation scoring.
          </p>
        </div>
      </div>

      <GlassCard title="Monitored Entities Behavioural Baselines" badge="Z-SCORE ANOMALIES">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">ENTITY ID</th>
                <th className="pb-3 font-semibold">IP ADDRESS</th>
                <th className="pb-3 font-semibold">ROLE</th>
                <th className="pb-3 font-semibold">TYPICAL PEERS</th>
                <th className="pb-3 font-semibold">DEVIATION SCORE</th>
                <th className="pb-3 font-semibold">ANOMALY LEVEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {profiles.map((p) => (
                <tr key={p.entity_id} className="hover:bg-slate-900/40">
                  <td className="py-3 text-cyan-300 font-bold">{p.entity_id}</td>
                  <td className="py-3 text-slate-200">{p.ip}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{p.role}</span>
                  </td>
                  <td className="py-3 text-slate-400">{p.typical_peers_count} verified hosts</td>
                  <td className="py-3 font-bold text-slate-100">{p.current_deviation_score} / 100</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.anomaly_level === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' :
                      (p.anomaly_level === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' : 'bg-emerald-950 text-emerald-400')
                    }`}>
                      {p.anomaly_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
