"""
Integration tests for ThreatCast Email OTP Registration and Verification Flow.
"""

import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

# Explicitly enable test OTP echo for automated test suite validation
settings.ALLOW_TEST_OTP_ECHO = True

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

    # 8. Unregistered user rejection on login-initiate
    unreg_res = client.post("/api/v1/auth/login-initiate", json={"username_or_email": "nonexistent_hacker", "password": "wrong"})
    assert unreg_res.status_code == 401

    # 9. Registered user initiates 2FA email login
    initiate_res = client.post("/api/v1/auth/login-initiate", json={"username_or_email": test_username, "password": test_password})
    assert initiate_res.status_code == 200
    init_data = initiate_res.json()
    assert init_data["require_otp"] is True
    login_otp = init_data.get("dev_otp")
    assert login_otp is not None
    assert len(login_otp) == 6

    # 10. Complete 2FA login with OTP
    verify_login_res = client.post("/api/v1/auth/login-verify-otp", json={"username_or_email": test_username, "otp_code": login_otp})
    assert verify_login_res.status_code == 200
    auth_token = verify_login_res.json()["access_token"]
    assert auth_token is not None

    # 11. Authenticated operator changes password
    new_password = "NewSuperSecretPassword999!"
    change_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"current_password": test_password, "new_password": new_password}
    )
    assert change_res.status_code == 200

    # 12. Operator can initiate and login with new password
    init_new_res = client.post("/api/v1/auth/login-initiate", json={"username_or_email": test_username, "password": new_password})
    assert init_new_res.status_code == 200

