# ----- FILE: backend/tests/test_jobs.py -----
import pytest
from app.models import Job, Application
from app.models.job import JobStatus
from app.models.user import UserRole


@pytest.fixture
def employer_user(db_session):
    """Create an employer user."""
    import bcrypt
    hashed = bcrypt.hashpw(b"emppass123".encode(), bcrypt.gensalt()).decode()
    
    user = User(
        username="employer1",
        email="employer@test.com",
        password_hash=hashed,
        role=UserRole.EMPLOYER,
        phone="+254700000002"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def employer(db_session, employer_user):
    """Create an employer profile."""
    from app.models import Employer
    employer = Employer(
        user_id=employer_user.id,
        company_name="Test Company"
    )
    db_session.add(employer)
    db_session.commit()
    return employer


def test_create_job(client, auth_token, employer, test_skill):
    """Test job creation."""
    response = client.post("/api/employers/jobs",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Need Carpenter",
            "description": "Build furniture",
            "required_skill_id": test_skill.id,
            "pay_min": 500,
            "pay_max": 1000,
            "pay_type": "daily",
            "address": "Nairobi"
        })
    
    assert response.status_code == 201
    assert response.json["title"] == "Need Carpenter"


def test_list_jobs(client, employer, test_skill, db_session):
    """Test listing jobs."""
    # Create a job
    job = Job(
        employer_id=employer.id,
        title="Test Job",
        description="Test description",
        required_skill_id=test_skill.id,
        pay_min=500,
        pay_max=1000,
        status=JobStatus.OPEN
    )
    db_session.add(job)
    db_session.commit()
    
    response = client.get("/api/jobs/")
    assert response.status_code == 200
    assert len(response.json) > 0


def test_search_jobs(client, employer, test_skill, db_session):
    """Test job search with filters."""
    job = Job(
        employer_id=employer.id,
        title="Carpenter Needed",
        description="Skilled carpenter",
        required_skill_id=test_skill.id,
        pay_min=500,
        pay_max=1000,
        status=JobStatus.OPEN,
        county="Nairobi"
    )
    db_session.add(job)
    db_session.commit()
    
    response = client.get(f"/api/jobs/search?county=Nairobi&skill_id={test_skill.id}")
    assert response.status_code == 200


def test_apply_to_job(client, auth_token, employer, test_worker, test_skill, db_session):
    """Test applying to a job."""
    # Create job
    job = Job(
        employer_id=employer.id,
        title="Test Job",
        description="Test",
        required_skill_id=test_skill.id,
        status=JobStatus.OPEN
    )
    db_session.add(job)
    db_session.commit()
    
    # Apply
    response = client.post(f"/api/jobs/{job.id}/apply",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"cover_letter": "I'm interested"})
    
    assert response.status_code == 201


def test_job_match_score(client, auth_token, employer, test_worker, test_skill, db_session):
    """Test worker matching to job."""
    # Create job
    job = Job(
        employer_id=employer.id,
        title="Test Job",
        description="Test",
        required_skill_id=test_skill.id,
        status=JobStatus.OPEN,
        pay_min=500,
        pay_max=1000
    )
    db_session.add(job)
    db_session.commit()
    
    # Get matches
    response = client.get(f"/api/jobs/match/workers/{job.id}",
        headers={"Authorization": f"Bearer {auth_token}"})
    
    assert response.status_code == 200
