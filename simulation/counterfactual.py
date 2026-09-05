"""
ThreatCast - Cyber Digital Twin & Counterfactual Simulator
Simulates 'What-If' defender intervention scenarios by modifying the internal graph
representation, rolling the world model forward, and computing risk and stage probability deltas.
"""

from typing import Dict, Any, List, Optional
from ai_engine.models.world_model import world_model
from graph_engine.temporal_graph import TemporalGraph


class CounterfactualSimulator:
    """
    Safe Counterfactual Engine.
    Simulates outcome of hypothetical defender interventions without making real network changes.
    """

    AVAILABLE_SCENARIOS = [
        {
            "id": "scenario_baseline",
            "name": "No Intervention (Passive Observation)",
            "description": "Maintain current network state without active containment measures."
        },
        {
            "id": "scenario_isolate_host",
            "name": "Isolate Flagged Endpoint",
            "description": "Sever all ingress/egress edges for the primary anomalous host (e.g., WKSTN-042)."
        },
        {
            "id": "scenario_block_port",
            "name": "Block Sensitive Protocol/Port (SMB 445 / RDP 3389)",
            "description": "Filter communication edges matching lateral movement ports across the subnet."
        },
        {
            "id": "scenario_segment_subnet",
            "name": "Apply Micro-segmentation Rule",
            "description": "Isolate the compromised subnet from critical database and domain controller zones."
        }
    ]

    def simulate_interventions(
        self,
        current_state_vector: List[float],
        target_ip: str,
        k_steps: int = 5
    ) -> Dict[str, Any]:
        """
        Executes parallel counterfactual rollouts across intervention scenarios.
        """
        # Baseline (No intervention)
        baseline_trajectory = world_model.forecast_k_steps(current_state_vector, k_steps=k_steps)
        baseline_final_prob = baseline_trajectory[-1]["attack_probability"]
        baseline_final_stage = baseline_trajectory[-1]["predicted_stage"]

        # Scenario 1: Isolate Host (removes fan-out, drops connection rate by 70%)
        isolated_state = list(current_state_vector)
        if len(isolated_state) >= 16:
            isolated_state[1] = max(1.0, isolated_state[1] * 0.3)  # active conns
            isolated_state[2] = max(5.0, isolated_state[2] * 0.35) # pps
            isolated_state[6] = min(0.05, isolated_state[6] * 0.1) # syn ratio
            isolated_state[9] = max(0.2, isolated_state[9] * 0.2)  # conn rate
            isolated_state[14] = 0.0 # max fan-out drops to 0
        iso_trajectory = world_model.forecast_k_steps(isolated_state, k_steps=k_steps)
        iso_final_prob = iso_trajectory[-1]["attack_probability"]

        # Scenario 2: Block Port (filters port diversity and entropy)
        blocked_port_state = list(current_state_vector)
        if len(blocked_port_state) >= 16:
            blocked_port_state[4] = max(1.0, blocked_port_state[4] * 0.4) # unique ports
            blocked_port_state[5] = max(0.2, blocked_port_state[5] * 0.5) # port entropy
            blocked_port_state[14] = max(1.0, blocked_port_state[14] * 0.5) # fan-out halved
        port_trajectory = world_model.forecast_k_steps(blocked_port_state, k_steps=k_steps)
        port_final_prob = port_trajectory[-1]["attack_probability"]

        # Scenario 3: Micro-segmentation
        segmented_state = list(current_state_vector)
        if len(segmented_state) >= 16:
            segmented_state[1] = max(2.0, segmented_state[1] * 0.4)
            segmented_state[14] = 1.0 # strictly 1 target allowed
            segmented_state[15] = 1.0
        seg_trajectory = world_model.forecast_k_steps(segmented_state, k_steps=k_steps)
        seg_final_prob = seg_trajectory[-1]["attack_probability"]

        scenarios_results = [
            {
                "scenario_id": "A_NO_ACTION",
                "title": "A: No Intervention (Current Trajectory)",
                "action_type": "NONE",
                "initial_attack_probability": baseline_trajectory[0]["attack_probability"],
                "projected_attack_probability": baseline_final_prob,
                "projected_attack_stage": baseline_final_stage,
                "risk_reduction_percentage": 0.0,
                "operational_impact": "NONE",
                "recommendation_rank": 4,
                "trajectory": baseline_trajectory
            },
            {
                "scenario_id": "B_ISOLATE_HOST",
                "title": f"B: Isolate Host ({target_ip})",
                "action_type": "ISOLATE_ENDPOINT",
                "initial_attack_probability": baseline_trajectory[0]["attack_probability"],
                "projected_attack_probability": iso_final_prob,
                "projected_attack_stage": iso_trajectory[-1]["predicted_stage"],
                "risk_reduction_percentage": round(max(0.0, (baseline_final_prob - iso_final_prob) / max(baseline_final_prob, 0.01) * 100.0), 1),
                "operational_impact": "LOW (Single Workstation Isolated)",
                "recommendation_rank": 1,
                "trajectory": iso_trajectory
            },
            {
                "scenario_id": "C_BLOCK_PORT",
                "title": "C: Block Lateral Ports (SMB 445 / RDP 3389)",
                "action_type": "BLOCK_PORT",
                "initial_attack_probability": baseline_trajectory[0]["attack_probability"],
                "projected_attack_probability": port_final_prob,
                "projected_attack_stage": port_trajectory[-1]["predicted_stage"],
                "risk_reduction_percentage": round(max(0.0, (baseline_final_prob - port_final_prob) / max(baseline_final_prob, 0.01) * 100.0), 1),
                "operational_impact": "MEDIUM (Affects File Sharing Across Subnet)",
                "recommendation_rank": 2,
                "trajectory": port_trajectory
            },
            {
                "scenario_id": "D_SEGMENT_SUBNET",
                "title": "D: Enforce Zero Trust Subnet Segmentation",
                "action_type": "NETWORK_SEGMENTATION",
                "initial_attack_probability": baseline_trajectory[0]["attack_probability"],
                "projected_attack_probability": seg_final_prob,
                "projected_attack_stage": seg_trajectory[-1]["predicted_stage"],
                "risk_reduction_percentage": round(max(0.0, (baseline_final_prob - seg_final_prob) / max(baseline_final_prob, 0.01) * 100.0), 1),
                "operational_impact": "HIGH (Restricts Inter-VLAN Routing)",
                "recommendation_rank": 3,
                "trajectory": seg_trajectory
            }
        ]

        return {
            "target_ip": target_ip,
            "horizon_steps": k_steps,
            "scenarios": scenarios_results,
            "best_recommended_intervention": "B_ISOLATE_HOST",
            "simulation_mode": "DECISION_SUPPORT_ONLY"
        }


# Global simulator instance
cf_simulator = CounterfactualSimulator()
