"""
ThreatCast - User and Entity Behaviour Analytics (UEBA) API Router
Serves host behavioural baselines, typical peer graphs, and anomaly deviation scores.
"""

from typing import Dict, Any, List
from fastapi import APIRouter
from ueba.baseline_profiler import ueba_engine

router = APIRouter(prefix="/ueba", tags=["User & Entity Behaviour Analytics"])


@router.get("/profiles", response_model=List[Dict[str, Any]])
async def list_ueba_profiles():
    return ueba_engine.get_all_profiles()


@router.get("/profiles/{ip_address}", response_model=Dict[str, Any])
async def get_ueba_profile(ip_address: str):
    profile = ueba_engine.get_or_create_profile(ip_address)
    return profile.to_dict()


@router.get("/summary", response_model=Dict[str, Any])
async def get_ueba_summary():
    profiles = ueba_engine.get_all_profiles()
    anomalous = [p for p in profiles if p["current_deviation_score"] >= 50.0]
    return {
        "total_monitored_entities": len(profiles),
        "anomalous_entities_count": len(anomalous),
        "highest_risk_entity": max(profiles, key=lambda p: p["current_deviation_score"])["ip"] if profiles else None,
        "average_deviation_score": round(sum(p["current_deviation_score"] for p in profiles) / max(len(profiles), 1), 2)
    }
