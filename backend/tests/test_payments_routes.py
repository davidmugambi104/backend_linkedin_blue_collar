from app.models.payment import Payment, PaymentStatus


def test_deposit_validation_and_success(client, auth_headers, db_session, sample_user, monkeypatch):
    missing = client.post("/api/payments/deposit", headers=auth_headers, json={})
    assert missing.status_code == 400

    monkeypatch.setattr(
        "app.routes.payments.mpesa_service.stk_push",
        lambda phone, amount, reference, description: {
            "success": True,
            "checkout_request_id": "chk_123",
            "mock": True,
        },
    )

    success = client.post(
        "/api/payments/deposit",
        headers=auth_headers,
        json={"phone": "+254712345678", "amount": 150},
    )
    assert success.status_code == 200
    assert success.json["checkout_request_id"] == "chk_123"

    payment = Payment.query.filter_by(user_id=sample_user.id, provider_reference="chk_123").first()
    assert payment is not None
    assert payment.status == PaymentStatus.PENDING


def test_withdraw_failure_sets_failed(client, auth_headers, db_session, sample_user, monkeypatch):
    monkeypatch.setattr(
        "app.routes.payments.mpesa_service.b2c_payment",
        lambda phone, amount, remark: {"success": False, "error": "Insufficient balance"},
    )

    response = client.post(
        "/api/payments/withdraw",
        headers=auth_headers,
        json={"phone": "+254712345678", "amount": 100},
    )

    assert response.status_code == 400
    assert "error" in response.json

    payment = Payment.query.filter_by(user_id=sample_user.id, payment_type="withdrawal").first()
    assert payment is not None
    assert payment.status == PaymentStatus.FAILED


def test_check_payment_status_updates_record(client, auth_headers, db_session, sample_user, monkeypatch):
    payment = Payment(
        user_id=sample_user.id,
        amount=250,
        payment_type="deposit",
        reference="dep_ref_1",
        status=PaymentStatus.PENDING,
        provider="mpesa",
        provider_reference="chk_done",
        phone="+254700000000",
    )
    db_session.add(payment)
    db_session.commit()

    monkeypatch.setattr(
        "app.routes.payments.mpesa_service.check_transaction_status",
        lambda checkout_request_id: {"result_code": "0", "checkout_request_id": checkout_request_id},
    )

    response = client.get("/api/payments/status/chk_done", headers=auth_headers)
    assert response.status_code == 200

    db_session.refresh(payment)
    assert payment.status == PaymentStatus.COMPLETED


def test_get_payment_not_found_for_other_user(client, employer_headers, db_session, sample_user):
    payment = Payment(
        user_id=sample_user.id,
        amount=75,
        payment_type="deposit",
        reference="dep_ref_other",
        status=PaymentStatus.PENDING,
        provider="mpesa",
        phone="+254700000000",
    )
    db_session.add(payment)
    db_session.commit()

    response = client.get(f"/api/payments/{payment.id}", headers=employer_headers)
    assert response.status_code == 404
