from app.models.application import ApplicationStatus
from app.models.payment import Payment, PaymentStatus


def test_hold_payment_validation_and_success(client, employer_headers, auth_headers, sample_job, db_session):
    missing = client.post('/api/escrow/hold', headers=employer_headers, json={})
    assert missing.status_code in (400, 422)

    unauthorized = client.post(
        '/api/escrow/hold',
        headers=auth_headers,
        json={'job_id': sample_job.id, 'amount': 1000},
    )
    assert unauthorized.status_code == 403

    success = client.post(
        '/api/escrow/hold',
        headers=employer_headers,
        json={'job_id': sample_job.id, 'amount': 1000},
    )
    assert success.status_code == 201
    assert success.json['payment']['payment_type'] == 'escrow'
    assert success.json['payment']['status'] == 'pending'


def test_release_payment_paths(
    client,
    employer_headers,
    sample_job,
    sample_worker,
    sample_application,
    db_session,
):
    payment = Payment(
        user_id=sample_job.employer.user_id,
        job_id=sample_job.id,
        employer_id=sample_job.employer_id,
        amount=1500,
        payment_type='escrow',
        reference=f'escrow_{sample_job.id}_x',
        status=PaymentStatus.PENDING,
        provider='mpesa',
    )
    db_session.add(payment)
    db_session.commit()

    not_hired = client.post(
        '/api/escrow/release',
        headers=employer_headers,
        json={'job_id': sample_job.id, 'worker_id': sample_worker.id},
    )
    assert not_hired.status_code == 400

    sample_application.status = ApplicationStatus.ACCEPTED
    db_session.commit()

    released = client.post(
        '/api/escrow/release',
        headers=employer_headers,
        json={'job_id': sample_job.id, 'worker_id': sample_worker.id},
    )
    assert released.status_code == 200

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.COMPLETED
    assert payment.worker_id == sample_worker.id


def test_refund_and_get_job_escrow(client, employer_headers, sample_job, db_session):
    payment = Payment(
        user_id=sample_job.employer.user_id,
        job_id=sample_job.id,
        employer_id=sample_job.employer_id,
        amount=1800,
        payment_type='escrow',
        reference=f'escrow_{sample_job.id}_refund',
        status=PaymentStatus.PENDING,
        platform_fee=180,
        net_amount=1620,
        provider='mpesa',
    )
    db_session.add(payment)
    db_session.commit()

    get_before = client.get(f'/api/escrow/job/{sample_job.id}', headers=employer_headers)
    assert get_before.status_code == 200
    assert get_before.json['escrow']['status'] == 'pending'

    refunded = client.post('/api/escrow/refund', headers=employer_headers, json={'job_id': sample_job.id})
    assert refunded.status_code == 200

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.REFUNDED
