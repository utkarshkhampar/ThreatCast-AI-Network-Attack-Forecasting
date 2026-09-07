"""
ThreatCast - Threat Intelligence API Router
Provides IOC normalization, CVE correlations, IP reputation lookups, and threat actor profiles.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/threat-intelligence", tags=["Threat Intelligence"])


@router.get("/iocs", response_model=List[Dict[str, Any]])
async def list_iocs():
    now = datetime.utcnow()
    feed = [
        {"type": "IP", "value": "198.51.100.42", "reputation": "MALICIOUS", "confidence": 0.98, "threat_actor": "APT29-Affiliated", "first_seen": (now - timedelta(days=2)).strftime("%Y-%m-%d"), "category": "C2 Server"},
        {"type": "IP", "value": "203.0.113.19", "reputation": "SUSPICIOUS", "confidence": 0.72, "threat_actor": "Unknown Scanner", "first_seen": (now - timedelta(hours=8)).strftime("%Y-%m-%d"), "category": "Port Scanner"},
        {"type": "DOMAIN", "value": "telemetry-sync-cdn.xyz", "reputation": "MALICIOUS", "confidence": 0.94, "threat_actor": "Cobalt Strike Profile", "first_seen": (now - timedelta(days=1)).strftime("%Y-%m-%d"), "category": "C2 Domain"},
        {"type": "HASH", "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "reputation": "BENIGN", "confidence": 1.0, "threat_actor": "None", "first_seen": (now - timedelta(days=90)).strftime("%Y-%m-%d"), "category": "Known Binary"},
    ]
    return feed



@router.get("/cves", response_model=List[Dict[str, Any]])
async def list_cves():
    return CVES


@router.get("/lookup/{query_val}", response_model=Dict[str, Any])
async def lookup_indicator(query_val: str):
    ioc = next((item for item in FEED_IOCS if item["value"].lower() == query_val.lower()), None)
    if ioc:
        return {"found": True, "details": ioc}
    return {
        "found": False,
        "query": query_val,
        "reputation": "UNKNOWN",
        "confidence": 0.0,
        "notes": "Indicator not present in local threat intelligence cache."
    }
