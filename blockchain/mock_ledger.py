"""
ThreatCast - In-Memory Cryptographic Evidence Ledger
Simulates Hyperledger Fabric distributed state with cryptographic SHA-256 hash chains,
Merkle trees, and tamper-evident audit logging.
"""

import hashlib
import json
import time
from typing import Dict, List, Optional, Any


class LedgerBlock:
    def __init__(self, block_number: int, previous_hash: str, transactions: List[Dict[str, Any]], timestamp: Optional[float] = None):
        self.block_number = block_number
        self.previous_hash = previous_hash
        self.transactions = transactions
        self.timestamp = timestamp or time.time()
        self.merkle_root = self._calculate_merkle_root()
        self.block_hash = self._calculate_block_hash()

    def _calculate_merkle_root(self) -> str:
        if not self.transactions:
            return hashlib.sha256(b"empty_block").hexdigest()
        tx_hashes = [hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest() for tx in self.transactions]
        while len(tx_hashes) > 1:
            if len(tx_hashes) % 2 != 0:
                tx_hashes.append(tx_hashes[-1])
            new_level = []
            for i in range(0, len(tx_hashes), 2):
                combined = tx_hashes[i] + tx_hashes[i+1]
                new_level.append(hashlib.sha256(combined.encode()).hexdigest())
            tx_hashes = new_level
        return tx_hashes[0]

    def _calculate_block_hash(self) -> str:
        header = f"{self.block_number}{self.previous_hash}{self.merkle_root}{self.timestamp}"
        return hashlib.sha256(header.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "block_number": self.block_number,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "block_hash": self.block_hash,
            "timestamp": self.timestamp,
            "transaction_count": len(self.transactions),
            "transactions": self.transactions
        }


class MockFabricLedger:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MockFabricLedger, cls).__new__(cls)
            cls._instance._init_ledger()
        return cls._instance

    def _init_ledger(self):
        self.chain: List[LedgerBlock] = []
        self.world_state: Dict[str, Dict[str, Any]] = {}
        self.pending_txs: List[Dict[str, Any]] = []
        self.channel_name = "threatcast-channel"
        self.chaincode_id = "threatcast-evidence"
        
        # Create genesis block
        genesis_tx = {
            "type": "GENESIS",
            "evidence_id": "EVID-GENESIS-0000",
            "evidence_hash": "0000000000000000000000000000000000000000000000000000000000000000",
            "previous_hash": "GENESIS",
            "collector_id": "SYSTEM_GENESIS",
            "target_asset_id": "ALL",
            "mitre_technique": "NONE",
            "risk_score": 0.0,
            "confidence_score": 1.0,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "off_chain_uri": "urn:threatcast:genesis",
            "integrity_status": "VALID",
            "custody_log": [{
                "event_id": "CUST-0000",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "actor_id": "SYSTEM",
                "action": "GENESIS_INITIALIZED",
                "notes": "ThreatCast Evidence Ledger Genesis Initialized"
            }]
        }
        self.world_state["EVID-GENESIS-0000"] = genesis_tx
        genesis_block = LedgerBlock(
            block_number=0,
            previous_hash="0" * 64,
            transactions=[genesis_tx]
        )
        self.chain.append(genesis_block)

    def create_evidence_record(
        self,
        evidence_id: str,
        forecast_id: str,
        incident_id: Optional[str],
        evidence_hash: str,
        collector_id: str,
        target_asset_id: str,
        mitre_technique: str,
        risk_score: float,
        confidence_score: float,
        off_chain_uri: str,
        actor_id: str = "analyst1"
    ) -> Dict[str, Any]:
        if evidence_id in self.world_state:
            raise ValueError(f"Evidence record {evidence_id} already exists on ledger")

        previous_block_hash = self.chain[-1].block_hash
        timestamp_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        record = {
            "evidence_id": evidence_id,
            "forecast_id": forecast_id,
            "incident_id": incident_id or "",
            "evidence_hash": evidence_hash,
            "previous_hash": previous_block_hash,
            "collector_id": collector_id,
            "target_asset_id": target_asset_id,
            "mitre_technique": mitre_technique,
            "risk_score": risk_score,
            "confidence_score": confidence_score,
            "created_at": timestamp_str,
            "off_chain_uri": off_chain_uri,
            "integrity_status": "VALID",
            "custody_log": [{
                "event_id": f"CUST-{int(time.time()*1000)}",
                "timestamp": timestamp_str,
                "actor_id": actor_id,
                "action": "CREATED",
                "notes": f"Anchored by collector {collector_id} for asset {target_asset_id}"
            }]
        }

        # Update world state & commit new block
        self.world_state[evidence_id] = record
        new_block = LedgerBlock(
            block_number=len(self.chain),
            previous_hash=previous_block_hash,
            transactions=[record]
        )
        self.chain.append(new_block)
        return {
            "evidence_id": evidence_id,
            "block_number": new_block.block_number,
            "block_hash": new_block.block_hash,
            "merkle_root": new_block.merkle_root,
            "evidence_hash": evidence_hash,
            "timestamp": new_block.timestamp,
            "status": "COMMITTED"
        }

    def update_chain_of_custody(
        self,
        evidence_id: str,
        actor_id: str,
        action: str,
        notes: str
    ) -> Dict[str, Any]:
        if evidence_id not in self.world_state:
            raise KeyError(f"Evidence {evidence_id} not found in world state")

        record = self.world_state[evidence_id]
        event = {
            "event_id": f"CUST-{int(time.time()*1000)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "actor_id": actor_id,
            "action": action,
            "notes": notes
        }
        record["custody_log"].append(event)

        custody_tx = {
            "type": "CUSTODY_UPDATE",
            "evidence_id": evidence_id,
            "custody_event": event
        }
        new_block = LedgerBlock(
            block_number=len(self.chain),
            previous_hash=self.chain[-1].block_hash,
            transactions=[custody_tx]
        )
        self.chain.append(new_block)
        return event

    def query_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        return self.world_state.get(evidence_id)

    def verify_integrity(self, evidence_id: str, supplied_hash: str, verifier_id: str = "auditor") -> Dict[str, Any]:
        record = self.query_evidence(evidence_id)
        if not record:
            return {
                "evidence_id": evidence_id,
                "found": False,
                "match": False,
                "error": "Record not found"
            }

        anchored_hash = record["evidence_hash"]
        match = (anchored_hash.lower() == supplied_hash.lower())

        # Update custody log with verification
        self.update_chain_of_custody(
            evidence_id=evidence_id,
            actor_id=verifier_id,
            action="INTEGRITY_VERIFIED",
            notes=f"Verification verdict: match={match}, supplied={supplied_hash}"
        )

        return {
            "evidence_id": evidence_id,
            "found": True,
            "anchored_hash": anchored_hash,
            "supplied_hash": supplied_hash,
            "match": match,
            "verified_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "verifier_id": verifier_id,
            "tamper_detected": not match,
            "status": "VALID" if match else "TAMPER_DETECTED"
        }

    def get_chain_blocks(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [b.to_dict() for b in reversed(self.chain[-limit:])]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_blocks": len(self.chain),
            "total_records": len(self.world_state),
            "channel": self.channel_name,
            "chaincode": self.chaincode_id,
            "latest_block_hash": self.chain[-1].block_hash if self.chain else None
        }
