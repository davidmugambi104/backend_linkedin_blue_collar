# ----- FILE: backend/app/seed.py -----
from app import create_app
from decimal import Decimal
from app.extensions import db
from app.models import (
    User,
    Worker,
    Employer,
    Skill,
    WorkerSkill,
    Job,
    Application,
    Review,
    Message,
    Verification,
    Payment,   
)
from datetime import datetime, timedelta
import random
from sqlalchemy import text


import uuid
from datetime import datetime, timedelta
from faker import Faker
from flask import Flask
from app.models.user import UserRole
from app.models.application import ApplicationStatus
from app.models.job import JobStatus
from app.models.payment import PaymentStatus
from app.models.verification import VerificationStatus

# Initialize Faker
fake = Faker()

# Configuration
NUM_USERS = 50
NUM_WORKERS = 30
NUM_EMPLOYERS = 19  # 50 - 30 workers - 1 admin = 19 employers
NUM_SKILLS = 25
NUM_JOBS = 80
NUM_APPLICATIONS = 150
NUM_REVIEWS = 40
NUM_MESSAGES = 200
NUM_VERIFICATIONS = 25
NUM_PAYMENTS = 35

# Predefined realistic skills by category
PREDEFINED_SKILLS = {
    'construction': [
        'Carpentry', 'Plumbing', 'Electrical Work', 'Masonry', 'Painting',
        'Drywall Installation', 'Flooring', 'Roofing', 'HVAC', 'General Labor'
    ],
    'cleaning': [
        'House Cleaning', 'Commercial Cleaning', 'Carpet Cleaning', 'Window Cleaning',
        'Pressure Washing', 'Move-out Cleaning', 'Deep Cleaning', 'Eco-friendly Cleaning'
    ],
    'driving': [
        'Truck Driving', 'Delivery Driver', 'Bus Driver', 'Chauffeur',
        'Forklift Operator', 'Heavy Equipment', 'Courier'
    ],
    'repair': [
        'Appliance Repair', 'Electronics Repair', 'Furniture Assembly',
        'Bicycle Repair', 'Smart Home Installation', 'Lock Repair'
    ],
    'other': [
        'Moving Help', 'Event Staff', 'Photography', 'Dog Walking',
        'Tutoring', 'Yard Work', 'Snow Removal', 'Personal Assistant'
    ]
}


def create_skills():
    """Create skills from predefined categories"""
    skills = []
    for category, skill_names in PREDEFINED_SKILLS.items():
        for name in skill_names:
            skill = Skill(
                name=name,
                category=category
            )
            skills.append(skill)
    
    # Add a few random skills
    for _ in range(NUM_SKILLS - len(skills)):
        category = random.choice(list(PREDEFINED_SKILLS.keys()))
        skill = Skill(
            name=fake.job(),
            category=category
        )
        skills.append(skill)
    
    db.session.add_all(skills)
    db.session.commit()
    print(f"Created {len(skills)} skills")
    return skills


def create_users():
    """Create users with different roles"""
    users = []
    
    # Create admin user
    admin_user = User(
        username='admin',
        email='admin@jobmatch.com',
        role=UserRole.ADMIN,
        is_active=True
    )
    admin_user.set_password('admin123')
    users.append(admin_user)
    print("Created admin user")
    
    # Create workers
    for i in range(NUM_WORKERS):
        username = f"worker_{i+1}_{fake.user_name()}"
        email = f"{username}@example.com"
        
        user = User(
            username=username[:80],
            email=email[:120],
            role=UserRole.WORKER,
            is_active=random.random() > 0.1  # 90% active
        )
        user.set_password('worker123')
        users.append(user)
    
    # Create employers
    for i in range(NUM_EMPLOYERS):
        username = f"employer_{i+1}_{fake.company()[:20]}".replace(' ', '_').lower()
        email = f"{username}@example.com"
        
        user = User(
            username=username[:80],
            email=email[:120],
            role=UserRole.EMPLOYER,
            is_active=random.random() > 0.1  # 90% active
        )
        user.set_password('employer123')
        users.append(user)
    
    db.session.add_all(users)
    db.session.commit()
    print(f"Created {len(users)} users")
    return users


def create_workers(users, skills):
    """Create worker profiles for worker users"""
    worker_users = [u for u in users if u.role == UserRole.WORKER]
    workers = []
    
    for user in worker_users:
        # Create worker profile
        worker = Worker(
            user_id=user.id,
            full_name=fake.name(),
            bio=fake.paragraph(nb_sentences=3),
            location_lat=float(fake.latitude()),
            location_lng=float(fake.longitude()),
            address=fake.address()[:500],
            phone=fake.phone_number()[:20],
            profile_picture=f"https://randomuser.me/api/portraits/{random.choice(['men', 'women'])}/{random.randint(1,99)}.jpg",
            hourly_rate=random.randint(15, 75),
            is_verified=random.random() > 0.4,
            verification_score=random.randint(30, 100) if random.random() > 0.4 else random.randint(0, 30),
            average_rating=round(random.uniform(3.0, 5.0), 1) if random.random() > 0.3 else 0.0,
            total_ratings=random.randint(0, 50)
        )
        workers.append(worker)
        db.session.add(worker)
        db.session.flush()  # Get worker.id
        
        # Add skills to worker (2-7 skills)
        num_skills = random.randint(2, 7)
        worker_skills = random.sample(skills, min(num_skills, len(skills)))
        for skill in worker_skills:
            worker_skill = WorkerSkill(
                worker_id=worker.id,
                skill_id=skill.id,
                proficiency_level=random.randint(1, 5)
            )
            db.session.add(worker_skill)
    
    db.session.commit()
    print(f"Created {len(workers)} workers with skills")
    return workers


def create_employers(users):
    """Create employer profiles for employer users"""
    employer_users = [u for u in users if u.role == UserRole.EMPLOYER]
    employers = []
    
    for user in employer_users:
        employer = Employer(
            user_id=user.id,
            company_name=fake.company()[:200],
            description=fake.catch_phrase() + '. ' + fake.paragraph(nb_sentences=2),
            location_lat=float(fake.latitude()),
            location_lng=float(fake.longitude()),
            address=fake.address()[:500],
            phone=fake.phone_number()[:20],
            website=fake.url()[:200],
            logo=f"https://logo.clearbit.com/{fake.domain_name()}"
        )
        employers.append(employer)
        db.session.add(employer)
    
    db.session.commit()
    print(f"Created {len(employers)} employers")
    return employers


def create_jobs(employers, skills):
    """Create job listings"""
    jobs = []
    job_statuses = list(JobStatus)
    
    for _ in range(NUM_JOBS):
        employer = random.choice(employers)
        skill = random.choice(skills)
        
        # Determine if job is expired (20% chance)
        is_expired = random.random() < 0.2
        
        # Set expiration date
        if is_expired:
            expiration_date = fake.date_time_between(start_date='-30d', end_date='-1d')
            status = JobStatus.EXPIRED
        else:
            expiration_date = fake.date_time_between(start_date='+1d', end_date='+30d')
            # Random status for active jobs
            if random.random() < 0.6:
                status = JobStatus.OPEN
            elif random.random() < 0.5:
                status = JobStatus.IN_PROGRESS
            elif random.random() < 0.5:
                status = JobStatus.COMPLETED
            else:
                status = JobStatus.CANCELLED
        
        pay_min = random.randint(20, 50)
        pay_max = pay_min + random.randint(10, 40)
        
        job = Job(
            employer_id=employer.id,
            title=f"Need {skill.name}: {fake.catch_phrase()}"[:200],
            description=fake.paragraph(nb_sentences=5),
            required_skill_id=skill.id,
            location_lat=employer.location_lat + random.uniform(-0.01, 0.01),
            location_lng=employer.location_lng + random.uniform(-0.01, 0.01),
            address=employer.address,
            pay_min=pay_min,
            pay_max=pay_max,
            pay_type=random.choice(['hourly', 'daily', 'fixed']),
            status=status,
            expiration_date=expiration_date,
            created_at=fake.date_time_between(start_date='-60d', end_date='now')
        )
        jobs.append(job)
        db.session.add(job)
    
    db.session.commit()
    print(f"Created {len(jobs)} jobs")
    return jobs


def create_applications(workers, jobs):
    """Create job applications"""
    applications = []
    statuses = list(ApplicationStatus)
    
    # Keep track of unique (job_id, worker_id) pairs
    used_pairs = set()
    
    for _ in range(NUM_APPLICATIONS):
        worker = random.choice(workers)
        job = random.choice(jobs)
        
        # Check uniqueness constraint
        if (job.id, worker.id) in used_pairs:
            continue
            
        used_pairs.add((job.id, worker.id))
        
        # Determine status based on job status
        if job.status == JobStatus.OPEN:
            status_weights = [0.7, 0.2, 0.1, 0.0]  # Mostly pending, some accepted/rejected
        elif job.status == JobStatus.IN_PROGRESS:
            status_weights = [0.1, 0.8, 0.1, 0.0]  # Mostly accepted
        elif job.status == JobStatus.COMPLETED:
            status_weights = [0.0, 0.9, 0.1, 0.0]  # Mostly accepted
        elif job.status == JobStatus.CANCELLED:
            status_weights = [0.0, 0.0, 0.5, 0.5]  # Rejected or withdrawn
        else:  # EXPIRED
            status_weights = [0.0, 0.0, 0.7, 0.3]  # Mostly rejected
        
        status = random.choices(statuses, weights=status_weights)[0]
        
        application = Application(
            job_id=job.id,
            worker_id=worker.id,
            status=status,
            cover_letter=fake.paragraph(nb_sentences=4) if random.random() > 0.3 else None,
            proposed_rate=random.randint(int(job.pay_min), int(job.pay_max)) if job.pay_min else None,
            created_at=fake.date_time_between(start_date=job.created_at, end_date='now')
        )
        applications.append(application)
        db.session.add(application)
    
    db.session.commit()
    print(f"Created {len(applications)} applications")
    return applications


def create_reviews(workers, employers, jobs, applications):
    """Create reviews for completed jobs"""
    reviews = []
    reviewed_jobs = set()
    
    # Get completed jobs with accepted applications
    completed_jobs = [j for j in jobs if j.status == JobStatus.COMPLETED]
    
    for job in completed_jobs[:NUM_REVIEWS]:  # Limit to NUM_REVIEWS
        if job.id in reviewed_jobs:
            continue
            
        # Find accepted application for this job
        accepted_app = next(
            (a for a in applications if a.job_id == job.id and a.status == ApplicationStatus.ACCEPTED),
            None
        )
        
        if accepted_app:
            worker = next(w for w in workers if w.id == accepted_app.worker_id)
            employer = next(e for e in employers if e.id == job.employer_id)
            
            review = Review(
                job_id=job.id,
                worker_id=worker.id,
                employer_id=employer.id,
                rating=random.randint(3, 5),  # Generally positive reviews
                comment=fake.paragraph(nb_sentences=3),
                created_at=fake.date_time_between(start_date=job.updated_at, end_date='now')
            )
            reviews.append(review)
            reviewed_jobs.add(job.id)
            db.session.add(review)
    
    db.session.commit()
    print(f"Created {len(reviews)} reviews")
    return reviews


def create_messages(users, workers, employers):
    """Create messages between users"""
    messages = []
    
    for _ in range(NUM_MESSAGES):
        # Randomly decide message direction
        if random.random() < 0.5:
            # Worker to Employer
            worker = random.choice(workers)
            employer = random.choice(employers)
            sender_id = worker.user_id
            receiver_id = employer.user_id
        else:
            # Employer to Worker
            employer = random.choice(employers)
            worker = random.choice(workers)
            sender_id = employer.user_id
            receiver_id = worker.user_id
        
        # Create conversation ID (sorted user IDs)
        conv_ids = sorted([str(sender_id), str(receiver_id)])
        conversation_id = f"{conv_ids[0]}-{conv_ids[1]}"
        
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=fake.paragraph(nb_sentences=2),
            is_read=random.random() > 0.3,  # 70% read
            created_at=fake.date_time_between(start_date='-30d', end_date='now')
        )
        messages.append(message)
        db.session.add(message)
    
    db.session.commit()
    print(f"Created {len(messages)} messages")
    return messages


def create_verifications(workers, users):
    """Create verification requests for workers"""
    verifications = []
    admin = next(u for u in users if u.role == UserRole.ADMIN)
    
    for _ in range(NUM_VERIFICATIONS):
        worker = random.choice(workers)
        
        verification_types = ['id_card', 'driver_license', 'certification', 'professional_license']
        
        # Determine status
        if worker.is_verified:
            status = VerificationStatus.APPROVED
            reviewed_by = admin.id
            review_notes = "Verification approved" if random.random() > 0.3 else None
        else:
            status_weights = [0.6, 0.2, 0.2]  # Pending, Approved, Rejected
            status = random.choices(list(VerificationStatus), weights=status_weights)[0]
            reviewed_by = admin.id if status != VerificationStatus.PENDING else None
            review_notes = fake.sentence() if status == VerificationStatus.REJECTED else None
        
        verification = Verification(
            worker_id=worker.id,
            verification_type=random.choice(verification_types),
            document_url=f"https://storage.jobmatch.com/verifications/{uuid.uuid4()}.pdf",
            status=status.value,
            reviewed_by=reviewed_by,
            review_notes=review_notes,
            created_at=fake.date_time_between(start_date='-60d', end_date='now')
        )
        verifications.append(verification)
        db.session.add(verification)
    
    db.session.commit()
    print(f"Created {len(verifications)} verifications")
    return verifications


def create_payments(workers, employers, jobs, applications):
    """Create payments for completed jobs"""
    payments = []
    payment_statuses = list(PaymentStatus)
    
    # Get completed jobs with accepted applications
    completed_jobs = [j for j in jobs if j.status == JobStatus.COMPLETED]
    
    for job in completed_jobs[:NUM_PAYMENTS]:
        # Find accepted application
        accepted_app = next(
            (a for a in applications if a.job_id == job.id and a.status == ApplicationStatus.ACCEPTED),
            None
        )
        
        if accepted_app:
            worker = next(w for w in workers if w.id == accepted_app.worker_id)
            employer = next(e for e in employers if e.id == job.employer_id)
            
            # Determine amount
            if accepted_app.proposed_rate:
                amount = accepted_app.proposed_rate
            else:
                amount = random.randint(int(job.pay_min or 30), int(job.pay_max or 60))
            
            # Random hours/days worked for realistic total
            hours_worked = random.randint(4, 40)
            total_amount = amount * hours_worked
            
            platform_fee = total_amount * Decimal("0.1") # 10% platform fee
            net_amount = total_amount - platform_fee
            
            # Payment status
            status_weights = [0.1, 0.75, 0.1, 0.03, 0.02]  # Mostly processing/completed
            status = random.choices(payment_statuses, weights=status_weights)[0]
            
            payment = Payment(
                job_id=job.id,
                employer_id=employer.id,
                worker_id=worker.id,
                amount=total_amount,
                payment_type='job_payment',
                reference=f"pay_{uuid.uuid4().hex[:16]}",
                platform_fee=platform_fee,
                net_amount=net_amount,
                status=status,
                transaction_id=f"txn_{uuid.uuid4().hex[:16]}",
                payment_method=random.choice(['credit_card', 'bank_transfer', 'paypal']),
                paid_at=fake.date_time_between(start_date=job.updated_at, end_date='now') if status == PaymentStatus.COMPLETED else None,
                created_at=fake.date_time_between(start_date=job.updated_at, end_date='now')
            )
            payments.append(payment)
            db.session.add(payment)
    
    db.session.commit()
    print(f"Created {len(payments)} payments")
    return payments


def clear_data():
    """Clear all existing data from tables"""
    print("Clearing existing data...")
    # Some environments (notably SQLite) have extra FK-linked tables that are
    # not part of this seed module; temporarily disable FK checks while clearing.
    dialect = db.session.bind.dialect.name if db.session.bind is not None else ""
    sqlite_fk_disabled = False
    if dialect == "sqlite":
        db.session.execute(text("PRAGMA foreign_keys = OFF"))
        sqlite_fk_disabled = True

    try:
        # Delete in order to handle core foreign key constraints
        db.session.execute(db.delete(Payment))
        db.session.execute(db.delete(Message))
        db.session.execute(db.delete(Verification))
        db.session.execute(db.delete(Review))
        db.session.execute(db.delete(Application))
        db.session.execute(db.delete(Job))
        db.session.execute(db.delete(WorkerSkill))
        db.session.execute(db.delete(Worker))
        db.session.execute(db.delete(Employer))
        db.session.execute(db.delete(Skill))
        db.session.execute(db.delete(User))
        db.session.commit()
    finally:
        if sqlite_fk_disabled:
            db.session.execute(text("PRAGMA foreign_keys = ON"))
            db.session.commit()

    print("Data cleared successfully")


def seed_database():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    clear_data()
    
    # Create data in order
    skills = create_skills()
    users = create_users()
    workers = create_workers(users, skills)
    employers = create_employers(users)
    jobs = create_jobs(employers, skills)
    applications = create_applications(workers, jobs)
    reviews = create_reviews(workers, employers, jobs, applications)
    messages = create_messages(users, workers, employers)
    verifications = create_verifications(workers, users)
    payments = create_payments(workers, employers, jobs, applications)
    
    # Update worker average ratings based on reviews
    for worker in workers:
        worker_reviews = [r for r in reviews if r.worker_id == worker.id]
        if worker_reviews:
            worker.average_rating = sum(r.rating for r in worker_reviews) / len(worker_reviews)
            worker.total_ratings = len(worker_reviews)
            db.session.add(worker)
    
    db.session.commit()
    
    print("\n✅ Database seeding completed successfully!")
    print(f"📊 Summary:")
    print(f"  - Users: {len(users)}")
    print(f"  - Workers: {len(workers)}")
    print(f"  - Employers: {len(employers)}")
    print(f"  - Skills: {len(skills)}")
    print(f"  - Jobs: {len(jobs)}")
    print(f"  - Applications: {len(applications)}")
    print(f"  - Reviews: {len(reviews)}")
    print(f"  - Messages: {len(messages)}")
    print(f"  - Verifications: {len(verifications)}")
    print(f"  - Payments: {len(payments)}")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed_database()
# ----- END FILE -----