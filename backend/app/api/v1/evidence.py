"""
ThreatCast - Forensic Evidence & Chain of Custody API Router
Handles off-chain evidence bundle registration, SHA-256 hashing, and blockchain anchoring.
"""

from typing import List, Dict, Any, Optional
import uuid
from fastapi import APIRouter, HTTPException, status
from blockchain.client import blockchain_client
from backend.app.schemas.all_schemas import (
    EvidenceCreateRequest, EvidenceResponse, VerifyEvidenceRequest, VerifyEvidenceResponse
)

router = APIRouter(prefix="/evidence", tags=["Forensic Evidence & Chain of Custody"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_evidence_records():
    blocks = blockchain_client.get_blocks(limit=50)
    records = []
    for b in blocks:
        for tx in b.get("transactions", []):
            if tx.get("type") != "GENESIS" and "evidence_id" in tx:
                records.append(tx)
    return records


@router.get("/{evidence_id}", response_model=Dict[str, Any])
async def get_evidence_record(evidence_id: str):
    record = blockchain_client.get_evidence(evidence_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence {evidence_id} not found on ledger.")
    return record


@router.post("/anchor", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def anchor_new_evidence(req: EvidenceCreateRequest):
    evidence_id = f"EVID-{uuid.uuid4().hex[:8].upper()}"
    calculated_hash = blockchain_client.hash_payload(req.raw_payload)

    receipt = blockchain_client.anchor_evidence(
        evidence_id=evidence_id,
        forecast_id=req.forecast_id,
        evidence_hash=calculated_hash,
        collector_id="FORENSIC_CAPTURE_AGENT",
        target_asset_id=req.target_asset_id,
        mitre_technique=req.mitre_technique,
        risk_score=req.risk_score,
        confidence_score=req.confidence_score,
        off_chain_uri=f"s3://threatcast-evidence/{evidence_id}.json",
        incident_id=req.incident_id,
        actor_id="analyst1"
    )

    return {
        "status": "ANCHORED",
        "receipt": receipt,
        "evidence_id": evidence_id,
        "evidence_hash": calculated_hash,
        "ledger_channel": "threatcast-channel"
    }


@router.post("/verify", response_model=VerifyEvidenceResponse)
async def verify_evidence_integrity(req: VerifyEvidenceRequest):
    target_hash = req.supplied_hash
    if not target_hash and req.supplied_payload:
        target_hash = blockchain_client.hash_payload(req.supplied_payload)

    if not target_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must supply either supplied_payload or supplied_hash.")

    res = blockchain_client.verify_evidence(
        evidence_id=req.evidence_id,
        supplied_hash=target_hash,
        verifier_id="auditor_lead"
    )
    return VerifyEvidenceResponse(**res)
