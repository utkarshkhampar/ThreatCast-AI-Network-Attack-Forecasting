"""
ThreatCast - Counterfactual Simulation & Digital Twin API Router
Executes 'What-If' scenarios and compares projected attack progression deltas.
"""

from typing import Dict, Any
from fastapi import APIRouter
from simulation.counterfactual import cf_simulator
from backend.app.schemas.all_schemas import SimulationRequest, SimulationResponse

from backend.app.api.v1.telemetry import (
    ingested_packets_buffer, flow_aggregator, state_builder
)

router = APIRouter(prefix="/simulations", tags=["Counterfactual Simulation & Digital Twin"])


@router.post("/run", response_model=SimulationResponse)
async def run_counterfactual_simulation(req: SimulationRequest):
    active_flows = flow_aggregator.get_active_flow_records()
    snapshot = state_builder.build_state(ingested_packets_buffer, active_flows)
    
    vec = snapshot.state_vector
    if snapshot.total_packets == 0:
        vec = [6.0, 18.0, 145.0, 48.0, 24.0, 2.84, 0.84, 0.15, 6.4, 3.8, 0.035, 0.08, 0.85, 0.10, 5.0, 3.0]

    result = cf_simulator.simulate_interventions(
        current_state_vector=vec,
        target_ip=req.target_ip,
        k_steps=req.horizon_steps
    )
    return SimulationResponse(**result)


@router.get("/scenarios", response_model=list)
async def list_available_scenarios():
    return cf_simulator.AVAILABLE_SCENARIOS
