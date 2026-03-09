def test_ml_fraud_user_requires_auth(client):
    response = client.get('/api/ml/fraud/user/1')
    assert response.status_code == 401


def test_ml_fraud_user_and_transaction(client, auth_headers, monkeypatch):
    from app.routes import ml as ml_route

    monkeypatch.setattr(ml_route.fraud_detection_service, 'analyze_user', lambda user_id: {'user_id': user_id, 'risk': 'low'})
    monkeypatch.setattr(ml_route.fraud_detection_service, 'analyze_transaction', lambda payment_id: {'payment_id': payment_id, 'risk': 'low'})

    user_resp = client.get('/api/ml/fraud/user/7', headers=auth_headers)
    tx_resp = client.get('/api/ml/fraud/transaction/11', headers=auth_headers)

    assert user_resp.status_code == 200
    assert user_resp.json['user_id'] == 7
    assert tx_resp.status_code == 200
    assert tx_resp.json['payment_id'] == 11


def test_ml_recommendations_routes(client, auth_headers, monkeypatch):
    from app.routes import ml as ml_route

    monkeypatch.setattr(ml_route.skill_recommendation_service, 'get_recommendations', lambda worker_id, top_n: [{'skill': 'plumbing', 'score': 0.9, 'worker_id': worker_id, 'top_n': top_n}])
    monkeypatch.setattr(ml_route.skill_recommendation_service, 'get_market_trends', lambda: {'top_skills': ['plumbing']})

    rec_resp = client.get('/api/ml/recommendations/skills/4?top_n=3', headers=auth_headers)
    trend_resp = client.get('/api/ml/recommendations/trends')

    assert rec_resp.status_code == 200
    assert rec_resp.json['worker_id'] == 4
    assert rec_resp.json['recommendations'][0]['top_n'] == 3
    assert trend_resp.status_code == 200
    assert trend_resp.json['top_skills'] == ['plumbing']


def test_ml_price_routes(client, auth_headers, monkeypatch):
    from app.routes import ml as ml_route

    monkeypatch.setattr(ml_route.price_optimization_service, 'get_recommended_rate', lambda worker_id, skill_id: {'worker_id': worker_id, 'skill_id': skill_id, 'rate': 1200})
    monkeypatch.setattr(ml_route.price_optimization_service, 'get_job_price_range', lambda job_id: {'job_id': job_id, 'recommended_min': 900, 'recommended_max': 1400})
    monkeypatch.setattr(ml_route.price_optimization_service, 'get_market_rate', lambda skill_id, county: {'skill_id': skill_id, 'county': county, 'avg': 1100})

    worker_resp = client.get('/api/ml/price/worker/5?skill_id=2', headers=auth_headers)
    job_resp = client.get('/api/ml/price/job/6')
    market_resp = client.get('/api/ml/price/market/8?county=Nairobi')

    assert worker_resp.status_code == 200
    assert worker_resp.json == {'worker_id': 5, 'skill_id': 2, 'rate': 1200}
    assert job_resp.status_code == 200
    assert job_resp.json['job_id'] == 6
    assert market_resp.status_code == 200
    assert market_resp.json['county'] == 'Nairobi'
