import React, { useEffect, useState } from 'react';
import { Link2, ShieldCheck, CheckCircle2, AlertOctagon, Search, FileCode } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../services/api';
import { BlockchainBlock } from '../types';

export const EvidenceLedger: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [verifyEvidenceId, setVerifyEvidenceId] = useState('EVID-DEMO-S0');
  const [verifyHash, setVerifyHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    api.getBlockchainBlocks().then(setBlocks);
    api.getBlockchainStats().then(setStats);
  }, []);

  const handleVerify = async () => {
    try {
      const res = await api.verifyEvidence(verifyEvidenceId, verifyHash);
      setVerificationResult(res);
    } catch (e: any) {
      setVerificationResult({ found: false, error: e.message });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            HYPERLEDGER FABRIC EVIDENCE INTEGRITY LEDGER
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Permissioned blockchain audit trail: cryptographic SHA-256 anchors, immutable chain of custody, and tamper detection.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-cyan-950 border border-cyan-500/30 text-cyan-300 rounded">
          Channel: <span className="font-bold">{stats?.channel || "threatcast-channel"}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
        <GlassCard>
          <div className="text-slate-400">Total Committed Blocks</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{stats?.total_blocks || blocks.length}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Ledger Records</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{stats?.total_records || 5}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Smart Contract (Chaincode)</div>
          <div className="text-sm font-bold text-slate-200 mt-2 truncate">{stats?.chaincode || "threatcast-evidence"}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-slate-400">Ledger Engine Mode</div>
          <div className="text-sm font-bold text-emerald-400 mt-2">{stats?.backend_mode || "Fabric / Local Cryptographic"}</div>
        </GlassCard>
      </div>

      {/* Forensic Verification Tool & Block Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Workbench (1 Col) */}
        <GlassCard title="Cryptographic Tamper Verification Tool" badge="AUDIT">
          <div className="space-y-4 text-xs font-mono">
            <p className="text-[11px] text-slate-400">
              Enter an Evidence ID and a freshly computed off-chain SHA-256 payload hash to verify zero tampering.
            </p>

            <div className="space-y-1">
              <label className="text-slate-400">Evidence ID:</label>
              <input
                type="text"
                value={verifyEvidenceId}
                onChange={(e) => setVerifyEvidenceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Supplied Payload SHA-256 Hash:</label>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="Paste 64-char hex hash or test hash..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleVerify}
              className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold rounded transition-colors"
            >
              Verify Against On-Chain Anchor
            </button>

            {verificationResult && (
              <div className={`p-3 rounded-lg border ${
                verificationResult.match
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {verificationResult.match ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertOctagon className="w-4 h-4 text-rose-400" />}
                  <span>{verificationResult.match ? 'VERIFIED: ZERO TAMPERING' : 'TAMPER DETECTED / MISMATCH'}</span>
                </div>
                <div className="text-[10px] space-y-0.5 text-slate-400">
                  <div>Status: {verificationResult.status || (verificationResult.match ? "VALID" : "TAMPERED")}</div>
                  {verificationResult.anchored_hash && (
                    <div className="truncate">Anchored: {verificationResult.anchored_hash}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Blocks Explorer (2 Cols) */}
        <GlassCard title="Immutable Ledger Block Stream" badge="FABRIC PEER 0" className="lg:col-span-2">
          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {blocks.map((b) => (
              <div key={b.block_number} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold">
                      BLOCK #{b.block_number}
                    </span>
                    <span className="text-slate-400">{b.transaction_count} Transactions</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(b.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div className="truncate">
                    <span className="text-slate-500">Hash: </span>
                    <span className="text-slate-300">{b.block_hash}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Prev: </span>
                    <span className="text-slate-300">{b.previous_hash}</span>
                  </div>
                </div>

                {b.transactions.length > 0 && (
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-400 flex justify-between">
                    <span>Evidence ID: <strong className="text-cyan-300">{b.transactions[0].evidence_id || "TX-ANCHOR"}</strong></span>
                    <span>Type: {b.transactions[0].type || "EVIDENCE_COMMIT"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
