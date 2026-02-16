#!/usr/bin/env python
"""Database seeding script"""
from app import create_app
from app.seed import seed_database

if __name__ == '__main__':
    print("Starting database seeding...")
    app = create_app()
    with app.app_context():
        try:
            seed_database()
            print("\n✅ Database seeded successfully with sample data!")
        except Exception as e:
            print(f"\n❌ Error seeding database: {e}")
            import traceback
            traceback.print_exc()
