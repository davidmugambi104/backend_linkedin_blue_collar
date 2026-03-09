def test_bulk_hire_requires_worker_ids(client, employer_headers, sample_job):
    response = client.post(
        f'/api/bulk/hire/{sample_job.id}',
        headers=employer_headers,
        json={},
    )

    assert response.status_code == 400
    assert response.json['error'] == 'No worker IDs provided'


def test_bulk_hire_success_calls_service(
    client,
    employer_headers,
    sample_job,
    sample_employer,
    monkeypatch,
):
    captured = {}

    def fake_bulk_hire(job_id, worker_ids, employer_id):
        captured['job_id'] = job_id
        captured['worker_ids'] = worker_ids
        captured['employer_id'] = employer_id
        return {'hired': len(worker_ids), 'job_id': job_id}

    monkeypatch.setattr('app.routes.bulk.bulk_service.bulk_hire', fake_bulk_hire)

    response = client.post(
        f'/api/bulk/hire/{sample_job.id}',
        headers=employer_headers,
        json={'worker_ids': [1, 2]},
    )

    assert response.status_code == 200
    assert response.json['hired'] == 2
    assert captured['employer_id'] == sample_employer.id


def test_bulk_verify_requires_admin(client, auth_headers):
    response = client.post('/api/bulk/verify', headers=auth_headers, json={'worker_ids': [1]})
    assert response.status_code == 403


def test_bulk_verify_success(client, admin_headers, monkeypatch):
    monkeypatch.setattr(
        'app.routes.bulk.bulk_service.bulk_verify_workers',
        lambda worker_ids, reviewer_id: {'verified': len(worker_ids), 'reviewer_id': reviewer_id},
    )

    response = client.post('/api/bulk/verify', headers=admin_headers, json={'worker_ids': [10, 11]})
    assert response.status_code == 200
    assert response.json['verified'] == 2


def test_bulk_messages_validation_and_success(client, auth_headers, monkeypatch):
    missing = client.post('/api/bulk/messages', headers=auth_headers, json={})
    assert missing.status_code == 400

    monkeypatch.setattr(
        'app.routes.bulk.bulk_service.bulk_send_messages',
        lambda sender_id, receiver_ids, message, job_id: {
            'sent': len(receiver_ids),
            'sender_id': sender_id,
            'job_id': job_id,
        },
    )

    success = client.post(
        '/api/bulk/messages',
        headers=auth_headers,
        json={'receiver_ids': [1, 2, 3], 'message': 'hello', 'job_id': 99},
    )
    assert success.status_code == 200
    assert success.json['sent'] == 3
