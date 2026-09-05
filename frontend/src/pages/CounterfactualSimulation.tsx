import React, { useEffect, useState } from 'react';
import { PlayCircle, ShieldCheck, ArrowDownRight, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { CounterfactualScenario } from '../types';

export const CounterfactualSimulation: React.FC = () => {
  const [scenarios, setScenarios] = useState<CounterfactualScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('B_ISOLATE_HOST');
  const [targetIp, setTargetIp] = useState<string>('192.168.1.45');
  const [loading, setLoading] = useState(false);

  const runSim = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation(targetIp);
      setScenarios(res.scenarios);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSim();
  }, [targetIp]);

  const selectedScenario = scenarios.find(s => s.scenario_id === selectedScenarioId) || scenarios[1];
  const baselineScenario = scenarios.find(s => s.scenario_id === 'A_NO_ACTION') || scenarios[0];

  const comparisonChartData = (baselineScenario?.trajectory || []).map((step, idx) => {
    const intStep = selectedScenario?.trajectory[idx];
    return {
      name: step.step_label,
      baselineProb: Math.round(step.attack_probability * 100),
      intervenedProb: intStep ? Math.round(intStep.attack_probability * 100) : 0
    };
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-cyan-400" />
            COUNTERFACTUAL WHAT-IF SIMULATION WORKBENCH
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Re-runs the world model rollout under hypothetical defensive interventions without making real network changes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            className="px-3 py-1 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="Target Host IP"
          />
          <button
            onClick={runSim}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors"
          >
            {loading ? 'Simulating...' : 'Re-Run Rollout'}
          </button>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const isSelected = selectedScenarioId === sc.scenario_id;
          return (
            <div
              key={sc.scenario_id}
              onClick={() => setSelectedScenarioId(sc.scenario_id)}
              className={`cursor-pointer p-4 rounded-xl glass-panel border transition-all ${
                isSelected
                  ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)] bg-cyan-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-200">{sc.title}</span>
                {sc.recommendation_rank === 1 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono text-cyan-300">
                    {Math.round(sc.projected_attack_probability * 100)}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Projected Risk</div>
                </div>
                {sc.risk_reduction_percentage > 0 && (
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-emerald-400 flex items-center justify-end">
                      <ArrowDownRight className="w-4 h-4" />
                      -{sc.risk_reduction_percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Risk Delta</span>
                  </div>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 line-clamp-1">{sc.operational_impact}</div>
            </div>
          );
        })}
      </div>

      {/* Trajectory Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard title="Baseline Trajectory vs. Intervened Outcome" badge="PROJECTION DELTA" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparisonChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="baseArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0055" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF0055" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="interArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF66" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="baselineProb" stroke="#FF0055" strokeWidth={2} fillOpacity={1} fill="url(#baseArea)" name="Passive Baseline Risk (%)" />
                <Area type="monotone" dataKey="intervenedProb" stroke="#00FF66" strokeWidth={2} fillOpacity={1} fill="url(#interArea)" name="Intervention Projected Risk (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Selected Intervention Analysis */}
        <GlassCard title="Intervention Assessment" badge={selectedScenario?.action_type || "ACTION"}>
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Baseline Final Risk:</span>
                <span className="text-rose-400 font-bold">{Math.round((baselineScenario?.projected_attack_probability || 0.91) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Intervened Final Risk:</span>
                <span className="text-emerald-400 font-bold">{Math.round((selectedScenario?.projected_attack_probability || 0.23) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Risk Delta:</span>
                <span className="text-cyan-400 font-bold">-{selectedScenario?.risk_reduction_percentage || 74.7}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operational Friction:</span>
                <span className="text-slate-200">{selectedScenario?.operational_impact}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300">
              ✓ Ready for active defence execution. Click <strong>Active Defence</strong> to authorize.
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
