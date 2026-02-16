from ..extensions import db


class WorkerSkill(db.Model):
    __tablename__ = "worker_skills"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    proficiency_level = db.Column(db.Integer, default=1)  # 1-5 scale

    # Unique constraint to prevent duplicate skill entries for a worker
    __table_args__ = (
        db.UniqueConstraint("worker_id", "skill_id", name="_worker_skill_uc"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "skill_id": self.skill_id,
            "proficiency_level": self.proficiency_level,
        }
