from app.models.application import ApplicationStatus


def test_employer_profile_get_and_update(client, employer_headers):
    get_response = client.get("/api/employers/profile", headers=employer_headers)
    assert get_response.status_code == 200

    update_response = client.put(
        "/api/employers/profile",
        headers=employer_headers,
        json={"company_name": "Updated Company Ltd"},
    )
    assert update_response.status_code == 200
    assert update_response.json["company_name"] == "Updated Company Ltd"


def test_create_job_invalid_skill_returns_400(client, employer_headers):
    response = client.post(
        "/api/employers/jobs",
        headers=employer_headers,
        json={
            "title": "Short Plumbing Job",
            "description": "Need quick fix",
            "required_skill_id": 999999,
        },
    )

    assert response.status_code == 400
    assert response.json["error"] == "Skill does not exist"


def test_get_job_forbidden_for_non_owner(client, auth_headers, sample_job):
    response = client.get(f"/api/employers/jobs/{sample_job.id}", headers=auth_headers)
    assert response.status_code == 403


def test_update_job_invalid_status_returns_400(client, employer_headers, sample_job):
    response = client.put(
        f"/api/employers/jobs/{sample_job.id}",
        headers=employer_headers,
        json={"status": "not_real"},
    )

    assert response.status_code == 400
    assert response.json["error"] == "Invalid job update data"
    assert "status" in response.json["details"]


def test_update_application_status_and_stats(
    client,
    employer_headers,
    sample_application,
    db_session,
):
    update_response = client.put(
        f"/api/employers/applications/{sample_application.id}",
        headers=employer_headers,
        json={"status": "accepted"},
    )
    assert update_response.status_code == 200

    db_session.refresh(sample_application)
    assert sample_application.status == ApplicationStatus.ACCEPTED

    stats_response = client.get("/api/employers/stats", headers=employer_headers)
    assert stats_response.status_code == 200
    assert stats_response.json["total_jobs"] >= 1
    assert stats_response.json["total_applications"] >= 1
