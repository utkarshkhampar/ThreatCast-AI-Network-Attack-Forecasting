import React, { useEffect, useState } from 'react';
import { Server, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { Asset } from '../types';

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    api.getAssets().then(setAssets);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            ENTERPRISE ASSET INVENTORY & ALLOW-LISTED CIDRS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered endpoints, criticality tiers, and baseline behavioural monitoring status.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Enrolled Assets: <span className="text-cyan-400 font-bold">{assets.length}</span>
        </div>
      </div>

      <GlassCard title="Monitored Infrastructure Hosts" badge="ALLOW-LISTED">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">ASSET ID</th>
                <th className="pb-3 font-semibold">NAME</th>
                <th className="pb-3 font-semibold">IP ADDRESS</th>
                <th className="pb-3 font-semibold">TYPE</th>
                <th className="pb-3 font-semibold">CRITICALITY</th>
                <th className="pb-3 font-semibold">ALLOW-LISTED</th>
                <th className="pb-3 font-semibold">RISK SCORE</th>
                <th className="pb-3 font-semibold">UEBA DEVIATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-slate-900/40">
                  <td className="py-3 text-cyan-300 font-bold">{ast.id}</td>
                  <td className="py-3 text-slate-200 font-semibold">{ast.name}</td>
                  <td className="py-3 text-slate-400">{ast.ip_address}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      {ast.asset_type}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ast.criticality === 'CRITICAL' ? 'bg-rose-950 text-rose-400' :
                      (ast.criticality === 'HIGH' ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-300')
                    }`}>
                      {ast.criticality}
                    </span>
                  </td>
                  <td className="py-3">
                    {ast.is_allowlisted ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> No (Untrusted)
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`font-bold ${ast.risk_score >= 70 ? 'text-rose-400' : (ast.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400')}`}>
                      {ast.risk_score} / 100
                    </span>
                  </td>
                  <td className="py-3 text-purple-300 font-bold">
                    {ast.ueba_deviation}%
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
