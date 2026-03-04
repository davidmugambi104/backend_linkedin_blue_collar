#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    # Update admin user (ID 1)
    admin = User.query.get(1)
    if admin:
        admin.set_password("admin123")
        admin.phone = "254111931531"
        admin.is_phone_verified = True
        db.session.commit()
        print(f"✅ Updated admin user: {admin.email} / admin123")
    
    # Update worker user (ID 67)
    worker = User.query.filter_by(email="worker@test.com").first()
    if worker:
        worker.set_password("worker123")
        worker.phone = "254712345678"
        worker.is_phone_verified = False
        db.session.commit()
        print(f"✅ Updated worker user: {worker.email} / worker123")
    
    # Update employer user (ID 65)
    employer = User.query.filter_by(email="employer@test.com").first()
    if employer:
        employer.set_password("employer123")
        employer.phone = "254723456789"
        employer.is_phone_verified = True
        db.session.commit()
        print(f"✅ Updated employer user: {employer.email} / employer123")
