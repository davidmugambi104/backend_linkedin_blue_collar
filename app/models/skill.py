from ..extensions import db

class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(100), index=True)  # e.g., 'construction', 'cleaning', 'driving'

    # Relationships
    worker_skills = db.relationship('WorkerSkill', backref='skill', cascade='all, delete-orphan')
    jobs = db.relationship('Job', backref='required_skill', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category
        }
