def _create_other_user_headers(client, db_session):
    from app.models.user import User, UserRole

    user = User(
        username="otheruser",
        email="otheruser@example.com",
        role=UserRole.WORKER,
        phone="+254744444444",
    )
    user.set_password("password123")
    db_session.add(user)
    db_session.commit()

    login = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "password123"},
    )
    token = login.json["access_token"]
    return user, {"Authorization": f"Bearer {token}"}


def test_get_current_user(client, auth_headers, sample_user):
    response = client.get("/api/users/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json["id"] == sample_user.id
    assert response.json["email"] == sample_user.email


def test_update_current_user(client, auth_headers):
    response = client.put(
        "/api/users/me",
        headers=auth_headers,
        json={"phone": "+254755555555"},
    )

    assert response.status_code == 200
    assert response.json["phone"] == "+254755555555"


def test_get_user_forbidden_for_non_owner(client, db_session, auth_headers):
    other_user, _ = _create_other_user_headers(client, db_session)

    response = client.get(f"/api/users/{other_user.id}", headers=auth_headers)

    assert response.status_code == 403


def test_delete_user_by_admin_deactivates(client, admin_headers, sample_user, db_session):
    response = client.delete(f"/api/users/{sample_user.id}", headers=admin_headers)

    assert response.status_code == 200
    assert response.json["message"] == "User deactivated successfully"

    db_session.refresh(sample_user)
    assert sample_user.is_active is False
