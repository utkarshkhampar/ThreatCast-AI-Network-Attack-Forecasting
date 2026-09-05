"""
ThreatCast - Historical Analytics & SOC Metrics Router
Serves trend metrics, attack stage distribution, MTTD/MTTR, and forecasting accuracy curves.
"""

from typing import Dict, Any, List
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["Historical Analytics"])


@router.get("/overview", response_model=Dict[str, Any])
async def get_analytics_overview():
    return {
        "mttd_minutes": 2.4,
        "early_warning_mean_lead_time_minutes": 4.6,
        "false_alarm_rate_percentage": 3.8,
        "forecasting_accuracy_percentage": 92.4,
        "total_threats_forecasted_30d": 142,
        "total_incidents_prevented_30d": 28,
        "stage_distribution": {
            "Reconnaissance": 45,
            "Discovery": 32,
            "Initial Access": 24,
            "Lateral Movement": 18,
            "Command & Control": 15,
            "Exfiltration": 8
        },
        "hourly_risk_trend": [
            {"hour": "00:00", "risk": 15},
            {"hour": "04:00", "risk": 18},
            {"hour": "08:00", "risk": 32},
            {"hour": "12:00", "risk": 78},
            {"hour": "16:00", "risk": 89},
            {"hour": "20:00", "risk": 64}
        ]
    }
