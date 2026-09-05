"""
ThreatCast - Explainable AI (XAI) API Router
Provides SHAP feature attribution rankings, graph attention weights, and natural language explanations.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Query
from explainability.shap_explainer import xai_explainer
from backend.app.schemas.all_schemas import ExplainabilityResponse

router = APIRouter(prefix="/explainability", tags=["Explainable AI (XAI)"])


@router.get("", response_model=ExplainabilityResponse)
async def get_current_explanation(
    stage: str = Query("Reconnaissance", description="Predicted attack stage"),
    prob: float = Query(0.85, description="Attack probability")
):
    # Representative suspicious state vector
    vec = [6.0, 18.0, 145.0, 48.0, 24.0, 2.4, 0.42, 0.15, 6.4, 3.8, 0.035, 0.08, 0.85, 0.10, 4.0, 3.0]
    explanation = xai_explainer.explain_state(vec, prob, stage)
    return ExplainabilityResponse(
        forecast_id="FC-CURRENT",
        **explanation
    )
