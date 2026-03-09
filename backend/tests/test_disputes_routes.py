from app.models.dispute import Dispute, DisputeStatus


def test_create_dispute_validation_and_success(client, auth_headers, sample_job):
    missing = client.post('/api/disputes/', headers=auth_headers, json={})
    assert missing.status_code == 400

    invalid_type = client.post(
        '/api/disputes/',
        headers=auth_headers,
        json={'job_id': sample_job.id, 'dispute_type': 'invalid', 'description': 'x'},
    )
    assert invalid_type.status_code == 400

    success = client.post(
        '/api/disputes/',
        headers=auth_headers,
        json={
            'job_id': sample_job.id,
            'application_id': None,
            'dispute_type': 'payment',
            'description': 'Payment not released',
            'evidence_urls': ['https://example.com/evidence.pdf'],
        },
    )
    assert success.status_code == 201
    assert success.json['dispute']['dispute_type'] == 'payment'


def test_dispute_message_get_and_list(client, auth_headers, sample_job, db_session, sample_user):
    dispute = Dispute(
        job_id=sample_job.id,
        raised_by_user_id=sample_user.id,
        dispute_type='PAYMENT',
        description='Dispute details',
    )
    db_session.add(dispute)
    db_session.commit()

    add_missing = client.post(
        f'/api/disputes/{dispute.id}/message',
        headers=auth_headers,
        json={},
    )
    assert add_missing.status_code == 400

    add_message = client.post(
        f'/api/disputes/{dispute.id}/message',
        headers=auth_headers,
        json={'message': 'Please review', 'is_evidence': True},
    )
    assert add_message.status_code == 201

    get_dispute = client.get(f'/api/disputes/{dispute.id}', headers=auth_headers)
    assert get_dispute.status_code == 200
    assert len(get_dispute.json['messages']) == 1

    listed = client.get('/api/disputes/?status=pending', headers=auth_headers)
    assert listed.status_code == 200
    assert isinstance(listed.json['disputes'], list)


def test_resolve_dispute_admin_only(client, auth_headers, admin_headers, sample_job, db_session, sample_user):
    dispute = Dispute(
        job_id=sample_job.id,
        raised_by_user_id=sample_user.id,
        dispute_type='QUALITY',
        description='Bad work quality',
    )
    db_session.add(dispute)
    db_session.commit()

    forbidden = client.post(
        f'/api/disputes/{dispute.id}/resolve',
        headers=auth_headers,
        json={'action': 'resolve', 'resolution': 'done'},
    )
    assert forbidden.status_code == 403

    approved = client.post(
        f'/api/disputes/{dispute.id}/resolve',
        headers=admin_headers,
        json={'action': 'resolve', 'resolution': 'Refund issued'},
    )
    assert approved.status_code == 200

    db_session.refresh(dispute)
    assert dispute.status == DisputeStatus.RESOLVED
    assert dispute.resolution == 'Refund issued'
