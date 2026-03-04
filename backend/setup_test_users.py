#!/usr/bin/env python3
"""
Create test users for verification flow testing.
Run from backend directory: ./venv/bin/python setup_test_users.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.employer import Employer
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Check if users already exist
    admin = User.query.filter_by(email="admin@workforge.com").first()
    worker = User.query.filter_by(email="worker@test.com").first()
    employer = User.query.filter_by(email="employer@test.com").first()
    
    if not admin:
        admin = User(
            username="admin",
            email="admin@workforge.com",
            password_hash=generate_password_hash("admin123"),
            role=UserRole.ADMIN,
            phone="254111931531",
            is_phone_verified=True
        )
        db.session.add(admin)
        print("✅ Created admin user: admin@workforge.com / admin123")
    else:
        print("⚠️  Admin user already exists")
    
    if not worker:
        worker_user = User(
            username="testworker",
            email="worker@test.com",
            password_hash=generate_password_hash("worker123"),
            role=UserRole.WORKER,
            phone="254712345678",
            is_phone_verified=False
        )
        db.session.add(worker_user)
        db.session.flush()
        
        worker_profile = Worker(
            user_id=worker_user.id,
            bio="Skilled fundi ready for work",
            location_lat=-1.2921,
            location_lng=36.8219,
            location_name="Nairobi, Kenya",
            verification_score=0,
            is_verified=False
        )
        db.session.add(worker_profile)
        print("✅ Created worker user: worker@test.com / worker123")
    else:
        print("⚠️  Worker user already exists")
    
    if not employer:
        employer_user = User(
            username="testemployer",
            email="employer@test.com",
            password_hash=generate_password_hash("employer123"),
            role=UserRole.EMPLOYER,
            phone="254723456789",
            is_phone_verified=True
        )
        db.session.add(employer_user)
        db.session.flush()
        
        employer_profile = Employer(
            user_id=employer_user.id,
            company_name="Test Construction Co",
            description="We hire skilled fundis",
            location_lat=-1.2921,
            location_lng=36.8219,
            location_name="Nairobi, Kenya"
        )
        db.session.add(employer_profile)
        print("✅ Created employer user: employer@test.com / employer123")
    else:
        print("⚠️  Employer user already exists")
    
    db.session.commit()
    print("\n🎉 Test users ready!")
    print("\nLogin credentials:")
    print("  Admin:   admin@workforge.com / admin123")
    print("  Worker:  worker@test.com / worker123")
    print("  Employer: employer@test.com / employer123")
