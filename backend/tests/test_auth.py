# ----- FILE: backend/tests/test_auth.py -----
import pytest
import bcrypt


def test_register_worker(client):
    """Test worker registration."""
    response = client.post("/api/auth/register", json={
        "username": "newworker",
        "email": "newworker@test.com",
        "password": "pass123456",
        "role": "worker",
        "phone": "+254700000001"
    })
    
    assert response.status_code == 201
    assert response.json["user"]["email"] == "newworker@test.com"


def test_register_employer(client):
    """Test employer registration."""
    response = client.post("/api/auth/register", json={
        "username": "newemployer",
        "email": "employer@test.com",
        "password": "pass123456",
        "role": "employer",
        "phone": "+254700000002"
    })
    
    assert response.status_code == 201
    assert response.json["user"]["role"] == "employer"


def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post("/api/auth/login", json={
        "email": test_user["user"].email,
        "password": test_user["password"]
    })
    
    assert response.status_code == 200
    assert "access_token" in response.json
    assert "refresh_token" in response.json


def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrongpass"
    })
    
    assert response.status_code == 401


def test_password_reset_request(client, test_user):
    """Test password reset request."""
    response = client.post("/api/auth/password-reset/request", json={
        "email": test_user["user"].email
    })
    
    # Should always return 200 to prevent email enumeration
    assert response.status_code == 200


def test_change_password(client, auth_token, test_user):
    """Test password change."""
    response = client.post("/api/auth/password/change",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "current_password": test_user["password"],
            "new_password": "newpass123"
        })
    
    assert response.status_code == 200
    
    # Verify new password works
    login_response = client.post("/api/auth/login", json={
        "email": test_user["user"].email,
        "password": "newpass123"
    })
    assert login_response.status_code == 200
