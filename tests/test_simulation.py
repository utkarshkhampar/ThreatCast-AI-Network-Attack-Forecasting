import pytest
from simulation.counterfactual import CounterfactualSimulator

def test_counterfactual_simulator():
    sim = CounterfactualSimulator()
    state_vector = [15.0, 120.0, 850.0, 250000.0, 45.0, 3.5, 0.85, 0.1, 12.0, 35.0, 0.05, 0.01, 0.8, 0.1, 25.0, 10.0]
    k_steps = 3
    results = sim.simulate_interventions(state_vector, target_ip="10.0.0.42", k_steps=k_steps)
    
    assert "scenarios" in results
    assert "best_recommended_intervention" in results
    assert len(results["scenarios"]) == 4
    
    for s in results["scenarios"]:
        assert "scenario_id" in s
        assert "action_type" in s
        assert "projected_attack_probability" in s
        assert "risk_reduction_percentage" in s
        assert len(s["trajectory"]) == k_steps + 1
