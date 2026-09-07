import React, { useEffect, useState } from 'react';
import { Lightbulb, Info, BarChart2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { ExplainabilityData } from '../types';

export const ExplainableAI: React.FC = () => {
  const [xaiData, setXaiData] = useState<ExplainabilityData | null>(null);

  useEffect(() => {
    const fetchXai = () => {
      api.getExplanation("Lateral Movement", 0.91).then(setXaiData).catch(console.error);
    };
    fetchXai();
    const interval = setInterval(fetchXai, 1500);
    return () => clearInterval(interval);
  }, []);

  const chartData = xaiData?.top_contributing_factors.map(f => ({
    name: f.feature_name,
    weight: Math.round(f.attribution_weight * 100),
    observed: f.observed_value,
    baseline: f.baseline_value,
    direction: f.direction
  })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-cyan-400" />
            EXPLAINABLE AI (XAI) & FEATURE ATTRIBUTION
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              LIVE TELEMETRY SHAP STREAM
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Answers the core defender question: <span className="text-cyan-300 font-mono">"Why did ThreatCast predict this trajectory?"</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded">
            Divergence: <span className="text-amber-400 font-bold">{xaiData?.baseline_divergence_pct ? `+${xaiData.baseline_divergence_pct.toFixed(1)}%` : 'Active'}</span>
          </div>
          <div className="text-xs font-mono px-3 py-1 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 rounded">
            Confidence: <span className="font-bold">{xaiData?.model_confidence_level || "HIGH"}</span>
          </div>
        </div>
      </div>

      {/* Natural Language Analyst Summary Box */}
      <div className="p-4 rounded-xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-slate-900/40">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Analyst Executive Summary</span>
              <span className="text-[10px] text-slate-500 font-normal">Computation Latency: {xaiData?.computation_latency_ms ? `${xaiData.computation_latency_ms.toFixed(1)}ms` : '12.4ms'}</span>
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {xaiData?.plain_language_summary}
            </p>
          </div>
        </div>
      </div>

      {/* Anomaly Detection Breakdown & SYN Scan Justification */}
      <GlassCard
        title="Anomaly Detection Justification & Root Cause Breakdown"
        badge="WHY ANOMALY WAS FLAGGED"
        className="border-amber-500/30 bg-amber-950/10"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-mono">
            Ground-truth feature telemetry evaluated against the historical baseline distribution. Explicit justification rules triggered:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(xaiData?.anomaly_reasons && xaiData.anomaly_reasons.length > 0) ? (
              xaiData.anomaly_reasons.map((reason, index) => {
                const isSyn = reason.toLowerCase().includes('syn');
                const isEntropy = reason.toLowerCase().includes('entropy');
                const isPort = reason.toLowerCase().includes('port');
                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 transition-all ${
                      isSyn
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        : isEntropy
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : isPort
                        ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
                      <ShieldAlert className={`w-4 h-4 shrink-0 ${isSyn ? 'text-rose-400' : isEntropy ? 'text-amber-400' : 'text-cyan-400'}`} />
                      <span>{isSyn ? 'SYN Flood / Reconnaissance Anomaly' : isEntropy ? 'Port Entropy Deviation' : 'Behavioral Novelty'}</span>
                    </div>
                    <p className="text-xs font-sans leading-relaxed text-slate-200 pl-6">
                      {reason}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Evaluating real-time ingested packets. Waiting for anomaly surge or scan pattern...</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Attribution Chart & Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard title="Feature Attribution Ranking (SHAP Weights)" badge="IMPACT %" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                <XAxis type="number" domain={[0, 50]} stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#E2E8F0', fontSize: 11, fontFamily: 'monospace' }} width={140} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="weight" name="Attribution Weight (%)" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00F0FF' : (index === 1 ? '#38BDF8' : '#818CF8')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Factors Table */}
        <GlassCard title="Observed vs Baseline Parameters" badge="TELEMETRY">
          <div className="divide-y divide-slate-800 text-xs font-mono">
            {xaiData?.top_contributing_factors.map((f, i) => (
              <div key={i} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-200 font-semibold">{f.feature_name}</span>
                  <span className="text-cyan-400 font-bold">+{f.importance_percentage}%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Observed: <strong className="text-rose-400">{f.observed_value}</strong></span>
                  <span>Baseline: {f.baseline_value}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
