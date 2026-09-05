"""
ThreatCast - Threat Intelligence API Router
Provides IOC normalization, CVE correlations, IP reputation lookups, and threat actor profiles.
"""

from typing import Dict, Any, List
from fastapi import APIRouter

router = APIRouter(prefix="/threat-intelligence", tags=["Threat Intelligence"])

FEED_IOCS = [
    {"type": "IP", "value": "198.51.100.42", "reputation": "MALICIOUS", "confidence": 0.98, "threat_actor": "APT29-Affiliated", "first_seen": "2026-08-28", "category": "C2 Server"},
    {"type": "IP", "value": "203.0.113.19", "reputation": "SUSPICIOUS", "confidence": 0.72, "threat_actor": "Unknown Scanner", "first_seen": "2026-09-02", "category": "Port Scanner"},
    {"type": "DOMAIN", "value": "telemetry-sync-cdn.xyz", "reputation": "MALICIOUS", "confidence": 0.94, "threat_actor": "Cobalt Strike Profile", "first_seen": "2026-08-30", "category": "C2 Domain"},
    {"type": "HASH", "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "reputation": "BENIGN", "confidence": 1.0, "threat_actor": "None", "first_seen": "2026-01-01", "category": "Known Binary"},
]

CVES = [
    {"cve_id": "CVE-2024-21413", "title": "Microsoft Outlook Remote Code Execution", "cvss": 9.8, "affected_port": 445, "mitre_mapping": "T1190"},
    {"cve_id": "CVE-2023-46805", "title": "Ivanti Connect Secure Authentication Bypass", "cvss": 8.2, "affected_port": 443, "mitre_mapping": "T1190"},
    {"cve_id": "CVE-2022-26134", "title": "Atlassian Confluence OGNL Injection", "cvss": 9.8, "affected_port": 8090, "mitre_mapping": "T1190"}
]


@router.get("/iocs", response_model=List[Dict[str, Any]])
async def list_iocs():
    return FEED_IOCS


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
