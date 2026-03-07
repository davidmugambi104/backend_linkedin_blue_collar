# WorkForge Database Schema for PostgreSQL
# Run this script to set up PostgreSQL database
# Usage: psql -U postgres -d workforge -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'employer', 'admin')),
    phone VARCHAR(20),
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    id_number VARCHAR(20),
    county VARCHAR(100),
    sub_county VARCHAR(100),
    ward VARCHAR(100),
    reset_code VARCHAR(6),
    reset_code_expires TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT unique_username UNIQUE (username),
    CONSTRAINT unique_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_county ON users(county);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Worker profiles
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_photo_url TEXT,
    bio TEXT,
    years_experience INTEGER,
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    next_available_date DATE,
    max_travel_distance INTEGER DEFAULT 10,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    service_radius_km INTEGER DEFAULT 10,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    response_rate DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_location ON workers(county, sub_county);
CREATE INDEX idx_workers_availability ON workers(availability_status);
CREATE INDEX idx_workers_rating ON workers(average_rating DESC);
CREATE INDEX idx_workers_verified ON workers(is_verified);

-- Employer profiles
CREATE TABLE employers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    business_registration_number VARCHAR(50),
    company_type VARCHAR(50) CHECK (company_type IN ('individual', 'small_business', 'corporation', 'ngo', 'government')),
    industry_sector VARCHAR(100),
    company_size VARCHAR(50),
    website VARCHAR(255),
    contact_person_name VARCHAR(200),
    contact_person_title VARCHAR(100),
    business_phone VARCHAR(20),
    business_permit_url TEXT,
    kra_pin VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    credit_score INTEGER,
    physical_address TEXT,
    county VARCHAR(100),
    sub_county VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_jobs_posted INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employers_user_id ON employers(user_id);
CREATE INDEX idx_employers_verified ON employers(is_verified);
CREATE INDEX idx_employers_location ON employers(county, sub_county);

-- Skills
CREATE TABLE skill_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES skill_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES skill_categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_certification_required BOOLEAN DEFAULT FALSE,
    average_market_rate DECIMAL(10, 2),
    demand_score DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category_id);

-- Worker skills
CREATE TABLE worker_skills (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id),
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert', 'master')),
    years_experience INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    has_certification BOOLEAN DEFAULT FALSE,
    certification_details JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_worker_skill UNIQUE (worker_id, skill_id)
);

CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_skill ON worker_skills(skill_id);
CREATE INDEX idx_worker_skills_proficiency ON worker_skills(proficiency_level);

-- Job postings
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER NOT NULL REFERENCES employers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    skill_id INTEGER REFERENCES skills(id),
    job_location_type VARCHAR(20) DEFAULT 'onsite' CHECK (job_location_type IN ('onsite', 'remote', 'hybrid')),
    county VARCHAR(100),
    sub_county VARCHAR(100),
    specific_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    start_date DATE NOT NULL,
    estimated_duration_days INTEGER,
    start_time TIME,
    end_time TIME,
    is_flexible_hours BOOLEAN DEFAULT FALSE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('hourly', 'daily', 'fixed', 'milestone')),
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    is_negotiable BOOLEAN DEFAULT FALSE,
    required_experience_years INTEGER,
    required_certifications JSONB,
    required_tools JSONB,
    number_of_workers_needed INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    shortlist_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_budget CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);

CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_skill ON jobs(skill_id);
CREATE INDEX idx_jobs_location ON jobs(county, sub_county);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_start_date ON jobs(start_date);
CREATE INDEX idx_jobs_budget ON jobs(budget_min, budget_max);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

-- Job applications
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    cover_note TEXT,
    proposed_rate DECIMAL(10, 2),
    available_from DATE,
    estimated_completion_days INTEGER,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'interview_scheduled', 'offered', 'accepted', 'rejected', 'withdrawn', 'hired')),
    interview_date TIMESTAMPTZ,
    interview_notes TEXT,
    interview_feedback TEXT,
    offered_rate DECIMAL(10, 2),
    offer_accepted_at TIMESTAMPTZ,
    offer_declined_at TIMESTAMPTZ,
    offer_expires_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    shortlisted_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    skill_match_score INTEGER CHECK (skill_match_score BETWEEN 0 AND 100),
    experience_match_score INTEGER CHECK (experience_match_score BETWEEN 0 AND 100),
    location_match_score INTEGER CHECK (location_match_score BETWEEN 0 AND 100),
    overall_match_score INTEGER CHECK (overall_match_score BETWEEN 0 AND 100),
    CONSTRAINT unique_job_worker UNIQUE (job_id, worker_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_match_score ON applications(overall_match_score DESC);

-- Contracts
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    worker_id INTEGER NOT NULL REFERENCES workers(id),
    employer_id INTEGER NOT NULL REFERENCES employers(id),
    application_id INTEGER REFERENCES applications(id),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_terms TEXT,
    payment_schedule JSONB,
    terms_and_conditions TEXT,
    special_clauses TEXT,
    jurisdiction VARCHAR(100) DEFAULT 'Kenya',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'active', 'completed', 'terminated')),
    fundi_signed_at TIMESTAMPTZ,
    employer_signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_contracts_job ON contracts(job_id);
CREATE INDEX idx_contracts_worker ON contracts(worker_id);
CREATE INDEX idx_contracts_employer ON contracts(employer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

-- Payment transactions
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    payer_id INTEGER NOT NULL,
    payer_type VARCHAR(20) NOT NULL CHECK (payer_type IN ('employer', 'worker')),
    payee_id INTEGER NOT NULL,
    payee_type VARCHAR(20) NOT NULL CHECK (payee_type IN ('employer', 'worker')),
    contract_id INTEGER REFERENCES contracts(id),
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('mpesa', 'bank_transfer', 'card', 'cash', 'wallet')),
    provider_reference VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    is_escrow BOOLEAN DEFAULT TRUE,
    escrow_released_at TIMESTAMPTZ,
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_payer ON payment_transactions(payer_id, payer_type);
CREATE INDEX idx_payments_payee ON payment_transactions(payee_id, payee_type);
CREATE INDEX idx_payments_status ON payment_transactions(payment_status);
CREATE INDEX idx_payments_reference ON payment_transactions(transaction_reference);
CREATE INDEX idx_payments_date ON payment_transactions(initiated_at);
CREATE INDEX idx_payments_contract ON payment_transactions(contract_id);

-- Reviews/Ratings
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    rater_id INTEGER NOT NULL,
    rater_type VARCHAR(20) NOT NULL CHECK (rater_type IN ('employer', 'worker')),
    ratee_id INTEGER NOT NULL,
    ratee_type VARCHAR(20) NOT NULL CHECK (ratee_type IN ('employer', 'worker')),
    overall_rating DECIMAL(2, 1) CHECK (overall_rating BETWEEN 0 AND 5),
    quality_rating DECIMAL(2, 1) CHECK (quality_rating BETWEEN 0 AND 5),
    communication_rating DECIMAL(2, 1) CHECK (communication_rating BETWEEN 0 AND 5),
    punctuality_rating DECIMAL(2, 1) CHECK (punctuality_rating BETWEEN 0 AND 5),
    value_rating DECIMAL(2, 1) CHECK (value_rating BETWEEN 0 AND 5),
    review_text TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    responded_at TIMESTAMPTZ,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_contract_rater UNIQUE (contract_id, rater_id)
);

CREATE INDEX idx_reviews_ratee ON reviews(ratee_id, ratee_type);
CREATE INDEX idx_reviews_contract ON reviews(contract_id);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating DESC);

-- Messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Verifications
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('id_verification', 'address_verification', 'business_verification', 'skill_certification', 'phone_verification')),
    document_urls TEXT[],
    document_metadata JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected')),
    assigned_to INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    priority INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_verifications_user ON verifications(user_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_assigned ON verifications(assigned_to);

-- Disputes
CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    raised_by INTEGER NOT NULL REFERENCES users(id),
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('payment', 'quality', 'no_show', 'damage', 'communication', 'other')),
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'escalated', 'closed')),
    resolution JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_contract ON disputes(contract_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Audit logs (for security compliance)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action_time ON audit_logs(action, timestamp);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- Login logs (for security)
CREATE TABLE login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_logs_user ON login_logs(user_id, created_at);
CREATE INDEX idx_login_logs_created ON login_logs(created_at);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT NOT NULL,
    data JSONB,
    channels JSONB DEFAULT '["in_app"]',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Insert default skill categories
INSERT INTO skill_categories (name, description, sort_order) VALUES
('Construction', 'Building and construction related skills', 1),
('Plumbing', 'Water and pipe fitting skills', 2),
('Electrical', 'Electrical installation and repair', 3),
('Carpentry', 'Wood working and furniture', 4),
('Painting', 'Interior and exterior painting', 5),
('Masonry', 'Brick and stone work', 6),
('Roofing', 'Roof installation and repair', 7),
('HVAC', 'Heating, ventilation, AC', 8),
('Landscaping', 'Garden and outdoor work', 9),
('General', 'General maintenance and repairs', 10);

-- Insert default skills
INSERT INTO skill_categories (name, parent_id) VALUES
('Residential', 1), ('Commercial', 1), ('Industrial', 1);

INSERT INTO skills (category_id, name, description, average_market_rate) VALUES
-- Construction
(1, 'General Construction', 'General building work', 1500),
(2, 'Foundation Work', 'Foundation digging and laying', 2000),
(3, 'Steel Fixing', 'Steel reinforcement work', 1800),
-- Plumbing
(4, 'Pipe Fitting', 'Installation and repair of pipes', 800),
(5, 'Bathroom Installation', 'Full bathroom fit-outs', 2500),
(6, 'Drainage', 'Drainage systems', 1000),
-- Electrical
(7, 'Wiring', 'Electrical wiring for buildings', 1200),
(8, 'Panel Installation', 'Electrical panel setup', 1500),
(9, 'Appliance Repair', 'Fixing electrical appliances', 800),
-- Carpentry
(10, 'Furniture Making', 'Custom furniture', 2000),
(11, 'Cabinet Installation', 'Kitchen cabinets', 1500),
(12, 'Door Installation', 'Door fitting', 600),
-- Painting
(13, 'Interior Painting', 'Indoor paint work', 500),
(14, 'Exterior Painting', 'Outdoor paint work', 700),
(15, 'Texture Coating', 'Decorative finishes', 600);
