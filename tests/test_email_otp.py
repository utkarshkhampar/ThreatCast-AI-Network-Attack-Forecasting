"""
Integration tests for ThreatCast Email OTP Registration and Verification Flow.
"""

import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_email_otp_lifecycle():
    timestamp = int(time.time())
    test_username = f"analyst_{timestamp}"
    test_email = f"analyst_{timestamp}@threatcast.test"
    test_password = "SecurePassword123!"

    # 1. Register new user
    reg_payload = {
        "username": test_username,
        "email": test_email,
        "password": test_password,
        "full_name": "Test Analyst",
        "role": "ANALYST"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["is_verified"] is False
    assert reg_data["email"] == test_email
    otp_code = reg_data.get("dev_otp")
    assert otp_code is not None
    assert len(otp_code) == 6

    # 2. Login before verification should be rejected (403 Forbidden)
    login_unverified = client.post("/api/v1/auth/login", json={"username": test_username, "password": test_password})
    assert login_unverified.status_code == 403

    # 3. Wrong OTP rejected (400 Bad Request)
    verify_bad = client.post("/api/v1/auth/verify-otp", json={"email": test_email, "otp_code": "000000"})
    assert verify_bad.status_code == 400

    # 4. Resend OTP should generate a fresh valid code
    resend_res = client.post("/api/v1/auth/send-otp", json={"email": test_email})
    assert resend_res.status_code == 200
    new_otp_code = resend_res.json().get("dev_otp")
    assert new_otp_code is not None
    assert len(new_otp_code) == 6

    # 5. Correct OTP verifies user and issues token
    verify_good = client.post("/api/v1/auth/verify-otp", json={"email": test_email, "otp_code": new_otp_code})
    assert verify_good.status_code == 200
    verify_data = verify_good.json()
    assert verify_data["is_verified"] is True
    assert "token" in verify_data
    assert "access_token" in verify_data["token"]

    # 6. User can now log in normally
    login_good = client.post("/api/v1/auth/login", json={"username": test_username, "password": test_password})
    assert login_good.status_code == 200
    login_data = login_good.json()
    assert "access_token" in login_data
    assert login_data["role"] == "ANALYST"

    # 7. User can also log in using email
    login_email = client.post("/api/v1/auth/login", json={"username": test_email, "password": test_password})
    assert login_email.status_code == 200
