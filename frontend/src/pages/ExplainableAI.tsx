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
    api.getExplanation("Lateral Movement", 0.91).then(setXaiData);
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
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Answers the core defender question: <span className="text-cyan-300 font-mono">"Why did ThreatCast predict this trajectory?"</span>
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 rounded">
          SHAP Kernel + Graph Attention
        </div>
      </div>

      {/* Natural Language Analyst Summary Box */}
      <div className="p-4 rounded-xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-slate-900/40">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Analyst Executive Summary
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {xaiData?.plain_language_summary}
            </p>
          </div>
        </div>
      </div>

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
