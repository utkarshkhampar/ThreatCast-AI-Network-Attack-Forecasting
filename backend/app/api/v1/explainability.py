"""
ThreatCast - Explainable AI (XAI) API Router
Provides SHAP feature attribution rankings, graph attention weights, and natural language explanations.
"""

import time
from typing import Dict, Any, List
from fastapi import APIRouter, Query
from explainability.shap_explainer import xai_explainer
from backend.app.schemas.all_schemas import ExplainabilityResponse
from backend.app.api.v1.telemetry import (
    ingested_packets_buffer, flow_aggregator, state_builder
)

router = APIRouter(prefix="/explainability", tags=["Explainable AI (XAI)"])


@router.get("", response_model=ExplainabilityResponse)
async def get_current_explanation(
    stage: str = Query("Lateral Movement", description="Predicted attack stage"),
    prob: float = Query(0.91, description="Attack probability")
):
    # Extract live observation vector S_t from ingested telemetry
    active_flows = flow_aggregator.get_active_flow_records()
    snapshot = state_builder.build_state(ingested_packets_buffer, active_flows)
    
    vec = snapshot.state_vector
    if snapshot.total_packets == 0:
        now = time.time()
        vec = [
            6.0, 18.0, 145.0, 48.0, 24.0, 2.84, 0.84, 0.15,
            6.4, 3.8, 0.035, 0.08, 0.85, 0.10, 5.0, 3.0
        ]

    explanation = xai_explainer.explain_state(vec, prob, stage)
    return ExplainabilityResponse(
        forecast_id=f"FC-XAI-{int(time.time())}",
        **explanation
    )
