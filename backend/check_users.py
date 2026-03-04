#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import create_app, db
from app.models.user import User, UserRole

app = create_app()
with app.app_context():
    users = User.query.all()
    print(f"Found {len(users)} users:\n")
    for u in users:
        print(f"  ID: {u.id} | Username: {u.username} | Email: {u.email} | Role: {u.role.value} | Phone: {u.phone} | Verified: {u.is_phone_verified}")
