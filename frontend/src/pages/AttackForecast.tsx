import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, AlertTriangle, ShieldCheck, HelpCircle, Layers } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { ForecastData } from '../types';

export const AttackForecast: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [selectedStep, setSelectedStep] = useState<number>(3);

  useEffect(() => {
    api.getLatestForecast(5).then(setForecast);
  }, []);

  const chartData = forecast?.steps.map(s => ({
    name: s.step_label,
    prob: Math.round(s.attack_probability * 100),
    confidence: Math.round(s.confidence * 100),
    uncertainty: Math.round(s.uncertainty * 100),
    hosts: s.affected_hosts_projected
  })) || [];

  const activeStepDetail = forecast?.steps[selectedStep] || forecast?.steps[0];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            ATTACK FORECAST & LATENT WORLD MODEL ROLLOUT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autoregressive forward projection P(Z_t+k | Z_t) simulating plausible attacker trajectories ahead of compromise.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Horizon:</span>
          <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded font-bold">K=5 STEPS (50s)</span>
        </div>
      </div>

      {/* Trajectory Timeline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {forecast?.steps.map((step) => {
          const isSelected = selectedStep === step.step_number;
          return (
            <div
              key={step.step_number}
              onClick={() => setSelectedStep(step.step_number)}
              className={`cursor-pointer p-4 rounded-xl glass-panel border transition-all ${
                isSelected
                  ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] bg-cyan-950/40'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-cyan-400">{step.step_label}</span>
                <span className="text-[10px] font-mono text-slate-400">+{step.time_offset_seconds}s</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-slate-100">
                  {Math.round(step.attack_probability * 100)}%
                </div>
                <div className="text-[11px] font-semibold text-amber-400 truncate mt-0.5">
                  {step.predicted_stage}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-[10px] font-mono text-slate-400">
                <span>Conf: {Math.round(step.confidence * 100)}%</span>
                <span>Unc: ±{Math.round(step.uncertainty * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Forward Rollout Chart */}
        <GlassCard title="Multi-Step Attack Probability & Confidence Bands" badge="P(Z_t+k | Z_t)" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fcProb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="prob" stroke="#00F0FF" strokeWidth={2.5} fillOpacity={1} fill="url(#fcProb)" name="Attack Probability (%)" />
                <Area type="monotone" dataKey="uncertainty" stroke="#FF0055" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Uncertainty Bound (±%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Calculated Early Warning Lead Time:</span>
              <span className="text-emerald-400 font-mono font-bold">4 minutes 12 seconds</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Target Attack Culmination: T+5 (50s)</span>
          </div>
        </GlassCard>

        {/* Right 1 Col: Selected Step Inspector */}
        <GlassCard title={`Step Inspector: ${activeStepDetail?.step_label}`} badge={activeStepDetail?.confidence_level}>
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Predicted Stage:</span>
                <span className="text-amber-400 font-bold">{activeStepDetail?.predicted_stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attack Probability:</span>
                <span className="text-cyan-400 font-bold">{activeStepDetail ? Math.round(activeStepDetail.attack_probability * 100) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model Confidence:</span>
                <span className="text-purple-400 font-bold">{activeStepDetail ? Math.round(activeStepDetail.confidence * 100) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Uncertainty:</span>
                <span className="text-rose-400 font-bold">±{activeStepDetail ? Math.round(activeStepDetail.uncertainty * 100) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projected Compromised Hosts:</span>
                <span className="text-slate-200 font-bold">{activeStepDetail?.affected_hosts_projected} Hosts</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 uppercase text-[11px]">Key Risk Indicators at this Step</span>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>SMB Port 445 Session Established</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Host Fan-Out expanding to Server Subnet</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Degree increase exceeding 3-sigma baseline</span>
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
