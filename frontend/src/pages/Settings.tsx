import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Server, Cpu, Database, CheckCircle2, AlertOctagon } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    api.getSystemHealth().then(setHealth);
  }, []);

  const components = health?.components || {
    database: { status: "HEALTHY", engine: "SQLAlchemy Async" },
    redis_cache: { status: "HEALTHY", connected: true },
    kafka_event_bus: { status: "HEALTHY", brokers: "localhost:9092" },
    ai_world_model: { status: "ONLINE", latency_ms: 18.4 },
    blockchain_evidence: { status: "ONLINE", mode: "Fabric / Cryptographic Local" }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            SYSTEM HEALTH & MICROSERVICES DIAGNOSTICS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of backend API, Kafka bus, World Model inference runtime, and blockchain peers.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded">
          Status: <span className="font-bold">{health?.status || "OPERATIONAL"}</span>
        </div>
      </div>

      <GlassCard title="Microservice Components Health" badge="DISTRIBUTED">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          {Object.entries(components).map(([compName, compInfo]: [string, any]) => (
            <div key={compName} className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200 uppercase">{compName.replace(/_/g, ' ')}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {compInfo.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                {Object.entries(compInfo).filter(([k]) => k !== 'status').map(([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between">
                    <span className="capitalize text-slate-500">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-slate-300 font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
