"""
Worker tests
"""
import pytest


class TestWorkerList:
    """Test worker listing"""
    
    def test_list_workers(self, client, db_session, sample_worker, auth_headers):
        """Test listing workers"""
        response = client.get('/api/workers', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert 'workers' in data
    
    def test_list_workers_with_filters(self, client, db_session, sample_worker, sample_skill, auth_headers):
        """Test listing workers with filters"""
        # Add skill to worker first
        from app.models.worker_skill import WorkerSkill
        worker_skill = WorkerSkill(
            worker_id=sample_worker.id,
            skill_id=sample_skill.id,
            proficiency_level='expert'
        )
        db_session.add(worker_skill)
        db_session.commit()
        
        response = client.get(f'/api/workers?skill_id={sample_skill.id}', headers=auth_headers)
        
        assert response.status_code == 200


class TestWorkerDetails:
    """Test worker details"""
    
    def test_get_worker(self, client, db_session, sample_worker, auth_headers):
        """Test getting worker details"""
        response = client.get(f'/api/workers/{sample_worker.id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert data['first_name'] == sample_worker.first_name
    
    def test_get_nonexistent_worker(self, client, auth_headers):
        """Test getting non-existent worker"""
        response = client.get('/api/workers/99999', headers=auth_headers)
        
        assert response.status_code == 404


class TestWorkerUpdate:
    """Test worker profile update"""
    
    def test_update_worker(self, client, db_session, sample_worker, auth_headers):
        """Test updating worker profile"""
        response = client.put(
            f'/api/workers/{sample_worker.id}',
            headers=auth_headers,
            json={
                'first_name': 'Updated Name',
                'bio': 'New bio'
            }
        )
        
        assert response.status_code == 200
    
    def test_update_worker_skills(self, client, db_session, sample_worker, sample_skill, auth_headers):
        """Test adding skills to worker"""
        response = client.post(
            f'/api/workers/{sample_worker.id}/skills',
            headers=auth_headers,
            json={
                'skill_id': sample_skill.id,
                'proficiency_level': 'expert',
                'years_experience': 5
            }
        )
        
        assert response.status_code == 201


class TestWorkerSearch:
    """Test worker search"""
    
    def test_search_workers(self, client, db_session, sample_worker, auth_headers):
        """Test searching workers"""
        response = client.get('/api/workers/search?county=Nairobi', headers=auth_headers)
        
        assert response.status_code == 200
