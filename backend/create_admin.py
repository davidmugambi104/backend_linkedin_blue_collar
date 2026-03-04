#!/usr/bin/env python3
"""
Create an admin user for the WorkForge platform.
Run this script from the backend directory.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

def create_admin_user(email, password, username="admin"):
    """Create an admin user account."""
    app = create_app()
    
    with app.app_context():
        # Check if admin already exists
        existing_admin = User.query.filter_by(email=email).first()
        if existing_admin:
            print(f"❌ User with email {email} already exists!")
            print(f"   Current role: {existing_admin.role.value}")
            
            # Update to admin if not already
            if existing_admin.role != UserRole.ADMIN:
                existing_admin.role = UserRole.ADMIN
                db.session.commit()
                print(f"✅ Updated user {email} to ADMIN role")
            return existing_admin
        
        # Create new admin user
        admin_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="User"
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Username: {username}")
        print(f"   Role: {admin_user.role.value}")
        print(f"\n🔐 You can now log in with these credentials at http://localhost:5173/login")
        
        return admin_user


if __name__ == "__main__":
    import getpass
    
    print("=" * 60)
    print("WorkForge Admin User Creation")
    print("=" * 60)
    
    # Get admin details
    email = input("\nEnter admin email: ").strip()
    if not email:
        print("❌ Email is required!")
        sys.exit(1)
    
    username = input("Enter admin username (default: admin): ").strip() or "admin"
    
    password = getpass.getpass("Enter admin password: ")
    if not password or len(password) < 6:
        print("❌ Password must be at least 6 characters!")
        sys.exit(1)
    
    confirm_password = getpass.getpass("Confirm password: ")
    if password != confirm_password:
        print("❌ Passwords do not match!")
        sys.exit(1)
    
    # Create the admin user
    try:
        create_admin_user(email, password, username)
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        sys.exit(1)
