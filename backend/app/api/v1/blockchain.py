"""
ThreatCast - Hyperledger Fabric Blockchain Explorer & Verification Router
Exposes ledger blocks, transaction validation, and blockchain health stats.
"""

from typing import Dict, Any, List
from fastapi import APIRouter
from blockchain.client import blockchain_client

router = APIRouter(prefix="/blockchain", tags=["Hyperledger Fabric Blockchain Explorer"])


@router.get("/blocks", response_model=List[Dict[str, Any]])
async def list_blockchain_blocks(limit: int = 25):
    return blockchain_client.get_blocks(limit=limit)


@router.get("/stats", response_model=Dict[str, Any])
async def get_blockchain_stats():
    return blockchain_client.get_stats()


@router.get("/query/{evidence_id}", response_model=Dict[str, Any])
async def query_on_chain_evidence(evidence_id: str):
    rec = blockchain_client.get_evidence(evidence_id)
    if not rec:
        return {"found": False, "evidence_id": evidence_id}
    return {"found": True, "record": rec}
