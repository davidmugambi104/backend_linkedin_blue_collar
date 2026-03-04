# ----- FILE: backend/tests/conftest.py -----
import pytest
from app import create_app
from app.extensions import db
from app.models import User, Worker, Employer, Skill
from app.models.user import UserRole
import bcrypt


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app("testing")
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def db_session(app):
    """Create database session for testing."""
    with app.app_context():
        yield db.session


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    password = "testpass123"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=hashed,
        role=UserRole.WORKER,
        phone="+254700000001"
    )
    db_session.add(user)
    db_session.commit()
    
    return {"user": user, "password": password}


@pytest.fixture
def test_worker(db_session, test_user):
    """Create a test worker."""
    worker = Worker(
        user_id=test_user["user"].id,
        full_name="Test Worker",
        phone="+254700000001"
    )
    db_session.add(worker)
    db_session.commit()
    
    return worker


@pytest.fixture
def test_skill(db_session):
    """Create a test skill."""
    skill = Skill(
        name="Carpenter",
        category="construction",
        description="Wood working"
    )
    db_session.add(skill)
    db_session.commit()
    
    return skill


@pytest.fixture
def auth_token(client, test_user):
    """Get authentication token."""
    response = client.post("/api/auth/login", json={
        "email": test_user["user"].email,
        "password": test_user["password"]
    })
    return response.json["access_token"]
