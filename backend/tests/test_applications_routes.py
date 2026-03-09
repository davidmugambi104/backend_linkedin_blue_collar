from app.models.application import ApplicationStatus
from app.models.job import JobStatus


def _create_worker_headers(client, db_session):
    from app.models.user import User, UserRole
    from app.models.worker import Worker

    user = User(
        username='otherworker',
        email='otherworker@example.com',
        role=UserRole.WORKER,
        phone='+254733333333',
    )
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()

    worker = Worker(
        user_id=user.id,
        full_name='Other Worker',
        county='Nairobi',
        hourly_rate=600,
    )
    db_session.add(worker)
    db_session.commit()

    login = client.post('/api/auth/login', json={'email': user.email, 'password': 'password123'})
    token = login.json['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_get_applications_for_worker_employer_admin(
    client,
    auth_headers,
    employer_headers,
    admin_headers,
    sample_application,
    sample_worker,
):
    worker_resp = client.get('/api/applications', headers=auth_headers)
    assert worker_resp.status_code == 200
    assert len(worker_resp.json) >= 1
    assert all(item['worker_id'] == sample_worker.id for item in worker_resp.json)

    employer_resp = client.get('/api/applications', headers=employer_headers)
    assert employer_resp.status_code == 200
    assert len(employer_resp.json) >= 1

    admin_resp = client.get('/api/applications', headers=admin_headers)
    assert admin_resp.status_code == 200
    assert len(admin_resp.json) >= 1


def test_get_applications_invalid_status(client, auth_headers, sample_worker):
    response = client.get('/api/applications?status=not_a_status', headers=auth_headers)
    assert response.status_code == 400


def test_get_application_permission_denied_for_other_worker(client, db_session, sample_application):
    other_worker_headers = _create_worker_headers(client, db_session)

    response = client.get(f'/api/applications/{sample_application.id}', headers=other_worker_headers)
    assert response.status_code == 403


def test_update_application_employer_accepts_and_job_transitions(
    client,
    employer_headers,
    sample_application,
    db_session,
):
    response = client.put(
        f'/api/applications/{sample_application.id}',
        headers=employer_headers,
        json={'status': 'accepted'},
    )

    assert response.status_code == 200
    assert response.json['status'] == 'accepted'

    db_session.refresh(sample_application)
    assert sample_application.status == ApplicationStatus.ACCEPTED
    assert sample_application.job.status == JobStatus.IN_PROGRESS


def test_update_application_worker_withdraw(client, auth_headers, sample_application, db_session):
    response = client.put(
        f'/api/applications/{sample_application.id}',
        headers=auth_headers,
        json={'status': 'withdrawn'},
    )

    assert response.status_code == 200
    assert response.json['status'] == 'withdrawn'

    db_session.refresh(sample_application)
    assert sample_application.status == ApplicationStatus.WITHDRAWN


def test_delete_application_withdraws_for_worker(client, auth_headers, sample_application, db_session):
    response = client.delete(f'/api/applications/{sample_application.id}', headers=auth_headers)

    assert response.status_code == 200
    assert response.json['message'] == 'Application withdrawn successfully'

    db_session.refresh(sample_application)
    assert sample_application.status == ApplicationStatus.WITHDRAWN


def test_get_application_stats(client, auth_headers, employer_headers, sample_application):
    worker_stats = client.get('/api/applications/stats', headers=auth_headers)
    assert worker_stats.status_code == 200
    assert worker_stats.json['total'] >= 1

    employer_stats = client.get('/api/applications/stats', headers=employer_headers)
    assert employer_stats.status_code == 200
    assert employer_stats.json['total'] >= 1
