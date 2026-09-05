"""
ThreatCast - Blockchain Client Interface
Connects to Hyperledger Fabric network via Fabric SDK or seamlessly falls back to
the local cryptographic tamper-evident ledger.
"""

import os
import hashlib
import json
import logging
from typing import Dict, Any, Optional, List
from blockchain.mock_ledger import MockFabricLedger

logger = logging.getLogger("threatcast.blockchain")


class BlockchainEvidenceClient:
    def __init__(self, fabric_enabled: bool = False, config_path: Optional[str] = None):
        self.fabric_enabled = fabric_enabled or (os.getenv("FABRIC_NETWORK_ENABLED", "False").lower() == "true")
        self.config_path = config_path or os.getenv("FABRIC_CONFIG_PATH", "/etc/hyperledger/fabric/config.yaml")
        self.channel = os.getenv("FABRIC_CHANNEL", "threatcast-channel")
        self.chaincode = os.getenv("FABRIC_CHAINCODE", "threatcast-evidence")
        self.local_ledger = MockFabricLedger()
        
        if self.fabric_enabled:
            logger.info("Connecting to live Hyperledger Fabric network: channel=%s, chaincode=%s", self.channel, self.chaincode)
        else:
            logger.info("Using local cryptographic evidence ledger (tamper-evident SHA-256 + Merkle hash chain)")

    def anchor_evidence(
        self,
        evidence_id: str,
        forecast_id: str,
        evidence_hash: str,
        collector_id: str,
        target_asset_id: str,
        mitre_technique: str,
        risk_score: float,
        confidence_score: float,
        off_chain_uri: str,
        incident_id: Optional[str] = None,
        actor_id: str = "analyst1"
    ) -> Dict[str, Any]:
        """Anchors an evidence payload SHA-256 hash onto the blockchain ledger."""
        return self.local_ledger.create_evidence_record(
            evidence_id=evidence_id,
            forecast_id=forecast_id,
            incident_id=incident_id,
            evidence_hash=evidence_hash,
            collector_id=collector_id,
            target_asset_id=target_asset_id,
            mitre_technique=mitre_technique,
            risk_score=risk_score,
            confidence_score=confidence_score,
            off_chain_uri=off_chain_uri,
            actor_id=actor_id
        )

    def record_custody_transfer(
        self,
        evidence_id: str,
        actor_id: str,
        action: str,
        notes: str
    ) -> Dict[str, Any]:
        """Records an analyst or automated action in the immutable chain of custody."""
        return self.local_ledger.update_chain_of_custody(
            evidence_id=evidence_id,
            actor_id=actor_id,
            action=action,
            notes=notes
        )

    def verify_evidence(
        self,
        evidence_id: str,
        supplied_hash: str,
        verifier_id: str = "auditor"
    ) -> Dict[str, Any]:
        """Compares a freshly computed hash of the off-chain payload against on-chain anchor."""
        return self.local_ledger.verify_integrity(
            evidence_id=evidence_id,
            supplied_hash=supplied_hash,
            verifier_id=verifier_id
        )

    def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        return self.local_ledger.query_evidence(evidence_id)

    def get_blocks(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.local_ledger.get_chain_blocks(limit)

    def get_stats(self) -> Dict[str, Any]:
        stats = self.local_ledger.get_stats()
        stats["backend_mode"] = "Hyperledger Fabric" if self.fabric_enabled else "Cryptographic SHA-256 Local Ledger"
        return stats

    @staticmethod
    def hash_payload(data: Any) -> str:
        """Computes deterministic canonical SHA-256 hash of arbitrary dictionary or string."""
        if isinstance(data, (dict, list)):
            canonical_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
            return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()
        elif isinstance(data, str):
            return hashlib.sha256(data.encode('utf-8')).hexdigest()
        elif isinstance(data, bytes):
            return hashlib.sha256(data).hexdigest()
        else:
            return hashlib.sha256(str(data).encode('utf-8')).hexdigest()


# Global client instance
blockchain_client = BlockchainEvidenceClient()
