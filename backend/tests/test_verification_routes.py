from datetime import datetime, timedelta
from io import BytesIO


def test_send_and_verify_code_flow(client, db_session, monkeypatch):
    sent = {}

    def fake_send_sms(phone, message):
        sent["phone"] = phone
        sent["message"] = message
        return {"success": True}

    monkeypatch.setattr("app.routes.verification.sms_service.send_sms", fake_send_sms)

    send_response = client.post(
        "/api/verification/send-code",
        json={"phone": "0712345678", "purpose": "phone_verify"},
    )
    assert send_response.status_code == 200
    assert sent["phone"] == "254712345678"

    from app.models.verification import VerificationCode

    record = VerificationCode.query.filter_by(phone="254712345678", purpose="phone_verify").first()
    assert record is not None

    verify_response = client.post(
        "/api/verification/verify-code",
        json={"phone": "0712345678", "code": record.code, "purpose": "phone_verify"},
    )
    assert verify_response.status_code == 200
    assert verify_response.json["verified"] is True


def test_verify_phone_for_authenticated_user(client, auth_headers, db_session, sample_user):
    from app.models.verification import VerificationCode

    code = VerificationCode(
        phone="254712345678",
        code="123456",
        purpose="phone_verify",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db_session.add(code)
    db_session.commit()

    response = client.post("/api/verification/verify-phone", headers=auth_headers, json={"code": "123456"})
    assert response.status_code == 200
    assert response.json["verified"] is True

    db_session.refresh(sample_user)
    assert sample_user.is_phone_verified is True


def test_upload_document_validation_and_success(client, auth_headers, sample_worker, monkeypatch, tmp_path):
    monkeypatch.setattr("app.routes.verification.UPLOAD_FOLDER", str(tmp_path))

    missing_file = client.post("/api/verification/document/upload", headers=auth_headers)
    assert missing_file.status_code == 400

    invalid = client.post(
        "/api/verification/document/upload",
        headers=auth_headers,
        data={"file": (BytesIO(b"bad"), "malware.exe"), "document_type": "id_card"},
        content_type="multipart/form-data",
    )
    assert invalid.status_code == 400

    success = client.post(
        "/api/verification/document/upload",
        headers=auth_headers,
        data={"file": (BytesIO(b"pdfcontent"), "id_card.pdf"), "document_type": "id_card"},
        content_type="multipart/form-data",
    )
    assert success.status_code == 201
    assert success.json["document"]["status"] == "pending"


def test_admin_queue_and_review_document(client, auth_headers, admin_headers, sample_worker, db_session):
    from app.models.verification import DocumentVerification

    sample_worker.verification_score = 30
    db_session.commit()

    doc = DocumentVerification(
        worker_id=sample_worker.id,
        verification_type="id_card",
        document_url="uploads/verification/test.pdf",
        status="pending",
    )
    db_session.add(doc)
    db_session.commit()

    forbidden = client.get("/api/verification/admin/queue", headers=auth_headers)
    assert forbidden.status_code == 403

    queue = client.get("/api/verification/admin/queue", headers=admin_headers)
    assert queue.status_code == 200
    assert queue.json["total"] >= 1

    review = client.put(
        f"/api/verification/admin/review/{doc.id}",
        headers=admin_headers,
        json={"action": "approve", "notes": "All good"},
    )
    assert review.status_code == 200

    db_session.refresh(doc)
    db_session.refresh(sample_worker)
    assert doc.status == "approved"
    assert sample_worker.verification_score >= 55
    assert sample_worker.is_verified is True
