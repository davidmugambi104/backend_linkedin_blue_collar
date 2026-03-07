"""
Job tests
"""
import pytest
from datetime import datetime, timedelta


class TestJobList:
    """Test job listing"""
    
    def test_list_jobs(self, client, db_session, sample_job):
        """Test listing jobs"""
        response = client.get('/api/jobs')
        
        assert response.status_code == 200
        data = response.json
        assert 'jobs' in data
    
    def test_list_jobs_with_filters(self, client, db_session, sample_job, sample_skill):
        """Test listing jobs with filters"""
        response = client.get(f'/api/jobs?skill_id={sample_skill.id}&county=Nairobi')
        
        assert response.status_code == 200


class TestJobDetails:
    """Test job details"""
    
    def test_get_job(self, client, db_session, sample_job):
        """Test getting job details"""
        response = client.get(f'/api/jobs/{sample_job.id}')
        
        assert response.status_code == 200
        data = response.json
        assert data['title'] == sample_job.title
    
    def test_get_nonexistent_job(self, client):
        """Test getting non-existent job"""
        response = client.get('/api/jobs/99999')
        
        assert response.status_code == 404


class TestJobCreate:
    """Test job creation"""
    
    def test_create_job(self, client, db_session, sample_employer, auth_headers):
        """Test creating a job"""
        response = client.post(
            '/api/jobs',
            headers=auth_headers,
            json={
                'employer_id': sample_employer.id,
                'title': 'New Job',
                'description': 'Job description',
                'skill_id': 1,
                'county': 'Nairobi',
                'sub_county': 'Westlands',
                'start_date': '2026-04-01',
                'payment_type': 'fixed',
                'budget_min': 5000,
                'budget_max': 10000
            }
        )
        
        assert response.status_code == 201
    
    def test_create_job_unauthorized(self, client, db_session):
        """Test creating job without auth"""
        response = client.post('/api/jobs', json={})
        
        assert response.status_code == 401


class TestJobUpdate:
    """Test job update"""
    
    def test_update_job(self, client, db_session, sample_job, auth_headers):
        """Test updating job"""
        response = client.put(
            f'/api/jobs/{sample_job.id}',
            headers=auth_headers,
            json={
                'title': 'Updated Title',
                'budget_min': 6000
            }
        )
        
        assert response.status_code == 200


class TestJobApply:
    """Test job application"""
    
    def test_apply_for_job(self, client, db_session, sample_job, sample_worker, auth_headers):
        """Test applying for a job"""
        response = client.post(
            f'/api/jobs/{sample_job.id}/apply',
            headers=auth_headers,
            json={
                'cover_note': 'I am interested in this job',
                'proposed_rate': 8000
            }
        )
        
        assert response.status_code == 201
    
    def test_apply_twice(self, client, db_session, sample_job, sample_worker, auth_headers, sample_application):
        """Test applying twice for same job"""
        response = client.post(
            f'/api/jobs/{sample_job.id}/apply',
            headers=auth_headers,
            json={'proposed_rate': 8000}
        )
        
        assert response.status_code != 201


class TestJobMatch:
    """Test job matching"""
    
    def test_get_job_matches(self, client, db_session, sample_job, sample_worker, auth_headers):
        """Test getting job matches"""
        response = client.get(
            f'/api/jobs/{sample_job.id}/match',
            headers=auth_headers
        )
        
        assert response.status_code == 200
