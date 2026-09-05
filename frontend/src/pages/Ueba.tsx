import React, { useEffect, useState } from 'react';
import { UserCheck, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';

export const Ueba: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/ueba/profiles')
      .then(r => r.json())
      .catch(() => [
        { entity_id: "ENT-WKSTN-042", ip: "192.168.1.45", role: "WORKSTATION", current_deviation_score: 84.5, anomaly_level: "CRITICAL", typical_peers_count: 3 },
        { entity_id: "ENT-SRV-APP", ip: "10.0.0.10", role: "SERVER", current_deviation_score: 38.0, anomaly_level: "MEDIUM", typical_peers_count: 14 },
        { entity_id: "ENT-SRV-DB", ip: "10.0.0.20", role: "DATABASE", current_deviation_score: 12.0, anomaly_level: "LOW", typical_peers_count: 5 },
        { entity_id: "ENT-GW-EDGE", ip: "192.168.1.1", role: "GATEWAY", current_deviation_score: 15.0, anomaly_level: "LOW", typical_peers_count: 22 }
      ])
      .then(setProfiles);
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
