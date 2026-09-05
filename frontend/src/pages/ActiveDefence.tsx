import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, RotateCcw, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { DefensiveActionRecord } from '../types';

export const ActiveDefence: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [history, setHistory] = useState<DefensiveActionRecord[]>([]);
  const [mode, setMode] = useState<'DRY_RUN' | 'SIMULATION' | 'LIVE'>('DRY_RUN');
  const [confirmModalAction, setConfirmModalAction] = useState<any | null>(null);
  const [confirmKey, setConfirmKey] = useState<string>('');
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getResponseRecommendations("192.168.1.45").then(setRecommendations);
    api.getActionHistory().then(setHistory);
  }, []);

  const handleExecute = async (action: any) => {
    if (mode === 'LIVE' && action.requires_human_approval) {
      setConfirmModalAction(action);
      return;
    }
    await triggerAction(action, null);
  };

  const triggerAction = async (action: any, confirmationToken: string | null) => {
    try {
      const res = await api.executeResponseAction({
        action_type: action.action_type,
        target_ip: action.target_ip,
        reason: action.description,
        execution_mode: mode,
        human_confirmation_token: confirmationToken,
        metadata: { mitre_technique: "T1021", risk_score: 91.0 }
      });
      setExecutionMessage(`Action ${res.action_id} successfully executed in ${res.execution_mode} mode.`);
      setHistory(prev => [res, ...prev]);
      setConfirmModalAction(null);
      setConfirmKey('');
    } catch (e: any) {
      setExecutionMessage(`Execution Error: ${e.message}`);
    }
  };

  const handleRollback = async (actionId: string) => {
    try {
      await api.rollbackResponseAction(actionId);
      setHistory(prev => prev.map(h => h.action_id === actionId ? { ...h, status: "ROLLED_BACK" } : h));
      setExecutionMessage(`Action ${actionId} successfully rolled back.`);
    } catch (e: any) {
      setExecutionMessage(`Rollback failed: ${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            CONTROLLED ACTIVE DEFENCE & AUTHORIZATION GATEWAY
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise response policy engine with target allow-listing, RBAC gates, and dry-run guardrails.
          </p>
        </div>

        {/* Execution Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          {(['DRY_RUN', 'SIMULATION', 'LIVE'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded transition-colors ${
                mode === m
                  ? (m === 'LIVE' ? 'bg-rose-600 text-white font-bold' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold')
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {executionMessage && (
        <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>{executionMessage}</span>
          <button onClick={() => setExecutionMessage(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* 10-Point Security Boundary Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Allow-List Check</span>
        </div>
        <div className="p-3 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>RBAC Scopes (SOC_ADMIN)</span>
        </div>
        <div className="p-3 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Rollback Engine Active</span>
        </div>
        <div className="p-3 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Blockchain Audit Anchor</span>
        </div>
        <div className="p-3 rounded-xl glass-panel border border-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Emergency Kill Switch: CLEAR</span>
        </div>
      </div>

      {/* Recommendations Queue */}
      <GlassCard title="Pending Policy Recommendations" badge={`${recommendations.length} EVALUATED`}>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-950 text-rose-400 border border-rose-500/40">
                    {rec.urgency}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{rec.policy_id}</span>
                  <span className="text-xs font-semibold text-slate-100">{rec.title}</span>
                </div>
                <p className="text-xs text-slate-400">{rec.description}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                  <span>Target: {rec.target_ip}</span>
                  <span>Est. Risk Reduction: <strong className="text-emerald-400">{rec.estimated_risk_reduction}</strong></span>
                  <span>Compliance: {rec.compliance_tag}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExecute(rec)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                    mode === 'LIVE'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]'
                      : 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {mode === 'LIVE' ? 'Execute LIVE Action' : `Simulate (${mode})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Execution & Rollback History */}
      <GlassCard title="Active Defence Audit History" badge={`${history.length} ACTIONS`}>
        <div className="divide-y divide-slate-800 text-xs font-mono">
          {history.length === 0 ? (
            <div className="py-4 text-center text-slate-500">No actions executed in this session yet.</div>
          ) : (
            history.map((h) => (
              <div key={h.action_id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{h.action_id}</span>
                    <span className="text-cyan-400">[{h.action_type}]</span>
                    <span className="text-slate-400">Target: {h.target_ip}</span>
                    <span className="text-[10px] text-slate-500">({h.execution_mode})</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{h.output_message}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    h.status === 'ROLLED_BACK' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {h.status}
                  </span>
                  {h.status !== 'ROLLED_BACK' && (
                    <button
                      onClick={() => handleRollback(h.action_id)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                      title="Rollback Action"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Confirmation Modal for LIVE mode */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-panel rounded-xl border border-rose-500/50 shadow-[0_0_30px_rgba(255,0,85,0.3)] space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold font-mono text-sm uppercase">Confirm High-Impact LIVE Action</h3>
            </div>
            <p className="text-xs text-slate-300">
              You are authorizing LIVE network containment on target <strong className="text-white">{confirmModalAction.target_ip}</strong>.
              This will drop all forward connections at the firewall.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Enter confirmation token:</label>
              <input
                type="text"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                placeholder="Type CONFIRM-LIVE-DEFENCE"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalAction(null)}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => triggerAction(confirmModalAction, confirmKey)}
                disabled={confirmKey !== 'CONFIRM-LIVE-DEFENCE'}
                className="px-4 py-1.5 text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white rounded disabled:opacity-50"
              >
                Authorize & Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
