"""
ThreatCast - Counterfactual Simulation & Digital Twin API Router
Executes 'What-If' scenarios and compares projected attack progression deltas.
"""

from typing import Dict, Any
from fastapi import APIRouter
from simulation.counterfactual import cf_simulator
from backend.app.schemas.all_schemas import SimulationRequest, SimulationResponse

router = APIRouter(prefix="/simulations", tags=["Counterfactual Simulation & Digital Twin"])


@router.post("/run", response_model=SimulationResponse)
async def run_counterfactual_simulation(req: SimulationRequest):
    # Suspicious state vector
    vec = [6.0, 18.0, 145.0, 48.0, 24.0, 2.4, 0.42, 0.15, 6.4, 3.8, 0.035, 0.08, 0.85, 0.10, 4.0, 3.0]
    result = cf_simulator.simulate_interventions(
        current_state_vector=vec,
        target_ip=req.target_ip,
        k_steps=req.horizon_steps
    )
    return SimulationResponse(**result)


@router.get("/scenarios", response_model=list)
async def list_available_scenarios():
    return cf_simulator.AVAILABLE_SCENARIOS
