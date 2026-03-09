"""
Worker tests
"""
import pytest
from app.models.job import JobStatus


class TestWorkerList:
    """Test worker listing"""
    
    def test_list_workers(self, client, db_session, sample_worker, auth_headers):
        """Test listing workers"""
        response = client.get('/api/workers', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert isinstance(data, list)
    
    def test_list_workers_with_filters(self, client, db_session, sample_worker, sample_skill, auth_headers):
        """Test listing workers with filters"""
        # Add skill to worker first
        from app.models.worker_skill import WorkerSkill
        worker_skill = WorkerSkill(
            worker_id=sample_worker.id,
            skill_id=sample_skill.id,
            proficiency_level=5
        )
        db_session.add(worker_skill)
        db_session.commit()
        
        response = client.get(f'/api/workers/search?skill_ids={sample_skill.id}', headers=auth_headers)
        
        assert response.status_code == 200


class TestWorkerDetails:
    """Test worker details"""
    
    def test_get_worker(self, client, db_session, sample_worker, auth_headers):
        """Test getting worker profile"""
        response = client.get('/api/workers/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json
        assert data['full_name'] == sample_worker.full_name
    
    def test_get_nonexistent_worker(self, client, auth_headers):
        """Current API does not expose worker-by-id detail route"""
        response = client.get('/api/workers/99999', headers=auth_headers)
        
        assert response.status_code in (404, 405)


class TestWorkerUpdate:
    """Test worker profile update"""
    
    def test_update_worker(self, client, db_session, sample_worker, auth_headers):
        """Test updating worker profile"""
        response = client.put(
            '/api/workers/profile',
            headers=auth_headers,
            json={
                'full_name': 'Updated Name',
                'bio': 'New bio'
            }
        )
        
        assert response.status_code == 200
    
    def test_update_worker_skills(self, client, db_session, sample_worker, sample_skill, auth_headers):
        """Test adding skills to worker"""
        response = client.post(
            '/api/workers/skills',
            headers=auth_headers,
            json={
                'skill_id': sample_skill.id,
                'proficiency_level': 5
            }
        )
        
        assert response.status_code == 201


class TestWorkerSearch:
    """Test worker search"""
    
    def test_search_workers(self, client, db_session, sample_worker, auth_headers):
        """Test searching workers"""
        response = client.get('/api/workers/search?county=Nairobi', headers=auth_headers)
        
        assert response.status_code == 200


class TestWorkerAdditionalCoverage:
    def test_add_worker_skill_invalid_skill(self, client, auth_headers, sample_worker):
        response = client.post(
            '/api/workers/skills',
            headers=auth_headers,
            json={'skill_id': 999999, 'proficiency_level': 4},
        )

        assert response.status_code == 400
        assert response.json['error'] == 'Skill does not exist'

    def test_add_duplicate_update_and_delete_worker_skill(
        self,
        client,
        db_session,
        sample_worker,
        sample_skill,
        auth_headers,
    ):
        add_response = client.post(
            '/api/workers/skills',
            headers=auth_headers,
            json={'skill_id': sample_skill.id, 'proficiency_level': 3},
        )
        assert add_response.status_code == 201

        duplicate_response = client.post(
            '/api/workers/skills',
            headers=auth_headers,
            json={'skill_id': sample_skill.id, 'proficiency_level': 5},
        )
        assert duplicate_response.status_code == 400

        update_response = client.put(
            f'/api/workers/skills/{sample_skill.id}',
            headers=auth_headers,
            json={'skill_id': sample_skill.id, 'proficiency_level': 5},
        )
        assert update_response.status_code == 200
        assert update_response.json['proficiency_level'] == 5

        delete_response = client.delete(
            f'/api/workers/skills/{sample_skill.id}',
            headers=auth_headers,
        )
        assert delete_response.status_code == 200

    def test_recommended_jobs_and_match_endpoint(
        self,
        client,
        db_session,
        sample_worker,
        sample_job,
        sample_skill,
        auth_headers,
        monkeypatch,
    ):
        from app.models.worker_skill import WorkerSkill

        sample_worker.location_lat = -1.28
        sample_worker.location_lng = 36.81
        sample_job.location_lat = -1.29
        sample_job.location_lng = 36.82
        db_session.add(
            WorkerSkill(worker_id=sample_worker.id, skill_id=sample_skill.id, proficiency_level=4)
        )
        db_session.commit()

        recommended = client.get('/api/workers/jobs/recommended', headers=auth_headers)
        assert recommended.status_code == 200
        assert isinstance(recommended.json, list)

        monkeypatch.setattr(
            'app.routes.workers.MatchingService._calculate_worker_match_score',
            lambda worker, job, worker_skill: 0.876,
        )
        match_response = client.get(f'/api/workers/match/jobs/{sample_job.id}', headers=auth_headers)
        assert match_response.status_code == 200
        assert match_response.json['match_score'] == 0.876

    def test_match_endpoint_non_open_job(self, client, db_session, sample_worker, sample_job, auth_headers):
        sample_job.status = JobStatus.COMPLETED
        db_session.commit()

        response = client.get(f'/api/workers/match/jobs/{sample_job.id}', headers=auth_headers)
        assert response.status_code == 400
        assert response.json['error'] == 'Job is not open'

    def test_search_workers_filter_parsing(self, client, sample_skill, monkeypatch):
        captured = {}

        def fake_search_workers(filters):
            captured['filters'] = filters
            return []

        monkeypatch.setattr('app.routes.workers.MatchingService.search_workers', fake_search_workers)

        response = client.get(
            f'/api/workers/search?skill_ids={sample_skill.id}&availability_status=available&county=Nairobi&min_rating=4.5&verified_only=true&max_rate=1200&location_lat=-1.28&location_lng=36.81&max_distance_km=15'
        )

        assert response.status_code == 200
        assert captured['filters']['skill_ids'] == [sample_skill.id]
        assert captured['filters']['verified_only'] is True
        assert captured['filters']['max_distance_km'] == 15.0
