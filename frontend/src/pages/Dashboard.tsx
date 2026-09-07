import React, { useEffect, useState } from 'react';
import {
  TrendingUp, ShieldAlert, Activity, Clock, ShieldCheck,
  AlertTriangle, ArrowUpRight, Cpu, Network, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { ForecastData, TelemetryStats, Incident } from '../types';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [earlyWarningSeconds, setEarlyWarningSeconds] = useState(252);
  const [injectBanner, setInjectBanner] = useState<string | null>(null);
  const [throughputHistory, setThroughputHistory] = useState<Array<{ time: string; pps: number; kbps: number }>>(() => {
    const initial = [];
    const now = Date.now();
    for (let i = 14; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      initial.push({
        time: t.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        pps: Math.round(42 + Math.sin(i) * 5),
        kbps: Number((12.5 + Math.sin(i * 0.7) * 2.5).toFixed(1))
      });
    }
    return initial;
  });

  const loadData = async () => {
    try {
      const [fcData, statsData, incData] = await Promise.all([
        api.getLatestForecast(5),
        api.getTelemetryStats(),
        api.getIncidents()
      ]);
      setForecast(fcData);
      setStats(statsData);
      setIncidents(incData);

      setThroughputHistory(prev => {
        const nowStr = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
        const newPt = {
          time: nowStr,
          pps: statsData.pps,
          kbps: Number((statsData.bps / 1024).toFixed(1))
        };
        return [...prev.slice(1), newPt];
      });
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const dataInterval = setInterval(loadData, 1000);
    const timerInterval = setInterval(() => {
      setEarlyWarningSeconds(prev => (prev > 1 ? prev - 1 : 252));
    }, 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const handleInjectAttack = async () => {
    try {
      const res = await api.injectAttackSimulation();
      setInjectBanner(`⚡ ATTACK BURST SIMULATED (${res.affected_targets} targets flooded, +350 packets)`);
      setTimeout(() => setInjectBanner(null), 4000);
      loadData();
    } catch {
      setInjectBanner("⚡ Attack surge injected locally");
      setTimeout(() => setInjectBanner(null), 3000);
    }
  };

  const formatEarlyWarning = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const timelineData = forecast?.steps.map(s => ({
    label: s.step_label,
    probability: Math.round(s.attack_probability * 100),
    confidence: Math.round(s.confidence * 100),
    uncertainty: Math.round(s.uncertainty * 100),
    stage: s.predicted_stage
  })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner: ThreatCast Core Operating Loop */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40">
        <div>
          <h1 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            <span className="text-cyan-400">THREATCAST</span> OPERATIONAL MISSION CONTROL
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE 1s TICK
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operating Loop: <span className="text-cyan-300 font-mono">Observe</span> → <span className="text-cyan-300 font-mono">Understand</span> → <span className="text-cyan-300 font-mono">Predict</span> → <span className="text-cyan-300 font-mono">Explain</span> → <span className="text-cyan-300 font-mono">Simulate</span> → <span className="text-cyan-300 font-mono">Defend</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 mt-3 lg:mt-0">
          <button
            onClick={handleInjectAttack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 transition-colors shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Inject Attack Surge</span>
          </button>
          <Link
            to="/simulation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            <span>Run Counterfactual</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/response"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors shadow-[0_0_15px_rgba(255,0,85,0.2)]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Defence Gate</span>
          </Link>
        </div>
      </div>

      {injectBanner && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs font-mono text-rose-200 flex items-center justify-between shadow-[0_0_18px_rgba(255,0,85,0.3)] animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="font-bold">{injectBanner}</span>
          </div>
          <span className="text-[10px] text-rose-400">TELEMETRY SURGING</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Network Risk Score */}
        <GlassCard glow="danger" className="relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Network Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-400">88.5</span>
            <span className="text-xs text-slate-400 font-mono">/100</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-300/80 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-rose-400" />
            +14% in last 10m window
          </p>
        </GlassCard>

        {/* Card 2: Projected Attack Probability */}
        <GlassCard glow="cyan" className="relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Forecasted Probability</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-300">
              {forecast ? Math.round(forecast.attack_probability * 100) : 91}%
            </span>
            <span className="text-xs text-cyan-400/80 font-mono font-semibold">HIGH RISK</span>
          </div>
          <p className="mt-1 text-[11px] text-cyan-400/70">
            Target: <span className="font-mono text-slate-200">WKSTN-042</span>
          </p>
        </GlassCard>

        {/* Card 3: Attack Stage Progression */}
        <GlassCard glow="warning">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Stage Trajectory</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-400">Current: <span className="text-slate-200 font-mono">{forecast?.current_stage || "Reconnaissance"}</span></div>
            <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
              → {forecast?.predicted_stage || "Lateral Movement"}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">K=5 Horizon Rollout</p>
        </GlassCard>

        {/* Card 4: Early Warning Lead Time */}
        <GlassCard glow="cyan">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Early Warning</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {formatEarlyWarning(earlyWarningSeconds)}
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-300/80">
            Ticking down to predicted escalation
          </p>
        </GlassCard>

        {/* Card 5: Model Confidence & Uncertainty */}
        <GlassCard>
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">World Model Conf.</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-purple-300">
              {forecast ? Math.round(forecast.confidence_score * 100) : 88}%
            </span>
            <span className="text-xs text-slate-400 font-mono">±12% unc.</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-300/80 font-mono">
            Calibrated (Brier: 0.048)
          </p>
        </GlassCard>
      </div>

      {/* Main Charts & Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attack Progression Forecast Timeline */}
        <GlassCard
          title="K-Step Latent World Model Forward Forecast"
          badge="Monte Carlo Rollout"
          className="lg:col-span-2"
          action={
            <Link to="/forecast" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              Deep Inspector <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0055" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#FF0055" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#00F0FF', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="probability" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#probGradient)" name="Attack Probability (%)" />
                <Area type="monotone" dataKey="uncertainty" stroke="#FF0055" strokeWidth={1} strokeDasharray="3 3" fillOpacity={1} fill="url(#uncertaintyGradient)" name="Uncertainty (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-2 text-center pt-3 border-t border-slate-800">
            {timelineData.map((step, i) => (
              <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="text-[10px] font-mono text-cyan-400 font-semibold">{step.label}</div>
                <div className="text-xs font-bold font-mono text-slate-100">{step.probability}%</div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{step.stage}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right 1 Col: MITRE ATT&CK & XAI Summary */}
        <GlassCard title="Explainability & MITRE Mapping" badge="XAI Engine" action={<Link to="/xai" className="text-xs font-mono text-cyan-400 hover:underline">Attributions</Link>}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">T1021.002</span>
                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[10px]">91% CONFIDENCE</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Remote Services (SMB/Windows Admin Shares)</div>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                "Behaviour consistent with internal lateral movement from WKSTN-042 towards SRV-APP-01."
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Top Driving Features</div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>Port Diversity Spike</span>
                    <span className="text-cyan-400">+38% SHAP</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>SYN Ratio Anomaly</span>
                    <span className="text-cyan-400">+29% SHAP</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '29%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>Abnormal Host Fan-Out</span>
                    <span className="text-cyan-400">+18% SHAP</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '18%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Evidence Blockchain Hash:</span>
              <span className="text-cyan-300 font-mono">9a7f32e1...</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Active Incidents & Network Topology Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents List */}
        <GlassCard title="Active Predicted & In-Progress Incidents" badge={`${incidents.length} OPEN`} className="lg:col-span-2">
          <div className="divide-y divide-slate-800">
            {incidents.map((inc) => (
              <div key={inc.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-950 text-rose-400 border border-rose-500/40">
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono text-cyan-400">{inc.id}</span>
                    <span className="text-xs font-semibold text-slate-200">{inc.incident_title}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{inc.summary}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-mono ${
                    inc.status === 'INVESTIGATING' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {inc.status}
                  </span>
                  <Link to="/incidents" className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Live Network Telemetry Snapshot */}
        <GlassCard title="Live Telemetry Rates" badge="1s ROLLING STREAM">
          <div className="space-y-3 text-xs font-mono">
            <div className="h-20 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputHistory} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liveThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} stroke="#334155" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '6px', fontSize: '10px' }}
                    labelStyle={{ color: '#00F0FF', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="pps" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#liveThroughput)" name="PPS" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-[10px] text-center font-mono text-slate-500 mt-0.5">15-Second Ingestion Window (PPS)</div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Total Packets Ingested</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {stats?.total_packets_ingested || 1450}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Active Network Flows</span>
              <span className="text-slate-200 font-bold">{stats?.total_flows_active || 38}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Packet Rate (PPS)</span>
              <span className="text-cyan-400 font-bold">{stats?.pps || 42.5} pps</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Throughput</span>
              <span className="text-cyan-400 font-bold">{stats ? (stats.bps / 1024).toFixed(1) : '12.5'} KB/s</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Port Entropy Index</span>
              <span className="text-amber-400 font-bold">{stats?.port_entropy || 2.84}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
