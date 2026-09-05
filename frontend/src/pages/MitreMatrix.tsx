import React, { useEffect, useState } from 'react';
import { Target, CheckCircle, Clock, ExternalLink, Shield } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { MitreTechniqueMatch } from '../types';

export const MitreMatrix: React.FC = () => {
  const [mappings, setMappings] = useState<MitreTechniqueMatch[]>([]);
  const [tactics, setTactics] = useState<any>({});
  const [selectedMapping, setSelectedMapping] = useState<MitreTechniqueMatch | null>(null);

  useEffect(() => {
    api.getMitreMappings().then(data => {
      setMappings(data);
      if (data.length > 0) setSelectedMapping(data[0]);
    });
    fetch('/api/v1/mitre/tactics')
      .then(r => r.json())
      .catch(() => ({
        "TA0043": { name: "Reconnaissance" },
        "TA0001": { name: "Initial Access" },
        "TA0007": { name: "Discovery" },
        "TA0008": { name: "Lateral Movement" },
        "TA0011": { name: "Command and Control" },
        "TA0010": { name: "Exfiltration" }
      }))
      .then(setTactics);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            MITRE ATT&CK® ENTERPRISE MATRIX MAPPING
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounds observed traffic and predicted forward trajectories in the MITRE ATT&CK v14 framework with non-assertive language.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded">
          Enterprise Framework v14
        </div>
      </div>

      {/* Tactic Columns Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(tactics).slice(0, 6).map(([tacticId, tInfo]: [string, any]) => {
          const matchedTechniques = mappings.filter(m => m.tactic_id === tacticId);
          return (
            <div key={tacticId} className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">{tacticId}</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{tInfo.name}</div>
              </div>

              <div className="space-y-2">
                {matchedTechniques.length === 0 ? (
                  <div className="p-3 rounded-lg border border-dashed border-slate-800 text-center text-[10px] font-mono text-slate-600">
                    No active indicators
                  </div>
                ) : (
                  matchedTechniques.map((tech) => {
                    const isSelected = selectedMapping?.technique_id === tech.technique_id;
                    return (
                      <div
                        key={tech.technique_id}
                        onClick={() => setSelectedMapping(tech)}
                        className={`cursor-pointer p-3 rounded-lg glass-panel border transition-all ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                            : (tech.is_predicted ? 'border-amber-500/40 bg-amber-950/20' : 'border-rose-500/40 bg-rose-950/20')
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono font-bold text-slate-100">{tech.technique_id}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded ${
                            tech.is_predicted ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}>
                            {tech.is_predicted ? 'PREDICTED' : 'OBSERVED'}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-200 mt-1 leading-tight">{tech.technique_name}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-2">
                          Confidence: <strong className="text-cyan-400">{Math.round(tech.confidence_score * 100)}%</strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Technique Detail & Evidence Box */}
      {selectedMapping && (
        <GlassCard title={`Technique Assessment: ${selectedMapping.technique_id} - ${selectedMapping.technique_name}`} badge={selectedMapping.is_predicted ? "PREDICTED TRAJECTORY" : "OBSERVED EVIDENCE"}>
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 mb-1">Standard Assessment Statement:</div>
              <div className="text-slate-200 font-sans italic text-sm">
                "{selectedMapping.assessment_statement}"
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-slate-400 uppercase text-[11px]">Linked Telemetry Evidence Factors</span>
                <ul className="space-y-1 text-slate-300">
                  {selectedMapping.evidence_factors.map((ef, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{ef}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 uppercase text-[11px]">Affected / In-Scope Assets</span>
                <div className="flex flex-wrap gap-2">
                  {selectedMapping.affected_assets.map((assetIp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {assetIp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
