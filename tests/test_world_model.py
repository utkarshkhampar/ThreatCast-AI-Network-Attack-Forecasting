"""
Unit tests for ThreatCast Latent World Model and Forecasting Engine.
"""

import pytest
from ai_engine.models.world_model import LatentWorldModel


def test_world_model_initialization():
    wm = LatentWorldModel(state_dim=16, latent_dim=8)
    assert wm.state_dim == 16
    assert wm.latent_dim == 8
    assert len(wm.STAGES) == 11


def test_latent_encoding_and_sampling():
    wm = LatentWorldModel()
    state_vec = [10.0] * 16
    mu, logvar = wm.encode(state_vec)
    assert mu.shape == (8,)
    assert logvar.shape == (8,)
    
    z = wm.sample_latent(mu, logvar)
    assert z.shape == (8,)


def test_k_step_forward_rollout():
    wm = LatentWorldModel()
    state_vec = [5.0, 12.0, 45.0, 15.0, 3.0, 0.65, 0.08, 0.02, 4.2, 1.2, 0.045, 0.012, 0.75, 0.20, 2.0, 2.0]
    trajectory = wm.forecast_k_steps(state_vec, k_steps=5, num_mc_samples=5)
    
    assert len(trajectory) == 6  # Step 0 (NOW) + 5 future steps
    assert trajectory[0]["step"] == 0
    assert trajectory[0]["step_label"] == "NOW"
    assert trajectory[-1]["step"] == 5
    assert trajectory[-1]["step_label"] == "+5"
    
    for step in trajectory:
        assert 0.0 <= step["attack_probability"] <= 1.0
        assert 0.0 <= step["confidence"] <= 1.0
        assert 0.0 <= step["uncertainty"] <= 1.0
        assert step["predicted_stage"] in wm.STAGES
