from app.models.application import ApplicationStatus
from app.models.job import JobStatus
from app.models.review import Review


def test_create_review_requires_completed_job_and_accepted_application(
    client,
    employer_headers,
    sample_job,
    sample_application,
):
    not_completed = client.post(
        '/api/reviews/',
        headers=employer_headers,
        json={
            'job_id': sample_job.id,
            'rating': 5,
            'comment': 'Great work',
            'reviewee_id': sample_application.worker_id,
            'reviewer_type': 'employer',
        },
    )
    assert not_completed.status_code == 400


def test_create_update_delete_review_flow(
    client,
    employer_headers,
    admin_headers,
    sample_job,
    sample_application,
    sample_worker,
    db_session,
):
    sample_job.status = JobStatus.COMPLETED
    sample_application.status = ApplicationStatus.ACCEPTED
    db_session.commit()

    created = client.post(
        '/api/reviews/',
        headers=employer_headers,
        json={
            'job_id': sample_job.id,
            'rating': 4,
            'comment': 'Solid job',
            'reviewee_id': sample_application.worker_id,
            'reviewer_type': 'employer',
        },
    )
    assert created.status_code == 201
    review_id = created.json['id']

    duplicate = client.post(
        '/api/reviews/',
        headers=employer_headers,
        json={
            'job_id': sample_job.id,
            'rating': 5,
            'comment': 'Duplicate review',
            'reviewee_id': sample_application.worker_id,
            'reviewer_type': 'employer',
        },
    )
    assert duplicate.status_code == 400

    updated = client.put(
        f'/api/reviews/{review_id}',
        headers=employer_headers,
        json={'rating': 5, 'comment': 'Updated feedback'},
    )
    assert updated.status_code == 200
    assert updated.json['rating'] == 5

    redacted = client.delete(f'/api/reviews/{review_id}', headers=admin_headers)
    assert redacted.status_code == 200

    review = Review.query.get(review_id)
    assert review.comment == '[redacted]'

    avg = client.get(f'/api/reviews/worker/{sample_worker.id}/average')
    assert avg.status_code == 200
    assert avg.json['worker_id'] == sample_worker.id


def test_update_review_forbidden_for_worker(
    client,
    auth_headers,
    db_session,
    sample_job,
    sample_worker,
    sample_employer,
):
    review = Review(
        job_id=sample_job.id,
        worker_id=sample_worker.id,
        employer_id=sample_employer.id,
        rating=3,
        comment='Initial',
    )
    db_session.add(review)
    db_session.commit()

    response = client.put(f'/api/reviews/{review.id}', headers=auth_headers, json={'rating': 4})
    assert response.status_code == 403
