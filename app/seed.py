# ----- FILE: backend/app/seed.py -----
from app import create_app
from app.extensions import db
from app.models import User, Worker, Employer, Skill, WorkerSkill, Job, Application, Review, Message, Verification, Payment, UserRole
from datetime import datetime, timedelta
import random

def seed_database():
    """Seed the database with initial data."""
    app = create_app('development')
    with app.app_context():
        # Clear existing data (in reverse order of dependencies)
        Payment.query.delete()
        Verification.query.delete()
        Review.query.delete()
        Message.query.delete()
        Application.query.delete()
        Job.query.delete()
        WorkerSkill.query.delete()
        Skill.query.delete()
        Worker.query.delete()
        Employer.query.delete()
        User.query.delete()

        # Create skills
        skills_data = [
            {'name': 'Plumbing', 'category': 'Construction'},
            {'name': 'Electrical', 'category': 'Construction'},
            {'name': 'Carpentry', 'category': 'Construction'},
            {'name': 'Masonry', 'category': 'Construction'},
            {'name': 'Painting', 'category': 'Construction'},
            {'name': 'Cleaning', 'category': 'Services'},
            {'name': 'Driving', 'category': 'Transportation'},
            {'name': 'Welding', 'category': 'Manufacturing'},
            {'name': 'Security', 'category': 'Services'},
            {'name': 'Landscaping', 'category': 'Services'},
            {'name': 'Roofing', 'category': 'Construction'},
            {'name': 'HVAC', 'category': 'Construction'},
            {'name': 'Cooking', 'category': 'Food'},
            {'name': 'Babysitting', 'category': 'Services'},
            {'name': 'Tutoring', 'category': 'Education'},
        ]
        
        skills = []
        for skill_data in skills_data:
            skill = Skill(**skill_data)
            skills.append(skill)
            db.session.add(skill)

        db.session.commit()

        # Create admin user
        admin = User(
            username='admin',
            email='admin@example.com',
            role=UserRole.ADMIN
        )
        admin.set_password('admin123')
        db.session.add(admin)

        # Create employers
        employers_data = [
            {
                'username': 'construction_co',
                'email': 'contact@constructionco.com',
                'company_name': 'Construction Co.',
                'description': 'Leading construction company in the area.',
                'address': '123 Builders St, City, State',
                'phone': '555-0101',
                'website': 'https://constructionco.com'
            },
            {
                'username': 'clean_masters',
                'email': 'info@cleanmasters.com',
                'company_name': 'Clean Masters',
                'description': 'Professional cleaning services for homes and offices.',
                'address': '456 Clean Ave, City, State',
                'phone': '555-0102',
                'website': 'https://cleanmasters.com'
            },
            {
                'username': 'quick_transport',
                'email': 'dispatch@quicktransport.com',
                'company_name': 'Quick Transport',
                'description': 'Reliable transportation services.',
                'address': '789 Drive Rd, City, State',
                'phone': '555-0103',
                'website': 'https://quicktransport.com'
            }
        ]

        employers = []
        for emp_data in employers_data:
            user = User(
                username=emp_data['username'],
                email=emp_data['email'],
                role=UserRole.EMPLOYER
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.flush()  # To get the user id

            employer = Employer(
                user_id=user.id,
                company_name=emp_data['company_name'],
                description=emp_data['description'],
                address=emp_data['address'],
                phone=emp_data['phone'],
                website=emp_data['website'],
                location_lat=40.7128 + random.uniform(-0.1, 0.1),
                location_lng=-74.0060 + random.uniform(-0.1, 0.1)
            )
            employers.append(employer)
            db.session.add(employer)

        # Create workers
        workers_data = [
            {
                'username': 'john_plumber',
                'email': 'john@example.com',
                'full_name': 'John Smith',
                'bio': 'Experienced plumber with 10 years of experience.',
                'skills': ['Plumbing', 'HVAC'],
                'hourly_rate': 45.00
            },
            {
                'username': 'jane_electrician',
                'email': 'jane@example.com',
                'full_name': 'Jane Doe',
                'bio': 'Licensed electrician specializing in residential work.',
                'skills': ['Electrical'],
                'hourly_rate': 55.00
            },
            {
                'username': 'mike_driver',
                'email': 'mike@example.com',
                'full_name': 'Mike Johnson',
                'bio': 'Professional driver with clean record.',
                'skills': ['Driving'],
                'hourly_rate': 25.00
            },
            {
                'username': 'sarah_cleaner',
                'email': 'sarah@example.com',
                'full_name': 'Sarah Williams',
                'bio': 'Detail-oriented cleaner for homes and offices.',
                'skills': ['Cleaning'],
                'hourly_rate': 30.00
            },
            {
                'username': 'robert_builder',
                'email': 'robert@example.com',
                'full_name': 'Robert Brown',
                'bio': 'Skilled carpenter and mason.',
                'skills': ['Carpentry', 'Masonry', 'Painting'],
                'hourly_rate': 40.00
            }
        ]

        workers = []
        for worker_data in workers_data:
            user = User(
                username=worker_data['username'],
                email=worker_data['email'],
                role=UserRole.WORKER
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.flush()

            worker = Worker(
                user_id=user.id,
                full_name=worker_data['full_name'],
                bio=worker_data['bio'],
                hourly_rate=worker_data['hourly_rate'],
                location_lat=40.7128 + random.uniform(-0.2, 0.2),
                location_lng=-74.0060 + random.uniform(-0.2, 0.2),
                address=f'{random.randint(100, 999)} Worker St, City, State',
                phone=f'555-02{random.randint(10, 99)}',
                is_verified=random.choice([True, False]),
                verification_score=random.randint(0, 100)
            )
            workers.append(worker)
            db.session.add(worker)

            # Add skills to worker
            for skill_name in worker_data['skills']:
                skill = Skill.query.filter_by(name=skill_name).first()
                if skill:
                    worker_skill = WorkerSkill(
                        worker_id=worker.id,
                        skill_id=skill.id,
                        proficiency_level=random.randint(3, 5)
                    )
                    db.session.add(worker_skill)

        db.session.commit()

        # Create jobs
        jobs_data = [
            {
                'employer': employers[0],
                'title': 'Residential Plumber Needed',
                'description': 'Need a plumber to fix a leaking pipe.',
                'required_skill': 'Plumbing',
                'pay_min': 200,
                'pay_max': 400,
                'pay_type': 'fixed'
            },
            {
                'employer': employers[0],
                'title': 'Commercial Electrician',
                'description': 'Electrical work for an office building.',
                'required_skill': 'Electrical',
                'pay_min': 50,
                'pay_max': 70,
                'pay_type': 'hourly'
            },
            {
                'employer': employers[1],
                'title': 'Office Cleaning',
                'description': 'Daily cleaning of office space.',
                'required_skill': 'Cleaning',
                'pay_min': 25,
                'pay_max': 35,
                'pay_type': 'hourly'
            },
            {
                'employer': employers[2],
                'title': 'Delivery Driver',
                'description': 'Full-time delivery driver needed.',
                'required_skill': 'Driving',
                'pay_min': 20,
                'pay_max': 25,
                'pay_type': 'hourly'
            },
            {
                'employer': employers[0],
                'title': 'Carpenter for Renovation',
                'description': 'Kitchen renovation project.',
                'required_skill': 'Carpentry',
                'pay_min': 3000,
                'pay_max': 5000,
                'pay_type': 'fixed'
            }
        ]

        jobs = []
        for job_data in jobs_data:
            skill = Skill.query.filter_by(name=job_data['required_skill']).first()
            job = Job(
                employer_id=job_data['employer'].id,
                title=job_data['title'],
                description=job_data['description'],
                required_skill_id=skill.id,
                location_lat=job_data['employer'].location_lat + random.uniform(-0.05, 0.05),
                location_lng=job_data['employer'].location_lng + random.uniform(-0.05, 0.05),
                address=job_data['employer'].address,
                pay_min=job_data['pay_min'],
                pay_max=job_data['pay_max'],
                pay_type=job_data['pay_type'],
                status='open',
                expiration_date=datetime.utcnow() + timedelta(days=30)
            )
            jobs.append(job)
            db.session.add(job)

        db.session.commit()

        # Create applications
        applications_data = [
            {'job': jobs[0], 'worker': workers[0], 'status': 'accepted'},
            {'job': jobs[1], 'worker': workers[1], 'status': 'pending'},
            {'job': jobs[2], 'worker': workers[3], 'status': 'accepted'},
            {'job': jobs[3], 'worker': workers[2], 'status': 'rejected'},
            {'job': jobs[4], 'worker': workers[4], 'status': 'pending'},
        ]

        for app_data in applications_data:
            application = Application(
                job_id=app_data['job'].id,
                worker_id=app_data['worker'].id,
                status=app_data['status'],
                cover_letter='I am interested in this job.',
                proposed_rate=app_data['job'].pay_min + (app_data['job'].pay_max - app_data['job'].pay_min) * 0.5
            )
            db.session.add(application)

            if app_data['status'] == 'accepted':
                app_data['job'].status = 'in_progress'

        db.session.commit()

        # Create reviews
        completed_jobs = [jobs[0], jobs[2]]
        for job in completed_jobs:
            job.status = 'completed'
            application = Application.query.filter_by(job_id=job.id, status='accepted').first()
            if application:
                review = Review(
                    job_id=job.id,
                    worker_id=application.worker_id,
                    employer_id=job.employer_id,
                    rating=random.randint(4, 5),
                    comment='Great work, highly recommended!'
                )
                db.session.add(review)

        db.session.commit()

        # Create payments
        for job in completed_jobs:
            application = Application.query.filter_by(job_id=job.id, status='accepted').first()
            if application:
                amount = job.pay_max if job.pay_type == 'fixed' else (job.pay_max * 8 * 5)
                payment = Payment(
                    job_id=job.id,
                    employer_id=job.employer_id,
                    worker_id=application.worker_id,
                    amount=amount,
                    platform_fee=amount * 0.10,
                    net_amount=amount * 0.90,
                    status='paid',
                    payment_method='bank_transfer',
                    transaction_id=f'TXN{random.randint(100000, 999999)}',
                    paid_at=datetime.utcnow() - timedelta(days=random.randint(1, 7))
                )
                db.session.add(payment)

        db.session.commit()

        # Create messages
        conversations = [
            {'user1': workers[0].user_id, 'user2': employers[0].user_id},
            {'user1': workers[1].user_id, 'user2': employers[0].user_id},
        ]

        for conv in conversations:
            for i in range(3):
                message1 = Message(
                    conversation_id=f"{min(conv['user1'], conv['user2'])}-{max(conv['user1'], conv['user2'])}",
                    sender_id=conv['user1'],
                    receiver_id=conv['user2'],
                    content=f'Message {i+1} from worker.'
                )
                db.session.add(message1)

                message2 = Message(
                    conversation_id=f"{min(conv['user1'], conv['user2'])}-{max(conv['user1'], conv['user2'])}",
                    sender_id=conv['user2'],
                    receiver_id=conv['user1'],
                    content=f'Message {i+1} from employer.'
                )
                db.session.add(message2)

        db.session.commit()

        # Create verifications
        for worker in workers[:3]:
            verification = Verification(
                worker_id=worker.id,
                verification_type=random.choice(['id_card', 'license', 'certification']),
                document_url=f'https://example.com/docs/worker{worker.id}.pdf',
                status=random.choice(['pending', 'approved', 'rejected']),
                review_notes='Document looks valid.' if random.choice([True, False]) else None
            )
            db.session.add(verification)

        db.session.commit()

        print("Database seeded successfully!")


if __name__ == '__main__':
    seed_database()
