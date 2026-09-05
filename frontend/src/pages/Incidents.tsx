import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Filter, Clock, CheckCircle2, User } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { Incident } from '../types';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    api.getIncidents().then(data => {
      setIncidents(data);
      if (data.length > 0) setSelectedIncident(data[0]);
    });
  }, []);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    try {
      const updated = await api.updateIncidentStatus(selectedIncident.id, newStatus, statusNote || `Status changed to ${newStatus}`);
      setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
      setSelectedIncident(updated);
      setStatusNote('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            INCIDENT TRIAGE & FORENSIC INVESTIGATION
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end incident lifecycle management with forecast linkages and blockchain evidence custody.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Incidents: <span className="text-cyan-400 font-bold">{incidents.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List (1 Col) */}
        <GlassCard title="Active Incident Queue" badge="TRIAGE">
          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{inc.id}</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-rose-950 text-rose-400 border border-rose-500/40">
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{inc.incident_title}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                    <span>{inc.status}</span>
                    <span>Risk: {inc.risk_score}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Incident Detail (2 Cols) */}
        {selectedIncident && (
          <GlassCard title={`Investigation Package: ${selectedIncident.id}`} badge={selectedIncident.severity} className="lg:col-span-2">
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold font-sans text-slate-100">{selectedIncident.incident_title}</h3>
                <p className="text-xs font-sans text-slate-300 leading-relaxed">{selectedIncident.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    <span>Target Asset:</span>
                    <div className="text-slate-200 font-bold">{selectedIncident.target_asset_id || "AST-WK-42"}</div>
                  </div>
                  <div>
                    <span>Assigned:</span>
                    <div className="text-slate-200 font-bold">{selectedIncident.assigned_analyst}</div>
                  </div>
                  <div>
                    <span>MITRE:</span>
                    <div className="text-cyan-400 font-bold">{selectedIncident.mitre_technique}</div>
                  </div>
                  <div>
                    <span>Risk Level:</span>
                    <div className="text-rose-400 font-bold">{selectedIncident.risk_score} / 100</div>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="text-slate-300 font-bold">Lifecycle State Transitions</div>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'INVESTIGATING', 'CONTAINED', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        selectedIncident.status === st
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional transition note or containment log..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded focus:outline-none focus:border-cyan-500 text-slate-200"
                  />
                </div>
              </div>

              {/* Blockchain Evidence Tag */}
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Evidence Anchored to Hyperledger Fabric Channel</span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">9a7f32e18d84...</span>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
