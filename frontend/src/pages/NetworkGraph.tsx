import React, { useEffect, useState } from 'react';
import { Network, ShieldAlert, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Layers, Server, Activity } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';

interface GraphNode {
  id: string;
  ip: string;
  hostname: string;
  asset_type: string;
  criticality: string;
  risk_score: number;
  degree: number;
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  protocol: string;
  port: number;
  threat_score: number;
}

export const NetworkGraph: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([
    { id: "192.168.1.1", ip: "192.168.1.1", hostname: "GW-EDGE-01", asset_type: "GATEWAY", criticality: "CRITICAL", risk_score: 15.0, degree: 4, x: 200, y: 150 },
    { id: "10.0.0.5", ip: "10.0.0.5", hostname: "DC-CORP-01", asset_type: "SERVER", criticality: "CRITICAL", risk_score: 22.0, degree: 3, x: 500, y: 100 },
    { id: "10.0.0.10", ip: "10.0.0.10", hostname: "SRV-APP-01", asset_type: "SERVER", criticality: "HIGH", risk_score: 65.0, degree: 4, x: 450, y: 260 },
    { id: "10.0.0.20", ip: "10.0.0.20", hostname: "SRV-DB-01", asset_type: "DATABASE", criticality: "CRITICAL", risk_score: 28.0, degree: 2, x: 650, y: 240 },
    { id: "192.168.1.45", ip: "192.168.1.45", hostname: "WKSTN-042", asset_type: "WORKSTATION", criticality: "MEDIUM", risk_score: 91.0, degree: 5, x: 220, y: 340 },
    { id: "192.168.1.88", ip: "192.168.1.88", hostname: "WKSTN-088", asset_type: "WORKSTATION", criticality: "LOW", risk_score: 12.0, degree: 2, x: 100, y: 240 }
  ]);

  const [edges, setEdges] = useState<GraphEdge[]>([
    { id: "e1", source: "192.168.1.45", target: "10.0.0.10", protocol: "TCP", port: 445, threat_score: 91.0 },
    { id: "e2", source: "192.168.1.45", target: "10.0.0.20", protocol: "TCP", port: 445, threat_score: 75.0 },
    { id: "e3", source: "10.0.0.10", target: "10.0.0.5", protocol: "TCP", port: 389, threat_score: 20.0 },
    { id: "e4", source: "192.168.1.88", target: "192.168.1.1", protocol: "UDP", port: 53, threat_score: 5.0 },
    { id: "e5", source: "192.168.1.45", target: "192.168.1.1", protocol: "TCP", port: 80, threat_score: 15.0 }
  ]);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[4]);
  const [blastRadius, setBlastRadius] = useState<any>(null);
  const [highlightTrajectory, setHighlightTrajectory] = useState(true);
  const [injectAlert, setInjectAlert] = useState<string | null>(null);

  const fetchGraphData = async () => {
    try {
      const res = await api.getNetworkGraph();
      if (res?.graph?.edges) {
        setEdges(prev => {
          return prev.map(e => {
            const match = res.graph.edges.find((re: any) => re.source === e.source && re.target === e.target);
            return match ? { ...e, threat_score: match.threat_score } : e;
          });
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGraphData();
    const interval = setInterval(fetchGraphData, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedNode) {
      setBlastRadius({
        compromised_node: selectedNode.ip,
        blast_score: selectedNode.risk_score >= 80 ? 88.5 : 24.0,
        affected_nodes: [
          { ip: "10.0.0.10", hostname: "SRV-APP-01", hop: 1, risk: 65.0 },
          { id: "10.0.0.20", hostname: "SRV-DB-01", hop: 1, risk: 28.0 },
          { id: "10.0.0.5", hostname: "DC-CORP-01", hop: 2, risk: 22.0 }
        ]
      });
    }
  }, [selectedNode]);

  const handleInjectAttack = async () => {
    try {
      const res = await api.injectAttackSimulation();
      setInjectAlert(`⚡ ATTACK BURST SIMULATION ACTIVE: Flooded ${res.affected_targets} targets across campus subnet!`);
      setEdges(prev => prev.map(e => (e.source === '192.168.1.45' ? { ...e, threat_score: 95.0 } : e)));
      setTimeout(() => setInjectAlert(null), 4000);
      fetchGraphData();
    } catch {
      setInjectAlert("⚡ Attack simulation burst triggered locally.");
      setTimeout(() => setInjectAlert(null), 3000);
    }
  };

  const getNodeColor = (risk: number) => {
    if (risk >= 80) return '#FF0055';
    if (risk >= 50) return '#FFB800';
    return '#00F0FF';
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            TEMPORAL NETWORK GRAPH G_t & CYBER DIGITAL TWIN
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE TOPOLOGY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic host communications graph $G_t = (V_t, E_t)$ with real-time blast radius and projected attack paths.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleInjectAttack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition-all shadow-[0_0_15px_rgba(255,0,85,0.25)]"
          >
            <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Inject Attack Surge</span>
          </button>
          <button
            onClick={() => setHighlightTrajectory(!highlightTrajectory)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              highlightTrajectory
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {highlightTrajectory ? '⚡ Active Attack Path: ON' : 'Attack Path: OFF'}
          </button>
        </div>
      </div>

      {injectAlert && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs font-mono text-rose-200 flex items-center justify-between shadow-[0_0_18px_rgba(255,0,85,0.3)] animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="font-bold">{injectAlert}</span>
          </div>
          <span className="text-[10px] text-rose-400">EDGE FLARING</span>
        </div>
      )}

      {/* Main Graph Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Visual Graph Canvas (3 Cols) */}
        <GlassCard className="lg:col-span-3 h-[580px] relative p-0 overflow-hidden flex flex-col justify-between">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-1.5 text-xs font-mono">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Active Nodes: {nodes.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">Edges: {edges.length}</span>
          </div>

          {/* SVG Graph Viewport */}
          <div className="w-full h-full cyber-grid relative cursor-grab">
            <svg className="w-full h-full">
              <style>{`
                @keyframes flowForward {
                  from { stroke-dashoffset: 24; }
                  to { stroke-dashoffset: 0; }
                }
                .active-stream-edge {
                  stroke-dasharray: 6 4;
                  animation: flowForward 1.2s linear infinite;
                }
                .attack-stream-edge {
                  stroke-dasharray: 8 4;
                  animation: flowForward 0.5s linear infinite;
                }
              `}</style>
              {/* Render Edges */}
              {edges.map((e) => {
                const src = nodes.find(n => n.id === e.source);
                const tgt = nodes.find(n => n.id === e.target);
                if (!src || !tgt) return null;

                const isAttackPath = highlightTrajectory && e.threat_score >= 70;

                return (
                  <g key={e.id}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={isAttackPath ? '#FF0055' : '#00F0FF'}
                      strokeOpacity={isAttackPath ? 1 : 0.45}
                      strokeWidth={isAttackPath ? 3 : 1.5}
                      className={isAttackPath ? 'attack-stream-edge animate-pulse' : 'active-stream-edge'}
                    />
                    {/* Edge Label */}
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 6}
                      fill={isAttackPath ? '#FF0055' : '#00F0FF'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      opacity={isAttackPath ? 1 : 0.8}
                    >
                      {e.protocol}:{e.port}
                    </text>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map((n) => {
                const isSelected = selectedNode?.id === n.id;
                const nodeColor = getNodeColor(n.risk_score);

                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    onClick={() => setSelectedNode(n)}
                    className="cursor-pointer group"
                  >
                    {/* Outer Glow Ring for high risk */}
                    {n.risk_score >= 80 && (
                      <circle
                        r="26"
                        fill="none"
                        stroke="#FF0055"
                        strokeWidth="1.5"
                        opacity="0.4"
                        className="animate-ping"
                      />
                    )}
                    {/* Main Node Circle */}
                    <circle
                      r={isSelected ? "20" : "16"}
                      fill="#0B0F19"
                      stroke={nodeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all"
                    />
                    {/* Hostname Label */}
                    <text
                      y="30"
                      fill="#E2E8F0"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {n.hostname}
                    </text>
                    <text
                      y="42"
                      fill="#94A3B8"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {n.ip}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Graph Legend */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]"></span>
              <span className="text-slate-300">Nominal Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></span>
              <span className="text-slate-300">Elevated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF0055]"></span>
              <span className="text-slate-300">Critical / In-Path</span>
            </div>
          </div>
        </GlassCard>

        {/* Selected Node Inspector (1 Col) */}
        <div className="space-y-4">
          <GlassCard title="Host Inspector" badge={selectedNode?.asset_type || "NODE"}>
            {selectedNode ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hostname:</span>
                    <span className="text-slate-100 font-bold">{selectedNode.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="text-cyan-400">{selectedNode.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Criticality:</span>
                    <span className="text-amber-400">{selectedNode.criticality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Node Degree:</span>
                    <span className="text-slate-200">{selectedNode.degree} conns</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="text-rose-400 font-bold">{selectedNode.risk_score} / 100</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 uppercase text-[11px]">Blast Radius Analysis</span>
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/30">
                    <div className="flex justify-between text-rose-300 font-semibold mb-1">
                      <span>Lateral Exposure:</span>
                      <span>{blastRadius?.blast_score || 84.5}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      3 internal servers accessible within 2 network hops from this endpoint.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-mono">Select a host in the network graph to inspect.</div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
