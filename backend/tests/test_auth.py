"""
Authentication tests
"""
import pytest
from app.models.user import UserRole


class TestRegistration:
    """Test user registration"""
    
    def test_register_worker_success(self, client, db_session):
        """Test successful worker registration"""
        response = client.post('/api/auth/register', json={
            'username': 'newworker',
            'email': 'newworker@example.com',
            'password': 'password123',
            'role': 'worker',
            'phone': '+254712345678'
        })
        
        assert response.status_code == 201
        data = response.json
        assert data['message'] == 'User created successfully'
        assert data['user']['username'] == 'newworker'
        assert data['user']['role'] == 'worker'
    
    def test_register_employer_success(self, client, db_session):
        """Test successful employer registration"""
        response = client.post('/api/auth/register', json={
            'username': 'newemployer',
            'email': 'newemployer@example.com',
            'password': 'password123',
            'role': 'employer',
            'phone': '+254798765432'
        })
        
        assert response.status_code == 201
        data = response.json
        assert data['user']['role'] == 'employer'
    
    def test_register_duplicate_email(self, client, db_session, sample_user):
        """Test registration with duplicate email fails"""
        response = client.post('/api/auth/register', json={
            'username': 'otheruser',
            'email': sample_user.email,  # Already exists
            'password': 'password123',
            'role': 'worker'
        })
        
        assert response.status_code != 201
    
    def test_register_invalid_role(self, client, db_session):
        """Test registration with invalid role fails"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'role': 'invalid_role'
        })
        
        assert response.status_code == 400
    
    def test_register_missing_fields(self, client, db_session):
        """Test registration with missing required fields"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser'
            # Missing email, password, role
        })
        
        assert response.status_code == 400


class TestLogin:
    """Test user login"""
    
    def test_login_success(self, client, db_session, sample_user):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.json
        assert 'access_token' in data
        assert 'refresh_token' in data
        assert data['user']['email'] == sample_user.email
    
    def test_login_wrong_password(self, client, db_session, sample_user):
        """Test login with wrong password"""
        response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        assert 'error' in response.json
    
    def test_login_nonexistent_email(self, client, db_session):
        """Test login with non-existent email"""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 401
    
    def test_login_deactivated_user(self, client, db_session, sample_user):
        """Test login with deactivated account"""
        sample_user.is_active = False
        db_session.commit()
        
        response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'password123'
        })
        
        assert response.status_code == 403


class TestLogout:
    """Test user logout"""
    
    def test_logout_success(self, client, auth_headers):
        """Test successful logout"""
        response = client.post('/api/auth/logout', headers=auth_headers)
        
        assert response.status_code == 200
        assert 'message' in response.json
    
    def test_logout_without_token(self, client):
        """Test logout without token"""
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 401


class TestPasswordReset:
    """Test password reset"""
    
    def test_password_reset_request(self, client, db_session, sample_user):
        """Test password reset request"""
        response = client.post('/api/auth/password-reset/request', json={
            'email': sample_user.email
        })
        
        assert response.status_code == 200
    
    def test_password_reset_nonexistent_email(self, client, db_session):
        """Test password reset for non-existent email"""
        response = client.post('/api/auth/password-reset/request', json={
            'email': 'nonexistent@example.com'
        })
        
        # Should still return success to prevent email enumeration
        assert response.status_code == 200


class TestRefreshToken:
    """Test token refresh"""
    
    def test_refresh_token(self, client, sample_user):
        """Test token refresh"""
        # Login first to get refresh token
        login_response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'password123'
        })
        refresh_token = login_response.json['refresh_token']
        
        # Use refresh token
        response = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        
        assert response.status_code == 200
        assert 'access_token' in response.json
