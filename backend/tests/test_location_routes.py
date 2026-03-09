def test_update_location_validates_payload(client, auth_headers, sample_worker):
    missing_response = client.post("/api/location/update-location", headers=auth_headers, json={})
    assert missing_response.status_code == 400

    invalid_response = client.post(
        "/api/location/update-location",
        headers=auth_headers,
        json={"lat": 200, "lng": 10},
    )
    assert invalid_response.status_code == 400


def test_update_location_success(client, auth_headers, sample_worker, monkeypatch):
    calls = {}

    def fake_update_worker_location(worker_id, lat, lng):
        calls["worker_id"] = worker_id
        calls["lat"] = lat
        calls["lng"] = lng

    monkeypatch.setattr(
        "app.routes.location.geo_matcher.update_worker_location",
        fake_update_worker_location,
    )

    response = client.post(
        "/api/location/update-location",
        headers=auth_headers,
        json={"lat": -1.286389, "lng": 36.817223},
    )

    assert response.status_code == 200
    assert response.json["success"] is True
    assert calls["lat"] == -1.286389
    assert calls["lng"] == 36.817223


def test_get_my_location_falls_back_to_db(client, auth_headers, sample_worker, db_session, monkeypatch):
    sample_worker.location_lat = -1.2
    sample_worker.location_lng = 36.8
    db_session.commit()

    monkeypatch.setattr("app.routes.location.geo_matcher.get_worker_location", lambda _worker_id: None)

    response = client.get("/api/location/my-location", headers=auth_headers)

    assert response.status_code == 200
    assert response.json["lat"] == -1.2
    assert response.json["lng"] == 36.8


def test_nearby_jobs_requires_location(client, auth_headers, sample_worker, db_session, monkeypatch):
    sample_worker.location_lat = None
    sample_worker.location_lng = None
    db_session.commit()

    monkeypatch.setattr("app.routes.location.geo_matcher.get_worker_location", lambda _worker_id: None)

    response = client.get("/api/location/nearby-jobs", headers=auth_headers)

    assert response.status_code == 400
    assert response.json["error"] == "Location not set"


def test_nearby_workers_and_job_matches(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.routes.location.geo_matcher.get_nearby_workers",
        lambda lat, lng, radius: [{"worker_id": 1, "distance_km": 1.4}],
    )
    monkeypatch.setattr(
        "app.routes.location.geo_matcher.find_matching_workers_for_job",
        lambda job_id, limit, radius_km, min_match_score: [{"worker_id": 1, "score": 0.9}],
    )
    monkeypatch.setattr("app.routes.location.geo_matcher.broadcast_new_job", lambda _job_id: None)

    missing = client.get("/api/location/nearby-workers", headers=auth_headers)
    assert missing.status_code == 400

    nearby = client.get(
        "/api/location/nearby-workers?lat=-1.28&lng=36.81&radius=5",
        headers=auth_headers,
    )
    assert nearby.status_code == 200
    assert nearby.json["count"] == 1

    matches = client.get("/api/location/job/1/matches?radius=10&limit=5", headers=auth_headers)
    assert matches.status_code == 200
    assert matches.json["count"] == 1

    broadcast = client.post("/api/location/broadcast-job/1", headers=auth_headers)
    assert broadcast.status_code == 200
    assert broadcast.json["success"] is True
