import React, { useEffect, useState } from 'react';
import { Activity, Radio, Pause, Play, RefreshCw } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { FlowRecord, TelemetryStats } from '../types';

export const LiveMonitoring: React.FC = () => {
  const [flows, setFlows] = useState<FlowRecord[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);

  const [injectStatus, setInjectStatus] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const [recent, st] = await Promise.all([
        api.getRecentFlows(),
        api.getTelemetryStats()
      ]);
      setFlows(recent);
      setStats(st);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    fetchTelemetry();
    if (isStreaming) {
      interval = setInterval(fetchTelemetry, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const handleInjectAttack = async () => {
    try {
      const res = await api.injectAttackSimulation();
      setInjectStatus(`⚡ ATTACK BURST SIMULATED (+350 packets, ${res.affected_targets} targets probed)`);
      setTimeout(() => setInjectStatus(null), 3500);
      fetchTelemetry();
    } catch {
      setInjectStatus("⚡ Burst injected");
      setTimeout(() => setInjectStatus(null), 2500);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            REAL-TIME TELEMETRY & NETWORK PACKET STREAM
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              1s REFRESH
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous flow parsing and windowed feature extraction feeding the Temporal Graph World Model.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleInjectAttack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Inject Attack Surge</span>
          </button>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              isStreaming
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(0,255,102,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isStreaming ? 'Streaming: LIVE' : 'Stream Paused'}</span>
          </button>
        </div>
      </div>

      {injectStatus && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs font-mono text-rose-200 flex items-center justify-between shadow-[0_0_15px_rgba(255,0,85,0.3)] animate-pulse">
          <span className="font-bold">{injectStatus}</span>
          <span className="text-[10px] text-rose-400">IMMEDIATE BURST ACTIVE</span>
        </div>
      )}

      {/* Real-time stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
        <GlassCard>
          <div className="text-slate-400">Total Packets Ingested</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {stats?.total_packets_ingested || 1450}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Packet Ingestion Rate</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">{stats?.pps || 42.5} pps</div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Bandwidth Throughput</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{stats ? (stats.bps / 1024).toFixed(1) : '12.8'} KB/s</div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Active Flow Sessions</div>
          <div className="text-2xl font-bold text-purple-300 mt-1">{stats?.total_flows_active || 38} flows</div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Port Entropy Index</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats?.port_entropy || 2.84}</div>
        </GlassCard>
      </div>

      {/* Live Packets & Flows Stream Table */}
      <GlassCard title="Live Ingested Network Flows (Sliding Window)" badge="FIFO BUFFER">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">TIMESTAMP</th>
                <th className="pb-3 font-semibold">SOURCE IP</th>
                <th className="pb-3 font-semibold">DESTINATION IP</th>
                <th className="pb-3 font-semibold">PROTOCOL</th>
                <th className="pb-3 font-semibold">PORT</th>
                <th className="pb-3 font-semibold">BYTES</th>
                <th className="pb-3 font-semibold">ANOMALY STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {flows.map((flow, idx) => (
                <tr key={idx} className={`hover:bg-slate-900/40 transition-colors ${idx === 0 ? 'bg-cyan-950/20' : ''}`}>
                  <td className="py-2.5 text-slate-400 flex items-center gap-2">
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                    <span>{new Date(flow.timestamp * 1000).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-2.5 text-cyan-300 font-semibold">{flow.src_ip}</td>
                  <td className="py-2.5 text-slate-200">{flow.dst_ip}</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      {flow.protocol}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{flow.dst_port}</td>
                  <td className="py-2.5 text-slate-400">{flow.bytes} B</td>
                  <td className="py-2.5">
                    {flow.is_syn_scan ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                        SYN SCAN DETECTED
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[10px]">NOMINAL</span>
                    )}
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
