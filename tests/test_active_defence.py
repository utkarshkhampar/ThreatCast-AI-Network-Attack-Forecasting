"""
Unit tests for ThreatCast Active Defence Gatekeeper, Policy Engine, and Rollback.
"""

import pytest
from response_engine.gatekeeper import response_gatekeeper
from response_engine.executors import action_executor
from response_engine.policy_engine import policy_engine


def test_allowlist_verification():
    # Internal lab subnets must pass
    assert response_gatekeeper.is_ip_in_allowlist("192.168.1.45") is True
    assert response_gatekeeper.is_ip_in_allowlist("10.0.0.10") is True
    assert response_gatekeeper.is_ip_in_allowlist("127.0.0.1") is True

    # External unauthorized public IPs must fail
    assert response_gatekeeper.is_ip_in_allowlist("8.8.8.8") is False
    assert response_gatekeeper.is_ip_in_allowlist("1.1.1.1") is False


def test_gatekeeper_blocks_unauthorized_targets():
    authorized, reason, gates = response_gatekeeper.validate_action_request(
        action_type="ISOLATE_ENDPOINT",
        target_ip="8.8.8.8",
        user_role="SOC_ADMIN",
        user_id="analyst1"
    )
    assert authorized is False
    assert "TARGET_OUTSIDE_ALLOWLIST" in reason


def test_gatekeeper_blocks_unauthorized_roles():
    authorized, reason, gates = response_gatekeeper.validate_action_request(
        action_type="ISOLATE_ENDPOINT",
        target_ip="192.168.1.45",
        user_role="VIEWER",
        user_id="guest1"
    )
    assert authorized is False
    assert "INSUFFICIENT_RBAC_PERMISSIONS" in reason


def test_action_execution_and_rollback():
    target_ip = "192.168.1.45"
    record = action_executor.execute_action(
        action_type="ISOLATE_ENDPOINT",
        target_ip=target_ip,
        reason="Test containment",
        actor_id="analyst1",
        execution_mode="DRY_RUN"
    )
    assert record["status"] == "DRY_RUN_SIMULATED"
    assert record["action_id"].startswith("ACT-")

    # Test rollback
    rollback_res = action_executor.rollback_action(record["action_id"], "analyst1")
    assert rollback_res["success"] is True
    assert rollback_res["status"] == "ROLLED_BACK"
