def test_docs_health(client):
    response = client.get('/api/docs/health')
    assert response.status_code == 200
    assert response.json['message'] == 'API docs route available'


def test_analytics_public_routes(client, monkeypatch):
    from app.routes import analytics as analytics_route

    monkeypatch.setattr(analytics_route.analytics_service, 'get_platform_stats', lambda: {'users': 10})
    monkeypatch.setattr(analytics_route.analytics_service, 'get_growth_metrics', lambda days: {'days': days, 'growth': 5})
    monkeypatch.setattr(analytics_route.analytics_service, 'get_skills_analytics', lambda: {'skills': ['plumbing']})
    monkeypatch.setattr(analytics_route.analytics_service, 'get_location_analytics', lambda: {'counties': ['Nairobi']})
    monkeypatch.setattr(analytics_route.analytics_service, 'get_job_analytics', lambda job_id: {'job_id': job_id, 'views': 99})

    assert client.get('/api/analytics/overview').json == {'users': 10}
    assert client.get('/api/analytics/growth?days=14').json['days'] == 14
    assert client.get('/api/analytics/skills').json == {'skills': ['plumbing']}
    assert client.get('/api/analytics/location').json == {'counties': ['Nairobi']}

    job_resp = client.get('/api/analytics/job/12')
    assert job_resp.status_code == 200
    assert job_resp.json['job_id'] == 12


def test_analytics_jwt_routes(client, auth_headers, monkeypatch):
    from app.routes import analytics as analytics_route

    monkeypatch.setattr(analytics_route.analytics_service, 'get_worker_analytics', lambda worker_id: {'worker_id': worker_id, 'jobs': 3})
    monkeypatch.setattr(analytics_route.analytics_service, 'get_worker_ranking', lambda worker_id, skill_id: {'worker_id': worker_id, 'skill_id': skill_id, 'rank': 2})
    monkeypatch.setattr(analytics_route.analytics_service, 'get_employer_analytics', lambda employer_id: {'employer_id': employer_id, 'posts': 7})

    worker_resp = client.get('/api/analytics/worker/2', headers=auth_headers)
    ranking_resp = client.get('/api/analytics/worker/2/ranking?skill_id=5', headers=auth_headers)
    employer_resp = client.get('/api/analytics/employer/3', headers=auth_headers)

    assert worker_resp.status_code == 200
    assert worker_resp.json['worker_id'] == 2
    assert ranking_resp.status_code == 200
    assert ranking_resp.json['skill_id'] == 5
    assert employer_resp.status_code == 200
    assert employer_resp.json['employer_id'] == 3
