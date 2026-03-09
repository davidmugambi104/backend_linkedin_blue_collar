import io


def test_signed_url_requires_auth(client):
    response = client.post("/api/uploads/signed-url", json={"fileName": "a.txt"})
    assert response.status_code == 401


def test_signed_url_success(client, auth_headers):
    response = client.post(
        "/api/uploads/signed-url",
        headers=auth_headers,
        json={"fileName": "invoice.pdf", "fileType": "application/pdf"},
    )

    assert response.status_code == 200
    payload = response.json
    assert payload["url"] == "/api/uploads/direct"
    assert payload["fields"]["key"].startswith("uploads/cdn/")


def test_signed_url_file_name_required(client, auth_headers):
    response = client.post("/api/uploads/signed-url", headers=auth_headers, json={"fileName": ""})
    assert response.status_code == 200
    assert response.json["fields"]["key"].endswith("upload.bin")


def test_direct_upload_requires_file(client, auth_headers):
    response = client.post("/api/uploads/direct", headers=auth_headers, data={"key": "uploads/cdn/a.txt"})
    assert response.status_code == 400


def test_direct_upload_success(client, auth_headers, monkeypatch, tmp_path):
    from app.routes import uploads as uploads_module

    monkeypatch.setattr(uploads_module, "_uploads_root", lambda: tmp_path)

    data = {
        "key": "uploads/cdn/custom-name.txt",
        "file": (io.BytesIO(b"hello world"), "original.txt"),
    }
    response = client.post(
        "/api/uploads/direct",
        headers=auth_headers,
        data=data,
        content_type="multipart/form-data",
    )

    assert response.status_code == 204
    uploaded = tmp_path / "custom-name.txt"
    assert uploaded.exists()
    assert uploaded.read_bytes() == b"hello world"
