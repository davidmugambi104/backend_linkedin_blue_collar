# ----- FILE: backend/app/routes/init.py -----
from .auth import auth_bp
from .users import users_bp
from .workers import workers_bp
from .employers import employers_bp
from .skills import skills_bp
from .jobs import jobs_bp
from .applications import applications_bp
from .reviews import reviews_bp
from .messages import messages_bp
from .verification import verification_bp
from .payments import payments_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(workers_bp, url_prefix='/api/workers')
    app.register_blueprint(employers_bp, url_prefix='/api/employers')
    app.register_blueprint(skills_bp, url_prefix='/api/skills')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(verification_bp, url_prefix='/api/verification')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
