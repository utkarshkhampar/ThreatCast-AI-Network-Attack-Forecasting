"""
ThreatCast - Audit Logs API Router
Provides immutable logs for user authentication, policy authorizations, and model operations.
"""

from typing import Dict, Any, List
import time
from fastapi import APIRouter

router = APIRouter(prefix="/audit", tags=["Audit Trails"])

AUDIT_EVENTS = [
    {
        "id": "AUD-1001",
        "timestamp": "2026-09-05T06:30:12Z",
        "actor": "admin",
        "action": "USER_LOGIN",
        "target": "ThreatCast SOC Console",
        "outcome": "SUCCESS",
        "ip_address": "192.168.1.100",
        "details": "MFA Challenge Verified"
    },
    {
        "id": "AUD-1002",
        "timestamp": "2026-09-05T06:31:05Z",
        "actor": "SYSTEM_WORLD_MODEL",
        "action": "FORECAST_GENERATED",
        "target": "AST-WK-42",
        "outcome": "SUCCESS",
        "ip_address": "127.0.0.1",
        "details": "5-step forward rollout computed, attack_prob=0.91, stage=Lateral Movement"
    },
    {
        "id": "AUD-1003",
        "timestamp": "2026-09-05T06:32:44Z",
        "actor": "analyst1",
        "action": "DEFENSIVE_POLICY_EVALUATED",
        "target": "192.168.1.45",
        "outcome": "AUTHORIZED_DRY_RUN",
        "ip_address": "192.168.1.102",
        "details": "Gatekeeper validated allow-list and RBAC. Dry-run simulation executed."
    }
]


@router.get("", response_model=List[Dict[str, Any]])
async def list_audit_logs():
    return AUDIT_EVENTS
