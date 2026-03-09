"""
Pytest fixtures for WorkForge tests
"""
import pytest
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.employer import Employer
from app.models.job import Job
from app.models.application import Application
from app.models.skill import Skill
from app.models.job import JobStatus
from app.models.application import ApplicationStatus


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key-with-at-least-thirty-two-bytes-length'
    app.config['WTF_CSRF_ENABLED'] = False
    
    yield app


@pytest.fixture(scope='function')
def client(app):
    """Test client"""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Database session with automatic rollback"""
    with app.app_context():
        db.create_all()
        yield db.session
        db.session.remove()
        db.drop_all()


@pytest.fixture
def sample_user(db_session):
    """Create a sample user"""
    user = User(
        username='testuser',
        email='test@example.com',
        role=UserRole.WORKER,
        phone='+254712345678'
    )
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def sample_worker(db_session, sample_user):
    """Create a sample worker profile"""
    worker = Worker(
        user_id=sample_user.id,
        full_name='John Doe',
        county='Nairobi',
        years_experience=5,
        hourly_rate=800,
        is_verified=True,
        average_rating=4.5
    )
    db_session.add(worker)
    db_session.commit()
    return worker


@pytest.fixture
def sample_employer(db_session):
    """Create a sample employer"""
    # Create user first
    user = User(
        username='testemployer',
        email='employer@example.com',
        role=UserRole.EMPLOYER,
        phone='+254798765432'
    )
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()
    
    employer = Employer(
        user_id=user.id,
        company_name='Test Company Ltd',
        county='Nairobi'
    )
    db_session.add(employer)
    db_session.commit()
    return employer


@pytest.fixture
def sample_skill(db_session):
    """Create a sample skill"""
    skill = Skill(
        name='Pipe Fitting',
        category='plumbing'
    )
    db_session.add(skill)
    db_session.commit()
    return skill


@pytest.fixture
def sample_job(db_session, sample_employer, sample_skill):
    """Create a sample job"""
    job = Job(
        employer_id=sample_employer.id,
        title='Need plumber for bathroom',
        description='Looking for experienced plumber',
        required_skill_id=sample_skill.id,
        county='Nairobi',
        sub_county='Westlands',
        start_date=datetime(2026, 4, 1).date(),
        pay_type='fixed',
        pay_min=5000,
        pay_max=10000,
        status=JobStatus.OPEN
    )
    db_session.add(job)
    db_session.commit()
    return job


@pytest.fixture
def sample_application(db_session, sample_job, sample_worker):
    """Create a sample application"""
    application = Application(
        job_id=sample_job.id,
        worker_id=sample_worker.id,
        status=ApplicationStatus.PENDING,
        proposed_rate=8000
    )
    db_session.add(application)
    db_session.commit()
    return application


@pytest.fixture
def auth_headers(client, sample_user):
    """Get authentication headers for sample user"""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def employer_headers(client, sample_employer):
    """Get authentication headers for sample employer user"""
    response = client.post('/api/auth/login', json={
        'email': 'employer@example.com',
        'password': 'password123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def admin_user(db_session):
    """Create an admin user"""
    user = User(
        username='admin',
        email='admin@workforge.com',
        role=UserRole.ADMIN,
        phone='+254700000000'
    )
    user.set_password('admin123')
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def admin_headers(client, admin_user):
    """Get authentication headers for admin"""
    response = client.post('/api/auth/login', json={
        'email': 'admin@workforge.com',
        'password': 'admin123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}
