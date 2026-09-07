"""
Integration tests for ThreatCast Database & User Directory Management with RBAC.
Verifies role-based access control, session IP/device tracking, and database overview.
"""

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token

client = TestClient(app)


def test_rbac_database_access_control():
    # 1. Non-authenticated access must be rejected (401)
    unauth_res = client.get("/api/v1/users/stats")
    assert unauth_res.status_code == 401

    # 2. Analyst / Non-Admin token must be rejected by RBAC Guard (403 Forbidden)
    analyst_token = create_access_token({
        "sub": "test_analyst",
        "user_id": 999,
        "role": "ANALYST",
        "email": "analyst@threatcast.test"
    })
    analyst_res = client.get(
        "/api/v1/users/stats",
        headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert analyst_res.status_code == 403
    assert "Operation not permitted" in analyst_res.json()["detail"]

    # 3. Super Admin token is authorized (200 OK)
    admin_token = create_access_token({
        "sub": "admin",
        "user_id": 1,
        "role": "SUPER_ADMIN",
        "email": "admin@threatcast.soc"
    })
    admin_res = client.get(
        "/api/v1/users/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_res.status_code == 200
    stats = admin_res.json()
    assert "total_users" in stats
    assert stats["total_users"] >= 1
    assert "verified_users" in stats
    assert "users" in stats
    assert len(stats["users"]) >= 1
    # Check that IP and device fields are present
    assert "last_login_ip" in stats["users"][0]
    assert "last_login_device" in stats["users"][0]


def test_database_overview_and_sessions():
    admin_token = create_access_token({
        "sub": "admin",
        "user_id": 1,
        "role": "SUPER_ADMIN",
        "email": "admin@threatcast.soc"
    })
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Database Overview
    db_res = client.get("/api/v1/users/database-overview", headers=headers)
    assert db_res.status_code == 200
    db_data = db_res.json()
    assert db_data["status"] == "HEALTHY"
    assert "tables" in db_data
    assert "users" in db_data["tables"]
    assert "assets" in db_data["tables"]
    assert "audit_logs" in db_data["tables"]

    # 2. Active Sessions & Device IP tracking
    sess_res = client.get("/api/v1/users/sessions", headers=headers)
    assert sess_res.status_code == 200
    sess_data = sess_res.json()
    assert "sessions" in sess_data
    assert len(sess_data["sessions"]) >= 1
    sample_sess = sess_data["sessions"][0]
    assert "session_id" in sample_sess
    assert "ip_address" in sample_sess
    assert "device" in sample_sess
    assert sample_sess["status"] == "ONLINE"

    # 3. Terminate Session
    term_res = client.post(
        f"/api/v1/users/sessions/{sample_sess['session_id']}/terminate",
        headers=headers
    )
    assert term_res.status_code == 200
