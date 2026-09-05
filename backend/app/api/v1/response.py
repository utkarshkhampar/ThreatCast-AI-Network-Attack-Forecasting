"""
ThreatCast - Active Defence & Response Engine API Router
Handles policy-driven defensive recommendations, 10-point authorization checks,
DRY_RUN / SIMULATION / LIVE execution, and automated rollback.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from response_engine.gatekeeper import response_gatekeeper
from response_engine.executors import action_executor
from response_engine.policy_engine import policy_engine
from backend.app.schemas.all_schemas import DefensiveActionRequest, DefensiveActionResponse

router = APIRouter(prefix="/response", tags=["Controlled Active Defence & Response"])


class KillSwitchRequest(BaseModel):
    engaged: bool
    confirmation_key: str


@router.get("/recommendations", response_model=List[Dict[str, Any]])
async def get_response_recommendations(target_ip: str = "192.168.1.45"):
    return policy_engine.evaluate_forecast(
        target_ip=target_ip,
        asset_criticality="HIGH",
        risk_score=91.0,
        attack_prob=0.91,
        predicted_stage="Lateral Movement"
    )


@router.post("/execute", response_model=DefensiveActionResponse)
async def execute_defensive_action(req: DefensiveActionRequest):
    actor_id = "analyst1"
    user_role = "SOC_ADMIN"  # Default role context for execution

    # Validate all 10 security authorization gates
    authorized, reason, gates_summary = response_gatekeeper.validate_action_request(
        action_type=req.action_type,
        target_ip=req.target_ip,
        user_role=user_role,
        user_id=actor_id,
        execution_mode=req.execution_mode,
        human_confirmation_token=req.human_confirmation_token
    )

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "ACTION_AUTHORIZATION_FAILED",
                "message": reason,
                "gates": gates_summary
            }
        )

    # Execute action
    record = action_executor.execute_action(
        action_type=req.action_type,
        target_ip=req.target_ip,
        reason=req.reason,
        actor_id=actor_id,
        execution_mode=req.execution_mode or "DRY_RUN",
        metadata=req.metadata
    )

    return DefensiveActionResponse(
        action_id=record["action_id"],
        action_type=record["action_type"],
        target_ip=record["target_ip"],
        status=record["status"],
        execution_mode=record["execution_mode"],
        reason=record["reason"],
        actor_id=record["actor_id"],
        timestamp=record["timestamp"],
        output_message=record["output_message"],
        rollback_available=True
    )


@router.post("/rollback/{action_id}", response_model=Dict[str, Any])
async def rollback_action(action_id: str):
    actor_id = "analyst1"
    result = action_executor.rollback_action(action_id, actor_id)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("error"))
    return result


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_response_history():
    return action_executor.get_history()


@router.post("/kill-switch", response_model=Dict[str, Any])
async def toggle_kill_switch(req: KillSwitchRequest):
    if req.confirmation_key != "THREATCAST_EMERGENCY_OVERRIDE":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid confirmation key.")
    response_gatekeeper.kill_switch_engaged = req.engaged
    return {
        "kill_switch_engaged": response_gatekeeper.kill_switch_engaged,
        "status": "ENGAGED - ALL ACTIVE RESPONSES BLOCKED" if req.engaged else "DISENGAGED - NORMAL OPERATION"
    }
