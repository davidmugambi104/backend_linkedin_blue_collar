"""add_county_subcounty_and_missing_fields

Revision ID: add_county_subcounty
Revises: 1d2e9cdd8298
Create Date: 2026-02-23 16:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_county_subcounty'
down_revision = 'bfcad48a09a7'
branch_labels = None
depends_on = None


def upgrade():
    # === Users table - add location fields ===
    op.add_column('users', sa.Column('id_number', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('county', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('sub_county', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('ward', sa.String(100), nullable=True))
    
    # === Workers table - add comprehensive fields from agenda ===
    op.add_column('workers', sa.Column('date_of_birth', sa.Date, nullable=True))
    op.add_column('workers', sa.Column('gender', sa.String(20), nullable=True))
    op.add_column('workers', sa.Column('id_number', sa.String(20), nullable=True))
    op.add_column('workers', sa.Column('id_photo_front_url', sa.String(500), nullable=True))
    op.add_column('workers', sa.Column('id_photo_back_url', sa.String(500), nullable=True))
    op.add_column('workers', sa.Column('kra_pin', sa.String(20), nullable=True))
    op.add_column('workers', sa.Column('nhif_number', sa.String(20), nullable=True))
    op.add_column('workers', sa.Column('nssf_number', sa.String(20), nullable=True))
    op.add_column('workers', sa.Column('county', sa.String(100), nullable=True))
    op.add_column('workers', sa.Column('sub_county', sa.String(100), nullable=True))
    op.add_column('workers', sa.Column('ward', sa.String(100), nullable=True))
    op.add_column('workers', sa.Column('service_radius_km', sa.Integer, default=10))
    op.add_column('workers', sa.Column('availability_status', sa.String(20), default='available'))
    op.add_column('workers', sa.Column('next_available_date', sa.Date, nullable=True))
    op.add_column('workers', sa.Column('max_travel_distance', sa.Integer, default=20))
    op.add_column('workers', sa.Column('profile_completion_percentage', sa.Integer, default=0))
    op.add_column('workers', sa.Column('years_experience', sa.Integer, default=0))
    
    # === Employers table - add business fields ===
    op.add_column('employers', sa.Column('business_registration_number', sa.String(50), nullable=True))
    op.add_column('employers', sa.Column('company_type', sa.String(50), nullable=True))
    op.add_column('employers', sa.Column('kra_pin', sa.String(20), nullable=True))
    op.add_column('employers', sa.Column('county', sa.String(100), nullable=True))
    op.add_column('employers', sa.Column('sub_county', sa.String(100), nullable=True))
    op.add_column('employers', sa.Column('industry_sector', sa.String(100), nullable=True))
    op.add_column('employers', sa.Column('company_size', sa.String(50), nullable=True))
    
    # === Jobs table - add missing fields ===
    op.add_column('jobs', sa.Column('county', sa.String(100), nullable=True))
    op.add_column('jobs', sa.Column('sub_county', sa.String(100), nullable=True))
    op.add_column('jobs', sa.Column('start_date', sa.Date, nullable=True))
    op.add_column('jobs', sa.Column('required_experience_years', sa.Integer, nullable=True))
    op.add_column('jobs', sa.Column('number_of_fundis_needed', sa.Integer, default=1))
    op.add_column('jobs', sa.Column('is_flexible_hours', sa.Boolean, default=True))
    
    # === Add indexes for performance ===
    with op.batch_alter_table('workers', schema=None) as batch_op:
        batch_op.create_index('ix_workers_county', ['county'], unique=False)
        batch_op.create_index('ix_workers_availability', ['availability_status'], unique=False)
    
    with op.batch_alter_table('employers', schema=None) as batch_op:
        batch_op.create_index('ix_employers_county', ['county'], unique=False)
    
    with op.batch_alter_table('jobs', schema=None) as batch_op:
        batch_op.create_index('ix_jobs_county', ['county'], unique=False)
        batch_op.create_index('ix_jobs_start_date', ['start_date'], unique=False)


def downgrade():
    # Drop indexes
    with op.batch_alter_table('jobs', schema=None) as batch_op:
        batch_op.drop_index('ix_jobs_start_date')
        batch_op.drop_index('ix_jobs_county')
    
    with op.batch_alter_table('employers', schema=None) as batch_op:
        batch_op.drop_index('ix_employers_county')
    
    with op.batch_alter_table('workers', schema=None) as batch_op:
        batch_op.drop_index('ix_workers_availability')
        batch_op.drop_index('ix_workers_county')
    
    # Drop columns - jobs
    op.drop_column('jobs', 'is_flexible_hours')
    op.drop_column('jobs', 'number_of_fundis_needed')
    op.drop_column('jobs', 'required_experience_years')
    op.drop_column('jobs', 'start_date')
    op.drop_column('jobs', 'sub_county')
    op.drop_column('jobs', 'county')
    
    # Drop columns - employers
    op.drop_column('employers', 'company_size')
    op.drop_column('employers', 'industry_sector')
    op.drop_column('employers', 'sub_county')
    op.drop_column('employers', 'county')
    op.drop_column('employers', 'kra_pin')
    op.drop_column('employers', 'company_type')
    op.drop_column('employers', 'business_registration_number')
    
    # Drop columns - workers
    op.drop_column('workers', 'years_experience')
    op.drop_column('workers', 'profile_completion_percentage')
    op.drop_column('workers', 'max_travel_distance')
    op.drop_column('workers', 'next_available_date')
    op.drop_column('workers', 'availability_status')
    op.drop_column('workers', 'service_radius_km')
    op.drop_column('workers', 'ward')
    op.drop_column('workers', 'sub_county')
    op.drop_column('workers', 'county')
    op.drop_column('workers', 'nssf_number')
    op.drop_column('workers', 'nhif_number')
    op.drop_column('workers', 'kra_pin')
    op.drop_column('workers', 'id_photo_back_url')
    op.drop_column('workers', 'id_photo_front_url')
    op.drop_column('workers', 'id_number')
    op.drop_column('workers', 'gender')
    op.drop_column('workers', 'date_of_birth')
    
    # Drop columns - users
    op.drop_column('users', 'ward')
    op.drop_column('users', 'sub_county')
    op.drop_column('users', 'county')
    op.drop_column('users', 'id_number')
