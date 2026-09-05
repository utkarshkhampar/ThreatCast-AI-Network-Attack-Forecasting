"""
Integration tests for ThreatCast FastAPI Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "ai_world_model" in data["components"]
    assert "blockchain_evidence" in data["components"]


def test_assets_endpoint():
    response = client.get("/api/v1/assets")
    assert response.status_code == 200
    assets = response.json()
    assert isinstance(assets, list)
    assert len(assets) > 0


def test_forecasts_endpoint():
    response = client.get("/api/v1/forecasts?horizon=5")
    assert response.status_code == 200
    fc = response.json()
    assert "forecast_id" in fc
    assert "steps" in fc
    assert len(fc["steps"]) == 6  # Step 0 + 5 steps


def test_ai_benchmarks_endpoint():
    response = client.get("/api/v1/ai/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "Temporal Graph World Model" in data["metrics"]
    assert "Logistic Regression" in data["metrics"]


def test_counterfactual_simulation_endpoint():
    payload = {
        "target_ip": "192.168.1.45",
        "horizon_steps": 5
    }
    response = client.post("/api/v1/simulations/run", json=payload)
    assert response.status_code == 200
    sim = response.json()
    assert "scenarios" in sim
    assert len(sim["scenarios"]) == 4


def test_blockchain_stats_endpoint():
    response = client.get("/api/v1/blockchain/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_blocks"] >= 1
