def test_jobs_context_self_returns_messages(client, auth_headers, sample_user):
    response = client.get(f"/api/jobs/context/{sample_user.id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json["profile_url"] == "/messages"
    assert response.json["job_context"] is None


def test_jobs_context_worker_profile_without_application(client, auth_headers, db_session):
    from app.models.user import User, UserRole
    from app.models.worker import Worker

    other_user = User(
        username="anotherworker",
        email="anotherworker@example.com",
        role=UserRole.WORKER,
        phone="+254711111111",
    )
    other_user.set_password("password123")
    db_session.add(other_user)
    db_session.commit()

    other_worker = Worker(
        user_id=other_user.id,
        full_name="Another Worker",
        county="Nairobi",
        hourly_rate=700,
    )
    db_session.add(other_worker)
    db_session.commit()

    response = client.get(f"/api/jobs/context/{other_user.id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json["profile_url"] == f"/workers/{other_worker.id}"
    assert response.json["job_context"] is None


def test_jobs_context_employer_to_worker_with_application(
    client,
    employer_headers,
    sample_user,
    sample_application,
):
    response = client.get(f"/api/jobs/context/{sample_user.id}", headers=employer_headers)

    assert response.status_code == 200
    data = response.json
    assert data["profile_url"].startswith("/workers/")
    assert data["job_context"] is not None
    assert data["job_context"]["id"] == sample_application.job_id
    assert isinstance(data["job_context"]["match_percentage"], int)


def test_jobs_context_worker_to_employer_with_application(
    client,
    auth_headers,
    sample_employer,
    sample_application,
):
    response = client.get(f"/api/jobs/context/{sample_employer.user_id}", headers=auth_headers)

    assert response.status_code == 200
    data = response.json
    assert data["profile_url"] == f"/jobs?employer_id={sample_employer.id}"
    assert data["job_context"] is not None
    assert data["job_context"]["id"] == sample_application.job_id
