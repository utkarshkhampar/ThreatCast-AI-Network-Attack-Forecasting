import React, { useEffect, useState } from 'react';
import { Globe, Search, ShieldAlert, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';

export const ThreatIntel: React.FC = () => {
  const [iocs, setIocs] = useState<any[]>([]);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    fetch('/api/v1/threat-intelligence/iocs')
      .then(r => r.json())
      .catch(() => [
        { type: "IP", value: "198.51.100.42", reputation: "MALICIOUS", confidence: 0.98, threat_actor: "APT29-Affiliated", first_seen: "2026-08-28", category: "C2 Server" },
        { type: "IP", value: "203.0.113.19", reputation: "SUSPICIOUS", confidence: 0.72, threat_actor: "Unknown Scanner", first_seen: "2026-09-02", category: "Port Scanner" },
        { type: "DOMAIN", value: "telemetry-sync-cdn.xyz", reputation: "MALICIOUS", confidence: 0.94, threat_actor: "Cobalt Strike Profile", first_seen: "2026-08-30", category: "C2 Domain" }
      ])
      .then(setIocs);
  }, []);

  const filtered = iocs.filter(i => i.value.toLowerCase().includes(searchVal.toLowerCase()));

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            THREAT INTELLIGENCE & IOC FEEDS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Normalized Indicators of Compromise, CVE alignments, and threat actor reputation feeds.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search IP, Domain, or Hash..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <GlassCard title="Active IOC Threat Indicators" badge="NORMALIZED">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">TYPE</th>
                <th className="pb-3 font-semibold">INDICATOR VALUE</th>
                <th className="pb-3 font-semibold">REPUTATION</th>
                <th className="pb-3 font-semibold">CONFIDENCE</th>
                <th className="pb-3 font-semibold">THREAT ACTOR</th>
                <th className="pb-3 font-semibold">CATEGORY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((ioc, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{ioc.type}</span>
                  </td>
                  <td className="py-3 text-cyan-300 font-bold">{ioc.value}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ioc.reputation === 'MALICIOUS' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {ioc.reputation}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{Math.round(ioc.confidence * 100)}%</td>
                  <td className="py-3 text-purple-300">{ioc.threat_actor}</td>
                  <td className="py-3 text-slate-400">{ioc.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
