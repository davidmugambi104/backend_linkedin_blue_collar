WorkForge Enterprise Project Agenda
Comprehensive Development & Implementation Blueprint
Version 1.0 | Enterprise Grade | Q2 2024
Table of Contents
Executive Summary

Enterprise Architecture Overview

System Design & Component Specifications

Database Schema & Data Architecture

API Design & Integration Layer

Frontend Architecture & Component Library

Security & Compliance Framework

Enterprise Workflow Automation

AI/ML Integration Strategy

Testing & Quality Assurance

DevOps & Infrastructure

Implementation Roadmap

Risk Mitigation Strategies

Success Metrics & KPIs

1. Executive Summary
1.1 Strategic Vision
WorkForge is positioned as an enterprise-grade workforce orchestration platform bridging the gap between informal skilled labor ("fundis") and formal employment opportunities across East Africa. The platform addresses critical market inefficiencies including trust deficits, verification gaps, payment security, and skill matching precision.

1.2 Market Positioning
Primary Market: Nairobi Metropolitan Area (initial rollout)

Secondary Markets: Mombasa, Kisumu, Nakuru (phase 2)

Target Segments: Construction, plumbing, electrical, carpentry, painting, general repairs

Enterprise Value Proposition: 40% reduction in hiring time, 60% improvement in worker retention, verified skill compliance

1.3 Core Value Streams
For Employers: Vetted talent pool, compliance verification, automated matching, payment protection

For Fundis: Consistent work, skill validation, career progression, financial inclusion

For Platform: Data-driven insights, marketplace efficiency, scalable verification model

2. Enterprise Architecture Overview
2.1 Technology Stack Specifications
text
Backend Layer:
├── Core Framework: Python 3.11+ (FastAPI/Flask with enterprise extensions)
├── API Gateway: Kong/NGINX with rate limiting
├── Message Queue: RabbitMQ/Apache Kafka for async operations
├── Cache Layer: Redis Cluster (6+ nodes)
├── Database: PostgreSQL 15+ with Citus extension for sharding
├── Search Engine: Elasticsearch 8.x for skill matching
├── Task Queue: Celery with Redis broker
├── Monitoring: Prometheus + Grafana + ELK Stack
├── Authentication: OAuth2.0 + JWT with refresh tokens
└── File Storage: MinIO/S3-compatible object storage

Frontend Layer:
├── Core Framework: React 18+ with TypeScript
├── State Management: Redux Toolkit + RTK Query
├── UI Component Library: Material-UI v5 + Styled Components
├── Form Management: React Hook Form + Yup validation
├── Data Visualization: Recharts/D3.js for analytics
├── PWA Support: Workbox + Service Workers
├── Mobile: React Native (future phase)
└── Build Tools: Vite + Webpack 5

Infrastructure:
├── Container Orchestration: Kubernetes (EKS/AKS)
├── CI/CD: GitLab CI/GitHub Actions
├── Infrastructure as Code: Terraform + Ansible
├── Secrets Management: HashiCorp Vault
├── CDN: CloudFront/Cloudflare
└── Backup/DR: Cross-region replication, daily snapshots
2.2 System Context Diagram Components
text
External Systems Integration:
├── Payment Gateways:
│   ├── Safaricom M-Pesa API (Daraja)
│   ├── Equity Bank API
│   └── Stripe/PayPal (international)
├── Identity Verification:
│   ├── Integrated Population Registration System (IPRS)
│   ├── CRB verification
│   └── Google/LinkedIn OAuth
├── Communication:
│   ├── Twilio/Sinch for SMS
│   ├── WhatsApp Business API
│   ├── SendGrid for email
│   └── Firebase Cloud Messaging
├── Geolocation:
│   ├── Google Maps Platform
│   ├── What3Words integration
│   └── OpenStreetMap fallback
└── Compliance:
    ├── KRA PIN verification
    ├── NSSF/NHIF integration
    └── County business permits
3. System Design & Component Specifications
3.1 Microservices Architecture Breakdown
yaml
services:
  auth-service:
    port: 3001
    database: auth_db
    features:
      - Multi-factor authentication
      - Role-based access control (RBAC)
      - Session management
      - OAuth provider integration
      
  user-service:
    port: 3002
    database: user_db
    features:
      - Profile management (fundi/employer)
      - Document verification
      - Rating history
      - Work history tracking
      
  matching-service:
    port: 3003
    database: matching_db
    features:
      - Skill-based matching algorithm
      - Location proximity scoring
      - Availability scheduling
      - Price negotiation engine
      
  job-service:
    port: 3004
    database: job_db
    features:
      - Job posting management
      - Application tracking
      - Contract generation
      - Milestone tracking
      
  payment-service:
    port: 3005
    database: payment_db
    features:
      - Escrow management
      - Disbursement scheduling
      - Invoice generation
      - Tax compliance
      
  notification-service:
    port: 3006
    database: notification_db
    features:
      - Multi-channel delivery
      - Template management
      - Delivery tracking
      - Preference management
      
  analytics-service:
    port: 3007
    database: analytics_db (TimescaleDB)
    features:
      - Real-time metrics
      - Predictive analytics
      - Report generation
      - Data export
3.2 Service Communication Patterns
python
# Event-Driven Architecture Example
class WorkForgeEventBus:
    """Enterprise event bus for inter-service communication"""
    
    EVENT_TYPES = {
        'USER_REGISTERED': 'user.registered',
        'JOB_POSTED': 'job.posted',
        'MATCH_FOUND': 'match.found',
        'PAYMENT_COMPLETED': 'payment.completed',
        'RATING_SUBMITTED': 'rating.submitted',
        'DISPUTE_RAISED': 'dispute.raised'
    }
    
    async def publish_event(self, event_type: str, payload: dict, priority: int = 1):
        """Publish event with guaranteed delivery"""
        event = {
            'id': str(uuid.uuid4()),
            'type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'payload': payload,
            'priority': priority,
            'version': '1.0'
        }
        
        # Store in event store for replay capability
        await self.event_store.save(event)
        
        # Publish to appropriate channels
        if priority == 1:  # High priority
            await self.kafka_producer.send(
                topic=event_type,
                value=json.dumps(event),
                headers=[('priority', b'high')]
            )
        else:
            await self.rabbitmq_channel.basic_publish(
                exchange='workforge',
                routing_key=event_type,
                body=json.dumps(event)
            )
4. Database Schema & Data Architecture
4.1 Comprehensive PostgreSQL Schema
sql
-- Enterprise-grade schema design with partitioning, indexing strategy

-- Core User Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('fundi', 'employer', 'admin', 'verifier') NOT NULL,
    verification_level INT DEFAULT 0,
    account_status ENUM('pending', 'active', 'suspended', 'banned') DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone_number),
    INDEX idx_users_type_status (user_type, account_status),
    PARTITION BY RANGE (created_at)
);

-- Fundi Profiles (partitioned by region)
CREATE TABLE fundi_profiles (
    id UUID PRIMARY KEY REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    profile_photo_url TEXT,
    id_photo_front_url TEXT,
    id_photo_back_url TEXT,
    kra_pin VARCHAR(20),
    nhif_number VARCHAR(20),
    nssf_number VARCHAR(20),
    
    -- Location data
    county VARCHAR(100),
    sub_county VARCHAR(100),
    ward VARCHAR(100),
    location_description TEXT,
    what3words VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    service_radius_km INT DEFAULT 10,
    
    -- Professional info
    years_experience INT,
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    availability_status ENUM('available', 'busy', 'unavailable') DEFAULT 'available',
    next_available_date DATE,
    max_travel_distance INT,
    
    -- Verification
    is_id_verified BOOLEAN DEFAULT FALSE,
    is_address_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    -- Metadata
    profile_completion_percentage INT DEFAULT 0,
    search_visibility BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_fundi_location (county, sub_county),
    INDEX idx_fundi_availability (availability_status),
    INDEX idx_fundi_rates (hourly_rate_min, hourly_rate_max),
    INDEX idx_fundi_verification (verification_level),
    
    CONSTRAINT valid_rates CHECK (hourly_rate_min <= hourly_rate_max)
) PARTITION BY LIST (county);

-- Skills Taxonomy
CREATE TABLE skill_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT REFERENCES skill_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES skill_categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_certification_required BOOLEAN DEFAULT FALSE,
    average_market_rate DECIMAL(10, 2),
    demand_score DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_skills_category (category_id),
    INDEX idx_skills_demand (demand_score)
);

CREATE TABLE fundi_skills (
    fundi_id UUID REFERENCES fundi_profiles(id),
    skill_id INT REFERENCES skills(id),
    proficiency_level ENUM('beginner', 'intermediate', 'expert', 'master') NOT NULL,
    years_experience INT,
    is_primary BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    has_certification BOOLEAN DEFAULT FALSE,
    certification_details JSONB,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (fundi_id, skill_id),
    INDEX idx_fundi_skills_proficiency (proficiency_level)
);

-- Employer Profiles
CREATE TABLE employer_profiles (
    id UUID PRIMARY KEY REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    business_registration_number VARCHAR(50) UNIQUE,
    company_type ENUM('individual', 'small_business', 'corporation', 'ngo', 'government'),
    industry_sector VARCHAR(100),
    company_size VARCHAR(50),
    website VARCHAR(255),
    contact_person_name VARCHAR(200),
    contact_person_title VARCHAR(100),
    business_phone VARCHAR(20),
    
    -- Business verification
    business_permit_url TEXT,
    kra_pin VARCHAR(20) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    credit_score INT,
    
    -- Address
    physical_address TEXT,
    county VARCHAR(100),
    sub_county VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Preferences
    preferred_communication ENUM('email', 'phone', 'whatsapp') DEFAULT 'email',
    notification_preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_employer_verified (is_verified),
    INDEX idx_employer_location (county, sub_county)
);

-- Job Postings with partitioning
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES employer_profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    skill_required_id INT REFERENCES skills(id),
    
    -- Location
    job_location_type ENUM('onsite', 'remote', 'hybrid') DEFAULT 'onsite',
    county VARCHAR(100),
    sub_county VARCHAR(100),
    specific_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Timing
    start_date DATE NOT NULL,
    estimated_duration_days INT,
    start_time TIME,
    end_time TIME,
    is_flexible_hours BOOLEAN DEFAULT FALSE,
    
    -- Compensation
    payment_type ENUM('hourly', 'daily', 'fixed', 'milestone') NOT NULL,
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    is_negotiable BOOLEAN DEFAULT FALSE,
    
    -- Requirements
    required_experience_years INT,
    required_certifications JSONB,
    required_tools JSONB,
    number_of_fundis_needed INT DEFAULT 1,
    
    -- Status
    status ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    visibility ENUM('public', 'private', 'invite_only') DEFAULT 'public',
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    view_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    shortlist_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_jobs_employer (employer_id),
    INDEX idx_jobs_skill (skill_required_id),
    INDEX idx_jobs_location (county, sub_county),
    INDEX idx_jobs_status_date (status, start_date),
    INDEX idx_jobs_budget (budget_min, budget_max),
    
    CONSTRAINT valid_budget CHECK (budget_min <= budget_max)
) PARTITION BY RANGE (start_date);

-- Job Applications with detailed tracking
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_postings(id),
    fundi_id UUID REFERENCES fundi_profiles(id),
    
    -- Application details
    cover_note TEXT,
    proposed_rate DECIMAL(10, 2),
    available_from DATE,
    estimated_completion_days INT,
    
    -- Status tracking
    status ENUM(
        'pending', 'shortlisted', 'interview_scheduled', 
        'offered', 'accepted', 'rejected', 'withdrawn', 'hired'
    ) DEFAULT 'pending',
    
    -- Interview scheduling
    interview_date TIMESTAMPTZ,
    interview_notes TEXT,
    interview_feedback TEXT,
    
    -- Offer details
    offered_rate DECIMAL(10, 2),
    offer_accepted_at TIMESTAMPTZ,
    offer_declined_at TIMESTAMPTZ,
    offer_expires_at TIMESTAMPTZ,
    
    -- Timeline
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    shortlisted_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    
    -- Matching scores
    skill_match_score INT CHECK (skill_match_score BETWEEN 0 AND 100),
    experience_match_score INT CHECK (experience_match_score BETWEEN 0 AND 100),
    location_match_score INT CHECK (location_match_score BETWEEN 0 AND 100),
    overall_match_score INT CHECK (overall_match_score BETWEEN 0 AND 100),
    
    UNIQUE(job_id, fundi_id),
    INDEX idx_applications_status (status),
    INDEX idx_applications_fundi (fundi_id),
    INDEX idx_applications_match (overall_match_score)
);

-- Contracts and Agreements
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_postings(id),
    fundi_id UUID REFERENCES fundi_profiles(id),
    employer_id UUID REFERENCES employer_profiles(id),
    application_id UUID REFERENCES job_applications(id),
    
    -- Contract details
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Terms
    start_date DATE NOT NULL,
    end_date DATE,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_terms TEXT,
    payment_schedule JSONB,
    
    -- Legal
    terms_and_conditions TEXT,
    special_clauses TEXT,
    jurisdiction VARCHAR(100) DEFAULT 'Kenya',
    
    -- Status
    status ENUM(
        'draft', 'sent', 'viewed', 'accepted', 
        'declined', 'active', 'completed', 'terminated'
    ) DEFAULT 'draft',
    
    -- Signatures
    fundi_signed_at TIMESTAMPTZ,
    employer_signed_at TIMESTAMPTZ,
    fundi_signature_ip INET,
    employer_signature_ip INET,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    INDEX idx_contracts_job (job_id),
    INDEX idx_contracts_status (status),
    INDEX idx_contracts_dates (start_date, end_date)
);

-- Payment Transactions (partitioned by date)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    
    -- Parties
    payer_id UUID NOT NULL,
    payer_type ENUM('employer', 'fundi') NOT NULL,
    payee_id UUID NOT NULL,
    payee_type ENUM('employer', 'fundi') NOT NULL,
    contract_id UUID REFERENCES contracts(id),
    
    -- Amounts
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount - platform_fee - tax_amount) STORED,
    currency VARCHAR(3) DEFAULT 'KES',
    
    -- Payment details
    payment_method ENUM(
        'mpesa', 'bank_transfer', 'card', 
        'cash', 'wallet'
    ) NOT NULL,
    provider_reference VARCHAR(255),
    payment_status ENUM(
        'pending', 'processing', 'completed', 
        'failed', 'refunded', 'disputed'
    ) DEFAULT 'pending',
    
    -- Escrow
    is_escrow BOOLEAN DEFAULT TRUE,
    escrow_released_at TIMESTAMPTZ,
    escrow_release_condition TEXT,
    
    -- Timeline
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    INDEX idx_payments_payer (payer_id, payer_type),
    INDEX idx_payments_payee (payee_id, payee_type),
    INDEX idx_payments_status (payment_status),
    INDEX idx_payments_reference (transaction_reference),
    INDEX idx_payments_date (initiated_at)
) PARTITION BY RANGE (initiated_at);

-- Rating and Review System
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    rater_id UUID NOT NULL,
    rater_type ENUM('employer', 'fundi') NOT NULL,
    ratee_id UUID NOT NULL,
    ratee_type ENUM('employer', 'fundi') NOT NULL,
    
    -- Rating criteria
    overall_rating DECIMAL(2, 1) CHECK (overall_rating BETWEEN 0 AND 5),
    quality_rating DECIMAL(2, 1) CHECK (quality_rating BETWEEN 0 AND 5),
    communication_rating DECIMAL(2, 1) CHECK (communication_rating BETWEEN 0 AND 5),
    punctuality_rating DECIMAL(2, 1) CHECK (punctuality_rating BETWEEN 0 AND 5),
    value_rating DECIMAL(2, 1) CHECK (value_rating BETWEEN 0 AND 5),
    
    -- Review
    review_text TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Response
    response_text TEXT,
    responded_at TIMESTAMPTZ,
    
    -- Flags
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    report_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(contract_id, rater_id),
    INDEX idx_ratings_ratee (ratee_id, ratee_type),
    INDEX idx_ratings_contract (contract_id),
    INDEX idx_ratings_value (overall_rating)
);

-- Notification System with delivery tracking
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    -- Content
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT NOT NULL,
    data JSONB,
    
    -- Delivery
    channels JSONB NOT NULL, -- ['email', 'sms', 'push', 'whatsapp']
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Status tracking
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Retry logic
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    last_error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_notifications_user (user_id, status),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at)
) PARTITION BY RANGE (created_at);

-- Audit Logging (critical for compliance)
CREATE TABLE audit_logs (
    id BIGSERIAL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_action_time (action, timestamp)
) PARTITION BY RANGE (timestamp);

-- Verification Queue
CREATE TABLE verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    verification_type ENUM(
        'id_verification', 'address_verification', 
        'business_verification', 'skill_certification'
    ) NOT NULL,
    
    -- Documents
    document_urls TEXT[],
    document_metadata JSONB,
    
    -- Status
    status ENUM('pending', 'in_progress', 'approved', 'rejected') DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Priority
    priority INT DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    INDEX idx_verification_status (status),
    INDEX idx_verification_assigned (assigned_to)
);
4.2 Data Partitioning Strategy
sql
-- Automated partition management
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    -- Create partitions for the next 3 months
    FOR i IN 0..2 LOOP
        start_date := date_trunc('month', now() + (i || ' months')::interval)::date;
        end_date := (date_trunc('month', now() + ((i+1) || ' months')::interval) - interval '1 day')::date;
        partition_name := 'job_postings_' || to_char(start_date, 'YYYY_MM');
        
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I PARTITION OF job_postings
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date + interval '1 day'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
4.3 Data Archival Policy
yaml
archival_policy:
  job_postings:
    active: 6 months
    archive: 2 years
    delete: 7 years
    
  payment_transactions:
    active: 1 year
    archive: 7 years (legal requirement)
    delete: 10 years
    
  user_data:
    active: account active
    soft_delete: 30 days after closure
    hard_delete: 90 days after closure
    
  audit_logs:
    hot_storage: 90 days
    warm_storage: 1 year
    cold_storage: 7 years (S3/Glacier)
5. API Design & Integration Layer
5.1 RESTful API Specifications
yaml
openapi: 3.0.0
info:
  title: WorkForge Enterprise API
  version: 2.0.0
  description: Enterprise workforce matching platform API

servers:
  - url: https://api.workforge.co.ke/v2
    description: Production server
  - url: https://staging-api.workforge.co.ke/v2
    description: Staging server

security:
  - bearerAuth: []
  - apiKeyAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  parameters:
    LimitParam:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
      description: Number of items to return
    OffsetParam:
      name: offset
      in: query
      schema:
        type: integer
        minimum: 0
        default: 0
      description: Number of items to skip

paths:
  # Authentication & Authorization
  /auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - phone
                - password
                - user_type
              properties:
                email:
                  type: string
                  format: email
                phone:
                  type: string
                  pattern: '^254[0-9]{9}$'
                  description: Kenyan phone number format
                password:
                  type: string
                  minLength: 8
                user_type:
                  type: string
                  enum: [fundi, employer]
                first_name:
                  type: string
                last_name:
                  type: string
                referral_code:
                  type: string
      responses:
        201:
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id:
                    type: string
                    format: uuid
                  requires_verification:
                    type: boolean
                  access_token:
                    type: string
                  refresh_token:
                    type: string
        400:
          description: Validation error
        409:
          description: User already exists

  /auth/verify/phone:
    post:
      summary: Verify phone number with OTP
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone
                - otp
              properties:
                phone:
                  type: string
                otp:
                  type: string
                  pattern: '^[0-9]{6}$'
      responses:
        200:
          description: Phone verified successfully
        401:
          description: Invalid OTP

  # Fundi Management
  /fundis/profile:
    get:
      summary: Get fundi profile
      tags: [Fundis]
      security:
        - bearerAuth: []
      responses:
        200:
          description: Fundi profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FundiProfile'
        401:
          description: Unauthorized
        404:
          description: Profile not found

    put:
      summary: Update fundi profile
      tags: [Fundis]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FundiProfileUpdate'
      responses:
        200:
          description: Profile updated
        422:
          description: Validation error

  /fundis/{fundi_id}/skills:
    post:
      summary: Add skill to fundi profile
      tags: [Fundis]
      security:
        - bearerAuth: []
      parameters:
        - name: fundi_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - skill_id
                - proficiency_level
              properties:
                skill_id:
                  type: integer
                proficiency_level:
                  type: string
                  enum: [beginner, intermediate, expert, master]
                years_experience:
                  type: integer
                hourly_rate:
                  type: number
                  format: float
                has_certification:
                  type: boolean
                certification_details:
                  type: object
      responses:
        201:
          description: Skill added
        400:
          description: Invalid skill or level

  /fundis/search:
    get:
      summary: Search fundis with advanced filters
      tags: [Fundis]
      parameters:
        - name: skill_id
          in: query
          schema:
            type: integer
        - name: county
          in: query
          schema:
            type: string
        - name: sub_county
          in: query
          schema:
            type: string
        - name: min_rating
          in: query
          schema:
            type: number
            minimum: 0
            maximum: 5
        - name: max_hourly_rate
          in: query
          schema:
            type: number
        - name: min_experience
          in: query
          schema:
            type: integer
        - name: availability
          in: query
          schema:
            type: string
            enum: [available, busy, any]
        - name: verified_only
          in: query
          schema:
            type: boolean
        - name: has_tools
          in: query
          schema:
            type: array
            items:
              type: string
        - name: sort_by
          in: query
          schema:
            type: string
            enum: [rating, experience, price_low, price_high, distance]
        - $ref: '#/components/parameters/LimitParam'
        - $ref: '#/components/parameters/OffsetParam'
      responses:
        200:
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:
                    type: integer
                  results:
                    type: array
                    items:
                      $ref: '#/components/schemas/FundiSearchResult'
                  aggregations:
                    type: object
                    properties:
                      by_skill:
                        type: object
                      by_county:
                        type: object
                      by_rating:
                        type: object

  # Job Management
  /jobs:
    post:
      summary: Create new job posting
      tags: [Jobs]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobCreate'
      responses:
        201:
          description: Job created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

    get:
      summary: List jobs with filters
      tags: [Jobs]
      parameters:
        - name: employer_id
          in: query
          schema:
            type: string
            format: uuid
        - name: skill_id
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: array
            items:
              type: string
              enum: [draft, published, in_progress, completed]
        - name: from_date
          in: query
          schema:
            type: string
            format: date
        - name: to_date
          in: query
          schema:
            type: string
            format: date
        - name: min_budget
          in: query
          schema:
            type: number
        - name: max_budget
          in: query
          schema:
            type: number
        - $ref: '#/components/parameters/LimitParam'
        - $ref: '#/components/parameters/OffsetParam'
      responses:
        200:
          description: Jobs retrieved

  /jobs/{job_id}/match:
    get:
      summary: Get matching fundis for job
      tags: [Jobs]
      security:
        - bearerAuth: []
      parameters:
        - name: job_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: min_match_score
          in: query
          schema:
            type: integer
            minimum: 0
            maximum: 100
            default: 60
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        200:
          description: Matching fundis
          content:
            application/json:
              schema:
                type: object
                properties:
                  job_details:
                    $ref: '#/components/schemas/Job'
                  matches:
                    type: array
                    items:
                      type: object
                      properties:
                        fundi:
                          $ref: '#/components/schemas/FundiBasic'
                        match_score:
                          type: integer
                        skill_match:
                          type: integer
                        location_match:
                          type: integer
                        availability_match:
                          type: boolean
                        estimated_cost:
                          type: number

  /jobs/{job_id}/apply:
    post:
      summary: Apply for job
      tags: [Jobs]
      security:
        - bearerAuth: []
      parameters:
        - name: job_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                proposed_rate:
                  type: number
                cover_note:
                  type: string
                available_from:
                  type: string
                  format: date
                estimated_days:
                  type: integer
      responses:
        201:
          description: Application submitted
        400:
          description: Already applied or job not accepting applications

  # Payments
  /payments/escrow/create:
    post:
      summary: Create escrow for contract
      tags: [Payments]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - contract_id
                - amount
              properties:
                contract_id:
                  type: string
                  format: uuid
                amount:
                  type: number
                payment_method:
                  type: string
                  enum: [mpesa, card, bank]
      responses:
        201:
          description: Escrow created
          content:
            application/json:
              schema:
                type: object
                properties:
                  escrow_id:
                    type: string
                  payment_reference:
                    type: string
                  stk_push:
                    type: object
                    description: For M-Pesa payments

  /payments/escrow/release:
    post:
      summary: Release escrow payment
      tags: [Payments]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - contract_id
              properties:
                contract_id:
                  type: string
                  format: uuid
                release_notes:
                  type: string
      responses:
        200:
          description: Payment released
        400:
          description: Cannot release (dispute active, etc.)

  # M-Pesa Integration
  /payments/mpesa/stk-push:
    post:
      summary: Initiate STK Push payment
      tags: [Payments, M-Pesa]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone
                - amount
                - reference
              properties:
                phone:
                  type: string
                  pattern: '^254[0-9]{9}$'
                amount:
                  type: number
                  minimum: 10
                reference:
                  type: string
                description:
                  type: string
      responses:
        202:
          description: STK Push initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  checkout_request_id:
                    type: string
                  merchant_request_id:
                    type: string
                  response_code:
                    type: string
                  response_description:
                    type: string

  /payments/mpesa/callback:
    post:
      summary: M-Pesa payment callback
      tags: [Payments, M-Pesa]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        200:
          description: Callback received

  # Verification
  /verification/queue:
    post:
      summary: Submit for verification
      tags: [Verification]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - verification_type
              properties:
                verification_type:
                  type: string
                  enum: [id_verification, business_verification, skill_certification]
                documents:
                  type: array
                  items:
                    type: string
                    format: binary
                metadata:
                  type: string
                  description: JSON string of metadata
      responses:
        202:
          description: Submitted for verification
          content:
            application/json:
              schema:
                type: object
                properties:
                  queue_id:
                    type: string
                  estimated_completion:
                    type: string
                    format: date-time

  # Analytics & Reporting
  /analytics/employer/{employer_id}/dashboard:
    get:
      summary: Get employer dashboard metrics
      tags: [Analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: employer_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: period
          in: query
          schema:
            type: string
            enum: [week, month, quarter, year]
            default: month
      responses:
        200:
          description: Dashboard data
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_jobs_posted:
                    type: integer
                  jobs_completed:
                    type: integer
                  total_spent:
                    type: number
                  average_rating:
                    type: number
                  top_skills_hired:
                    type: array
                  recent_jobs:
                    type: array
                  spending_trend:
                    type: array
                  satisfaction_metrics:
                    type: object

  /analytics/fundi/{fundi_id}/earnings:
    get:
      summary: Get fundi earnings report
      tags: [Analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: fundi_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: from_date
          in: query
          required: true
          schema:
            type: string
            format: date
        - name: to_date
          in: query
          required: true
          schema:
            type: string
            format: date
      responses:
        200:
          description: Earnings data
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_earned:
                    type: number
                  platform_fees:
                    type: number
                  net_earnings:
                    type: number
                  jobs_completed:
                    type: integer
                  average_per_job:
                    type: number
                  daily_breakdown:
                    type: array
                  projected_earnings:
                    type: number

components:
  schemas:
    FundiProfile:
      type: object
      properties:
        id:
          type: string
          format: uuid
        personal_info:
          type: object
          properties:
            first_name:
              type: string
            last_name:
              type: string
            phone:
              type: string
            email:
              type: string
            profile_photo:
              type: string
        location:
          type: object
          properties:
            county:
              type: string
            sub_county:
              type: string
            ward:
              type: string
            coordinates:
              type: object
              properties:
                lat:
                  type: number
                lng:
                  type: number
        skills:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              category:
                type: string
              proficiency:
                type: string
              years_experience:
                type: integer
              hourly_rate:
                type: number
        verification:
          type: object
          properties:
            level:
              type: integer
            id_verified:
              type: boolean
            phone_verified:
              type: boolean
            skills_verified:
              type: integer
        stats:
          type: object
          properties:
            jobs_completed:
              type: integer
            rating:
              type: number
            response_time:
              type: number
            completion_rate:
              type: number

    JobCreate:
      type: object
      required:
        - title
        - description
        - skill_required_id
        - start_date
        - payment_type
      properties:
        title:
          type: string
          maxLength: 255
        description:
          type: string
          maxLength: 5000
        skill_required_id:
          type: integer
        county:
          type: string
        sub_county:
          type: string
        specific_address:
          type: string
        start_date:
          type: string
          format: date
        estimated_duration_days:
          type: integer
        payment_type:
          type: string
          enum: [hourly, daily, fixed, milestone]
        budget_min:
          type: number
        budget_max:
          type: number
        required_experience_years:
          type: integer
        required_tools:
          type: array
          items:
            type: string
        number_of_fundis_needed:
          type: integer
          default: 1

    FundiSearchResult:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        photo:
          type: string
        rating:
          type: number
        jobs_completed:
          type: integer
        primary_skill:
          type: string
        hourly_rate:
          type: number
        distance_km:
          type: number
        availability:
          type: string
        verified:
          type: boolean
        response_rate:
          type: number
        last_active:
          type: string
          format: date-time
5.2 GraphQL Schema (for complex queries)
graphql
type Query {
  # Enhanced search with GraphQL
  searchFundis(
    filter: FundiFilterInput!
    sort: FundiSortInput
    pagination: PaginationInput
  ): FundiSearchResult!
  
  getJobWithDetails(jobId: ID!): JobDetails
  
  getMatchingInsights(jobId: ID!): MatchingInsights!
  
  getMarketRates(skillId: ID!, county: String): MarketRateAnalysis!
}

type Mutation {
  submitBulkVerification(fundiIds: [ID!]!): VerificationBatch!
  
  createJobWithTemplates(jobData: JobInput!, templateId: ID): Job
  
  initiateBulkHiring(jobId: ID!, fundiIds: [ID!]!): BulkHireResult!
  
  processPayroll(employerId: ID!, period: DateRange!): PayrollResult!
}

type Subscription {
  jobMatches(jobId: ID!): MatchUpdate!
  
  applicationStatus(applicationId: ID!): ApplicationStatus!
  
  paymentConfirmation(transactionId: ID!): PaymentUpdate!
}

type JobDetails implements Node {
  id: ID!
  title: String!
  description: String!
  employer: Employer!
  requiredSkill: Skill!
  matchedFundis: [MatchedFundi!]!
  applications: [Application!]!
  status: JobStatus!
  timeline: JobTimeline!
  payments: [Payment!]!
  ratings: [Rating!]!
  analytics: JobAnalytics!
}

type MatchingInsights {
  jobRequirements: JobRequirements!
  marketAnalysis: MarketAnalysis!
  recommendedFundis: [RecommendedFundi!]!
  alternativeSkills: [Skill!]!
  priceOptimization: PriceOptimization!
  locationHeatmap: LocationHeatmap!
}
5.3 WebSocket Events for Real-time Features
typescript
// Real-time event definitions
interface WebSocketEvents {
  // Job matching events
  'match:found': {
    jobId: string;
    fundiId: string;
    matchScore: number;
    timestamp: string;
  }
  
  // Application events
  'application:status_changed': {
    applicationId: string;
    oldStatus: ApplicationStatus;
    newStatus: ApplicationStatus;
    updatedBy: string;
  }
  
  // Payment events
  'payment:received': {
    transactionId: string;
    amount: number;
    from: string;
    status: 'pending' | 'completed';
  }
  
  // Chat/messaging
  'message:new': {
    conversationId: string;
    message: Message;
    sender: UserInfo;
  }
  
  // Verification updates
  'verification:completed': {
    userId: string;
    verificationType: string;
    status: 'approved' | 'rejected';
  }
  
  // Location tracking
  'location:update': {
    fundiId: string;
    coordinates: [number, number];
    accuracy: number;
    timestamp: string;
  }
}
6. Frontend Architecture & Component Library
6.1 Component Hierarchy & Design System
typescript
// design-system.ts - Enterprise design tokens
export const designTokens = {
  colors: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#0056d2', // Primary brand color
      600: '#0045a8',
      700: '#00347e',
      800: '#002254',
      900: '#00112a',
    },
    secondary: {
      500: '#ff6b35', // Accent color for CTAs
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
};

// components/FundiCard/FundiCard.tsx
import React, { memo } from 'react';
import styled from 'styled-components';
import { designTokens } from '../../design-system';

interface FundiCardProps {
  fundi: Fundi;
  onSelect?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
}

const Card = styled.div<{ variant: string }>`
  background: white;
  border-radius: ${designTokens.spacing[3]};
  box-shadow: ${designTokens.shadows.md};
  padding: ${props => props.variant === 'compact' 
    ? designTokens.spacing[4] 
    : designTokens.spacing[6]};
  transition: all ${designTokens.animation.duration.normal} 
    ${designTokens.animation.easing.easeInOut};
  
  &:hover {
    box-shadow: ${designTokens.shadows.lg};
    transform: translateY(-2px);
  }
  
  @media (max-width: ${designTokens.breakpoints.md}) {
    padding: ${designTokens.spacing[3]};
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[4]};
  margin-bottom: ${designTokens.spacing[4]};
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${designTokens.colors.primary[200]};
  
  @media (max-width: ${designTokens.breakpoints.sm}) {
    width: 48px;
    height: 48px;
  }
`;

const Name = styled.h3`
  font-family: ${designTokens.typography.fontFamily.sans};
  font-size: ${designTokens.typography.fontSize.lg};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.neutral[900]};
  margin: 0;
`;

const Badge = styled.span<{ type: 'verified' | 'rating' | 'skill' }>`
  display: inline-flex;
  align-items: center;
  padding: ${designTokens.spacing[1]} ${designTokens.spacing[2]};
  border-radius: ${designTokens.spacing[2]};
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  
  ${props => props.type === 'verified' && `
    background: ${designTokens.colors.success}15;
    color: ${designTokens.colors.success};
  `}
  
  ${props => props.type === 'rating' && `
    background: ${designTokens.colors.warning}15;
    color: ${designTokens.colors.warning};
  `}
  
  ${props => props.type === 'skill' && `
    background: ${designTokens.colors.primary[50]};
    color: ${designTokens.colors.primary[700]};
  `}
`;

const SkillTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${designTokens.spacing[2]};
  margin: ${designTokens.spacing[3]} 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${designTokens.spacing[4]};
  margin: ${designTokens.spacing[4]} 0;
  
  @media (max-width: ${designTokens.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${designTokens.spacing[2]};
  }
`;

const StatItem = styled.div`
  text-align: center;
  
  .value {
    font-size: ${designTokens.typography.fontSize['2xl']};
    font-weight: ${designTokens.typography.fontWeight.bold};
    color: ${designTokens.colors.primary[600]};
    line-height: 1.2;
  }
  
  .label {
    font-size: ${designTokens.typography.fontSize.sm};
    color: ${designTokens.colors.neutral[500]};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
  border-radius: ${designTokens.spacing[2]};
  font-weight: ${designTokens.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${designTokens.animation.duration.fast} ease;
  
  ${props => props.primary ? `
    background: ${designTokens.colors.primary[500]};
    color: white;
    border: none;
    
    &:hover {
      background: ${designTokens.colors.primary[600]};
      transform: translateY(-1px);
      box-shadow: ${designTokens.shadows.md};
    }
  ` : `
    background: white;
    color: ${designTokens.colors.primary[500]};
    border: 1px solid ${designTokens.colors.primary[200]};
    
    &:hover {
      background: ${designTokens.colors.primary[50]};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

export const FundiCard: React.FC<FundiCardProps> = memo(({
  fundi,
  onSelect,
  variant = 'compact',
  showActions = true,
  className
}) => {
  return (
    <Card variant={variant} className={className}>
      <ProfileHeader>
        <Avatar src={fundi.profilePhoto} alt={fundi.name} />
        <div>
          <Name>{fundi.name}</Name>
          <div style={{ display: 'flex', gap: designTokens.spacing[2], marginTop: designTokens.spacing[1] }}>
            {fundi.isVerified && (
              <Badge type="verified">
                ✓ Verified
              </Badge>
            )}
            <Badge type="rating">
              ★ {fundi.rating.toFixed(1)}
            </Badge>
          </div>
        </div>
      </ProfileHeader>
      
      {variant === 'detailed' && (
        <>
          <SkillTags>
            {fundi.skills.slice(0, 5).map(skill => (
              <Badge key={skill.id} type="skill">
                {skill.name}
              </Badge>
            ))}
            {fundi.skills.length > 5 && (
              <Badge type="skill">
                +{fundi.skills.length - 5}
              </Badge>
            )}
          </SkillTags>
          
          <StatsGrid>
            <StatItem>
              <div className="value">{fundi.jobsCompleted}</div>
              <div className="label">Jobs</div>
            </StatItem>
            <StatItem>
              <div className="value">{fundi.experienceYears}+</div>
              <div className="label">Years</div>
            </StatItem>
            <StatItem>
              <div className="value">KES {fundi.hourlyRate}</div>
              <div className="label">/hr</div>
            </StatItem>
          </StatsGrid>
          
          {fundi.availability && (
            <div style={{ 
              padding: designTokens.spacing[3],
              background: designTokens.colors.neutral[50],
              borderRadius: designTokens.spacing[2],
              marginBottom: designTokens.spacing[4]
            }}>
              <div style={{ fontWeight: designTokens.typography.fontWeight.medium }}>
                Next available: {new Date(fundi.nextAvailable).toLocaleDateString()}
              </div>
              <div style={{ fontSize: designTokens.typography.fontSize.sm, color: designTokens.colors.neutral[600] }}>
                Within {fundi.serviceRadius}km
              </div>
            </div>
          )}
        </>
      )}
      
      {showActions && (
        <div style={{ 
          display: 'flex', 
          gap: designTokens.spacing[2],
          marginTop: variant === 'compact' ? designTokens.spacing[3] : 0
        }}>
          <ActionButton 
            primary 
            onClick={() => onSelect?.(fundi.id)}
            style={{ flex: 1 }}
          >
            {variant === 'compact' ? 'View Profile' : 'Hire Now'}
          </ActionButton>
          <ActionButton>
            Message
          </ActionButton>
        </div>
      )}
    </Card>
  );
});

// components/JobPostForm/JobPostForm.tsx
import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { designTokens } from '../../design-system';

const FormContainer = styled.form`
  max-width: 800px;
  margin: 0 auto;
  padding: ${designTokens.spacing[8]};
  background: white;
  border-radius: ${designTokens.spacing[4]};
  box-shadow: ${designTokens.shadows.lg};
`;

const FormSection = styled.section`
  margin-bottom: ${designTokens.spacing[8]};
  
  h3 {
    font-size: ${designTokens.typography.fontSize.xl};
    font-weight: ${designTokens.typography.fontWeight.semibold};
    color: ${designTokens.colors.neutral[800]};
    margin-bottom: ${designTokens.spacing[4]};
    padding-bottom: ${designTokens.spacing[2]};
    border-bottom: 2px solid ${designTokens.colors.primary[100]};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${designTokens.spacing[4]};
  
  @media (max-width: ${designTokens.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${designTokens.spacing[4]};
`;

const Label = styled.label`
  display: block;
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  color: ${designTokens.colors.neutral[700]};
  margin-bottom: ${designTokens.spacing[1]};
  
  .required {
    color: ${designTokens.colors.error};
    margin-left: ${designTokens.spacing[1]};
  }
`;

const Input = styled.input<{ error?: boolean }>`
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: 1px solid ${props => props.error 
    ? designTokens.colors.error 
    : designTokens.colors.neutral[300]};
  border-radius: ${designTokens.spacing[2]};
  font-size: ${designTokens.typography.fontSize.base};
  transition: all ${designTokens.animation.duration.fast};
  
  &:focus {
    outline: none;
    border-color: ${designTokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${designTokens.colors.primary[100]};
  }
  
  &:disabled {
    background: ${designTokens.colors.neutral[100]};
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea<{ error?: boolean }>`
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: 1px solid ${props => props.error 
    ? designTokens.colors.error 
    : designTokens.colors.neutral[300]};
  border-radius: ${designTokens.spacing[2]};
  font-size: ${designTokens.typography.fontSize.base};
  min-height: 120px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${designTokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${designTokens.colors.primary[100]};
  }
`;

const Select = styled.select<{ error?: boolean }>`
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: 1px solid ${props => props.error 
    ? designTokens.colors.error 
    : designTokens.colors.neutral[300]};
  border-radius: ${designTokens.spacing[2]};
  font-size: ${designTokens.typography.fontSize.base};
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${designTokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${designTokens.colors.primary[100]};
  }
`;

const ErrorMessage = styled.span`
  display: block;
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.error};
  margin-top: ${designTokens.spacing[1]};
`;

const PriceInput = styled.div`
  position: relative;
  
  &::before {
    content: 'KES';
    position: absolute;
    left: ${designTokens.spacing[4]};
    top: 50%;
    transform: translateY(-50%);
    color: ${designTokens.colors.neutral[500]};
    font-weight: ${designTokens.typography.fontWeight.medium};
  }
  
  input {
    padding-left: 60px;
  }
`;

const SkillSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${designTokens.spacing[2]};
  padding: ${designTokens.spacing[3]};
  background: ${designTokens.colors.neutral[50]};
  border-radius: ${designTokens.spacing[2]};
  min-height: 100px;
`;

const SkillChip = styled.button<{ selected: boolean }>`
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
  border-radius: ${designTokens.spacing[8]};
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${designTokens.animation.duration.fast};
  border: 1px solid transparent;
  
  ${props => props.selected ? `
    background: ${designTokens.colors.primary[500]};
    color: white;
    border-color: ${designTokens.colors.primary[500]};
    
    &:hover {
      background: ${designTokens.colors.primary[600]};
    }
  ` : `
    background: white;
    color: ${designTokens.colors.neutral[700]};
    border-color: ${designTokens.colors.neutral[200]};
    
    &:hover {
      background: ${designTokens.colors.neutral[100]};
      border-color: ${designTokens.colors.primary[300]};
    }
  `}
`;

const DateTimePicker = styled.input`
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: 1px solid ${designTokens.colors.neutral[300]};
  border-radius: ${designTokens.spacing[2]};
  font-family: ${designTokens.typography.fontFamily.sans};
  
  &:focus {
    outline: none;
    border-color: ${designTokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${designTokens.colors.primary[100]};
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${designTokens.spacing[4]};
  margin-top: ${designTokens.spacing[8]};
  padding-top: ${designTokens.spacing[6]};
  border-top: 1px solid ${designTokens.colors.neutral[200]};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[6]};
  border-radius: ${designTokens.spacing[2]};
  font-weight: ${designTokens.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${designTokens.animation.duration.fast};
  min-width: 120px;
  
  ${props => {
    switch(props.variant) {
      case 'primary':
        return `
          background: ${designTokens.colors.primary[500]};
          color: white;
          border: none;
          
          &:hover {
            background: ${designTokens.colors.primary[600]};
            transform: translateY(-1px);
            box-shadow: ${designTokens.shadows.md};
          }
        `;
      case 'secondary':
        return `
          background: ${designTokens.colors.secondary[500]};
          color: white;
          border: none;
          
          &:hover {
            background: ${designTokens.colors.secondary[600]};
            transform: translateY(-1px);
            box-shadow: ${designTokens.shadows.md};
          }
        `;
      default:
        return `
          background: white;
          color: ${designTokens.colors.neutral[700]};
          border: 1px solid ${designTokens.colors.neutral[300]};
          
          &:hover {
            background: ${designTokens.colors.neutral[50]};
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const schema = yup.object().shape({
  title: yup.string().required('Job title is required').max(255),
  description: yup.string().required('Job description is required').max(5000),
  skillRequired: yup.number().required('Please select a required skill'),
  county: yup.string().required('County is required'),
  subCounty: yup.string().required('Sub-county is required'),
  startDate: yup.date().required('Start date is required').min(new Date(), 'Start date must be in the future'),
  estimatedDuration: yup.number().positive().integer(),
  paymentType: yup.string().required('Payment type is required'),
  budgetMin: yup.number().positive().when('paymentType', {
    is: 'fixed',
    then: yup.number().required('Budget is required'),
    otherwise: yup.number().nullable()
  }),
  budgetMax: yup.number().positive().min(yup.ref('budgetMin'), 'Maximum budget must be greater than minimum'),
  requiredExperience: yup.number().min(0).integer(),
  numberOfFundis: yup.number().min(1).max(10).default(1)
});

interface JobPostFormProps {
  onSubmit: (data: JobFormData) => Promise<void>;
  initialData?: Partial<JobFormData>;
  isSubmitting?: boolean;
}

export const JobPostForm: React.FC<JobPostFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false
}) => {
  const [selectedSkills, setSelectedSkills] = useState<number[]>(
    initialData?.skillRequired ? [initialData.skillRequired] : []
  );
  
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      paymentType: 'fixed',
      numberOfFundis: 1
    }
  });
  
  const paymentType = watch('paymentType');
  
  const handleSkillSelect = useCallback((skillId: number) => {
    setSelectedSkills(prev => {
      const newSelection = [skillId]; // Single select for primary skill
      setValue('skillRequired', skillId);
      return newSelection;
    });
  }, [setValue]);
  
  const submitHandler = handleSubmit(async (data) => {
    await onSubmit(data as JobFormData);
  });
  
  return (
    <FormContainer onSubmit={submitHandler}>
      <FormSection>
        <h3>Basic Information</h3>
        <FormGroup>
          <Label>
            Job Title <span className="required">*</span>
          </Label>
          <Input
            {...register('title')}
            placeholder="e.g., Need experienced plumber for bathroom installation"
            error={!!errors.title}
          />
          {errors.title && <ErrorMessage>{errors.title.message}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label>
            Job Description <span className="required">*</span>
          </Label>
          <TextArea
            {...register('description')}
            placeholder="Describe the job in detail, including scope of work, requirements, and any special considerations..."
            error={!!errors.description}
          />
          {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
        </FormGroup>
      </FormSection>
      
      <FormSection>
        <h3>Skills & Requirements</h3>
        <FormGroup>
          <Label>
            Required Primary Skill <span className="required">*</span>
          </Label>
          <SkillSelector>
            {/* This would be populated from API */}
            <SkillChip
              selected={selectedSkills.includes(1)}
              onClick={() => handleSkillSelect(1)}
            >
              Plumbing
            </SkillChip>
            <SkillChip
              selected={selectedSkills.includes(2)}
              onClick={() => handleSkillSelect(2)}
            >
              Electrical
            </SkillChip>
            <SkillChip
              selected={selectedSkills.includes(3)}
              onClick={() => handleSkillSelect(3)}
            >
              Carpentry
            </SkillChip>
            <SkillChip
              selected={selectedSkills.includes(4)}
              onClick={() => handleSkillSelect(4)}
            >
              Painting
            </SkillChip>
            <SkillChip
              selected={selectedSkills.includes(5)}
              onClick={() => handleSkillSelect(5)}
            >
              Masonry
            </SkillChip>
          </SkillSelector>
          {errors.skillRequired && (
            <ErrorMessage>{errors.skillRequired.message}</ErrorMessage>
          )}
        </FormGroup>
        
        <FormGrid>
          <FormGroup>
            <Label>Years of Experience Required</Label>
            <Input
              {...register('requiredExperience')}
              type="number"
              min="0"
              placeholder="e.g., 3"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Number of Fundis Needed</Label>
            <Input
              {...register('numberOfFundis')}
              type="number"
              min="1"
              max="10"
            />
          </FormGroup>
        </FormGrid>
      </FormSection>
      
      <FormSection>
        <h3>Location & Schedule</h3>
        <FormGrid>
          <FormGroup>
            <Label>
              County <span className="required">*</span>
            </Label>
            <Select {...register('county')} error={!!errors.county}>
              <option value="">Select County</option>
              <option value="nairobi">Nairobi</option>
              <option value="mombasa">Mombasa</option>
              <option value="kisumu">Kisumu</option>
              <option value="nakuru">Nakuru</option>
            </Select>
            {errors.county && <ErrorMessage>{errors.county.message}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label>
              Sub-County <span className="required">*</span>
            </Label>
            <Input
              {...register('subCounty')}
              placeholder="e.g., Westlands"
              error={!!errors.subCounty}
            />
            {errors.subCounty && <ErrorMessage>{errors.subCounty.message}</ErrorMessage>}
          </FormGroup>
        </FormGrid>
        
        <FormGrid>
          <FormGroup>
            <Label>
              Start Date <span className="required">*</span>
            </Label>
            <DateTimePicker
              {...register('startDate')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              error={!!errors.startDate}
            />
            {errors.startDate && <ErrorMessage>{errors.startDate.message}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label>Estimated Duration (days)</Label>
            <Input
              {...register('estimatedDuration')}
              type="number"
              min="1"
              placeholder="e.g., 5"
            />
          </FormGroup>
        </FormGrid>
      </FormSection>
      
      <FormSection>
        <h3>Budget & Payment</h3>
        <FormGroup>
          <Label>
            Payment Type <span className="required">*</span>
          </Label>
          <Select {...register('paymentType')}>
            <option value="fixed">Fixed Price (One-time payment)</option>
            <option value="hourly">Hourly Rate</option>
            <option value="daily">Daily Rate</option>
            <option value="milestone">Milestone-based</option>
          </Select>
        </FormGroup>
        
        <FormGrid>
          <FormGroup>
            <Label>
              {paymentType === 'fixed' ? 'Total Budget' : 'Minimum Rate'} 
              {paymentType === 'fixed' && ' *'}
            </Label>
            <PriceInput>
              <Input
                {...register('budgetMin')}
                type="number"
                min="0"
                step="100"
                placeholder="0"
              />
            </PriceInput>
          </FormGroup>
          
          <FormGroup>
            <Label>
              {paymentType === 'fixed' ? 'Maximum Budget' : 'Maximum Rate'}
            </Label>
            <PriceInput>
              <Input
                {...register('budgetMax')}
                type="number"
                min="0"
                step="100"
                placeholder="0"
              />
            </PriceInput>
          </FormGroup>
        </FormGrid>
        
        {errors.budgetMin && (
          <ErrorMessage>{errors.budgetMin.message}</ErrorMessage>
        )}
        {errors.budgetMax && (
          <ErrorMessage>{errors.budgetMax.message}</ErrorMessage>
        )}
      </FormSection>
      
      <FormActions>
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Job'}
        </Button>
      </FormActions>
    </FormContainer>
  );
};
6.2 Page Templates & Layouts
typescript
// pages/EmployerDashboard/EmployerDashboard.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { designTokens } from '../../design-system';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatCard } from '../../components/StatCard/StatCard';
import { JobList } from '../../components/JobList/JobList';
import { ActivityFeed } from '../../components/ActivityFeed/ActivityFeed';
import { Chart } from '../../components/Chart/Chart';
import { useEmployerData } from '../../hooks/useEmployerData';

const DashboardContainer = styled.div`
  padding: ${designTokens.spacing[6]};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${designTokens.spacing[4]};
  margin-bottom: ${designTokens.spacing[8]};
  
  @media (max-width: ${designTokens.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${designTokens.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${designTokens.spacing[6]};
  
  @media (max-width: ${designTokens.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${designTokens.typography.fontSize.xl};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.neutral[800]};
  margin-bottom: ${designTokens.spacing[4]};
`;

export const EmployerDashboard: React.FC = () => {
  const { data, loading, error } = useEmployerData();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  if (loading) return <DashboardLayout loading />;
  if (error) return <DashboardLayout error={error} />;
  
  return (
    <DashboardLayout>
      <DashboardContainer>
        <StatsGrid>
          <StatCard
            title="Active Jobs"
            value={data.activeJobs}
            change={data.jobsChange}
            icon="briefcase"
            color="primary"
          />
          <StatCard
            title="Total Spent"
            value={`KES ${data.totalSpent.toLocaleString()}`}
            change={data.spentChange}
            icon="money"
            color="success"
          />
          <StatCard
            title="Active Fundis"
            value={data.activeFundis}
            change={data.fundisChange}
            icon="users"
            color="info"
          />
          <StatCard
            title="Avg. Rating"
            value={data.averageRating.toFixed(1)}
            change={data.ratingChange}
            icon="star"
            color="warning"
          />
        </StatsGrid>
        
        <ContentGrid>
          <div>
            <SectionTitle>Recent Job Postings</SectionTitle>
            <JobList jobs={data.recentJobs} />
          </div>
          
          <div>
            <SectionTitle>Activity Feed</SectionTitle>
            <ActivityFeed activities={data.recentActivities} />
          </div>
        </ContentGrid>
        
        <div style={{ marginTop: designTokens.spacing[8] }}>
          <SectionTitle>Spending Trends</SectionTitle>
          <Chart
            type="line"
            data={data.spendingTrend}
            options={{
              period: selectedPeriod,
              onPeriodChange: setSelectedPeriod
            }}
          />
        </div>
      </DashboardContainer>
    </DashboardLayout>
  );
};
6.3 Mobile-Responsive Components
typescript
// components/MobileNavigation/MobileNavigation.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { designTokens } from '../../design-system';
import { 
  Home, 
  Search, 
  Briefcase, 
  MessageCircle, 
  User,
  Menu,
  X 
} from 'lucide-react';

const MobileNavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid ${designTokens.colors.neutral[200]};
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
  display: none;
  z-index: 1000;
  
  @media (max-width: ${designTokens.breakpoints.md}) {
    display: block;
  }
`;

const NavItems = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const NavItem = styled.button<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${designTokens.spacing[1]};
  background: none;
  border: none;
  padding: ${designTokens.spacing[2]};
  cursor: pointer;
  color: ${props => props.active 
    ? designTokens.colors.primary[500] 
    : designTokens.colors.neutral[500]};
  
  span {
    font-size: ${designTokens.typography.fontSize.xs};
    font-weight: ${props => props.active ? designTokens.typography.fontWeight.medium : 'normal'};
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const MenuOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all ${designTokens.animation.duration.normal};
  z-index: 1001;
`;

const MenuDrawer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 80%;
  max-width: 300px;
  background: white;
  padding: ${designTokens.spacing[6]};
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform ${designTokens.animation.duration.normal};
  z-index: 1002;
  box-shadow: ${designTokens.shadows.lg};
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${designTokens.spacing[8]};
  
  h3 {
    font-size: ${designTokens.typography.fontSize.lg};
    font-weight: ${designTokens.typography.fontWeight.semibold};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${designTokens.colors.neutral[500]};
  }
`;

const MenuItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[2]};
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[3]};
  background: none;
  border: none;
  border-radius: ${designTokens.spacing[2]};
  cursor: pointer;
  color: ${designTokens.colors.neutral[700]};
  width: 100%;
  text-align: left;
  
  &:hover {
    background: ${designTokens.colors.neutral[50]};
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: ${designTokens.colors.neutral[500]};
  }
`;

export const MobileNavigation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <>
      <MobileNavContainer>
        <NavItems>
          <NavItem 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')}
          >
            <Home />
            <span>Home</span>
          </NavItem>
          
          <NavItem 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')}
          >
            <Search />
            <span>Search</span>
          </NavItem>
          
          <NavItem 
            active={activeTab === 'jobs'} 
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase />
            <span>Jobs</span>
          </NavItem>
          
          <NavItem 
            active={activeTab === 'messages'} 
            onClick={() => setActiveTab('messages')}
          >
            <MessageCircle />
            <span>Chat</span>
          </NavItem>
          
          <NavItem 
            active={activeTab === 'menu'} 
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu />
            <span>Menu</span>
          </NavItem>
        </NavItems>
      </MobileNavContainer>
      
      <MenuOverlay isOpen={isMenuOpen} onClick={() => setIsMenuOpen(false)} />
      
      <MenuDrawer isOpen={isMenuOpen}>
        <MenuHeader>
          <h3>Menu</h3>
          <button onClick={() => setIsMenuOpen(false)}>
            <X size={24} />
          </button>
        </MenuHeader>
        
        <MenuItems>
          <MenuItem onClick={() => {}}>
            <User />
            Profile
          </MenuItem>
          <MenuItem onClick={() => {}}>
            <Briefcase />
            My Jobs
          </MenuItem>
          <MenuItem onClick={() => {}}>
            <MessageCircle />
            Messages
          </MenuItem>
          <MenuItem onClick={() => {}}>
            Settings
          </MenuItem>
        </MenuItems>
      </MenuDrawer>
    </>
  );
};
7. Security & Compliance Framework
7.1 Security Architecture
python
# security/auth.py
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis.asyncio as redis
from cryptography.fernet import Fernet
import secrets

class SecurityManager:
    """Enterprise-grade security manager"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        self.fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        self.security = HTTPBearer()
    
    async def create_access_token(
        self, 
        user_id: str, 
        user_type: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token with proper claims"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode = {
            "sub": user_id,
            "type": user_type,
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": secrets.token_hex(16)  # Unique token ID
        }
        
        # Add to blacklist tracking
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        
        # Store token metadata in Redis for quick validation
        await self.redis_client.setex(
            f"token:{to_encode['jti']}",
            timedelta(hours=24),
            user_id
        )
        
        return encoded_jwt
    
    async def verify_token(
        self, 
        credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())
    ) -> Dict[str, Any]:
        """Verify JWT token and check blacklist"""
        token = credentials.credentials
        
        try:
            # Decode token
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Check if token is blacklisted
            if await self.redis_client.get(f"blacklist:{payload['jti']}"):
                raise HTTPException(
                    status_code=401,
                    detail="Token has been revoked"
                )
            
            # Check if token exists in active tokens
            if not await self.redis_client.exists(f"token:{payload['jti']}"):
                raise HTTPException(
                    status_code=401,
                    detail="Token expired or invalid"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    async def revoke_token(self, token_jti: str):
        """Revoke a specific token"""
        await self.redis_client.setex(
            f"blacklist:{token_jti}",
            timedelta(days=7),
            "revoked"
        )
        await self.redis_client.delete(f"token:{token_jti}")
    
    async def revoke_all_user_tokens(self, user_id: str):
        """Revoke all tokens for a user (logout all sessions)"""
        pattern = f"token:*"
        async for key in self.redis_client.scan_iter(pattern):
            if await self.redis_client.get(key) == user_id:
                token_jti = key.split(":")[1]
                await self.revoke_token(token_jti)
    
    def hash_password(self, password: str) -> str:
        """Hash password with bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode(), salt).decode()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode(), hashed.encode())
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data (IDs, phone numbers)"""
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted: str) -> str:
        """Decrypt sensitive data"""
        return self.fernet.decrypt(encrypted.encode()).decode()

# security/rate_limiter.py
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
import time

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Advanced rate limiting middleware"""
    
    def __init__(self, app, redis_client):
        super().__init__(app)
        self.redis = redis_client
        
    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP or user ID if authenticated)
        client_id = request.headers.get("X-Forwarded-For", request.client.host)
        
        # Different rate limits for different endpoints
        if "/api/auth/" in request.url.path:
            # Auth endpoints: stricter limits
            limit = 5
            window = 300  # 5 minutes
        elif "/api/payments/" in request.url.path:
            # Payment endpoints: moderate limits
            limit = 10
            window = 60  # 1 minute
        else:
            # General endpoints: standard limits
            limit = 100
            window = 60  # 1 minute
        
        # Check rate limit
        key = f"rate_limit:{client_id}:{request.url.path}"
        current = await self.redis.get(key)
        
        if current and int(current) >= limit:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Increment counter
        await self.redis.incr(key)
        await self.redis.expire(key, window)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(
            limit - int(await self.redis.get(key) or 0)
        )
        
        return response

# security/audit_logger.py
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID

AuditBase = declarative_base()

class AuditLog(AuditBase):
    """Audit log model for compliance"""
    
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True))
    action = Column(String(100))
    resource_type = Column(String(50))
    resource_id = Column(UUID(as_uuid=True))
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)

class AuditLogger:
    """Audit logging service"""
    
    def __init__(self):
        self.engine = create_engine(settings.AUDIT_DATABASE_URL)
        AuditBase.metadata.create_all(self.engine)
        self.logger = logging.getLogger("audit")
        
    async def log_action(
        self,
        user_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str],
        old_values: Optional[dict],
        new_values: Optional[dict],
        request
    ):
        """Log an action for audit purposes"""
        
        audit_entry = AuditLog(
            id=uuid.uuid4(),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.headers.get("X-Forwarded-For", request.client.host),
            user_agent=request.headers.get("User-Agent"),
            timestamp=datetime.utcnow()
        )
        
        # Store in database
        async with self.engine.begin() as conn:
            await conn.execute(
                AuditLog.__table__.insert(),
                audit_entry.__dict__
            )
        
        # Also log to file for redundancy
        self.logger.info(
            f"AUDIT|{audit_entry.timestamp}|{user_id}|{action}|"
            f"{resource_type}|{resource_id}"
        )
7.2 Data Privacy & GDPR Compliance
python
# privacy/data_privacy.py
from typing import List, Dict, Any
import hashlib
import hmac

class DataPrivacyManager:
    """Manage data privacy and GDPR compliance"""
    
    def __init__(self):
        self.sensitive_fields = [
            'id_number', 'kra_pin', 'nhif_number', 'nssf_number',
            'phone_number', 'email', 'bank_account', 'mpesa_number'
        ]
    
    def anonymize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize sensitive data for analytics"""
        anonymized = data.copy()
        
        for field in self.sensitive_fields:
            if field in anonymized:
                if 'phone' in field or 'email' in field:
                    # Hash contact info for matching while preserving privacy
                    anonymized[f"{field}_hash"] = hashlib.sha256(
                        str(anonymized[field]).encode()
                    ).hexdigest()
                    anonymized[field] = self.mask_value(anonymized[field])
                else:
                    anonymized[field] = self.mask_value(anonymized[field])
        
        return anonymized
    
    def mask_value(self, value: str) -> str:
        """Mask sensitive values (e.g., '12345678' -> '****5678')"""
        if len(value) <= 4:
            return '*' * len(value)
        return '*' * (len(value) - 4) + value[-4:]
    
    async def handle_data_deletion_request(self, user_id: str):
        """GDPR data deletion request handler"""
        # Archive user data before deletion
        await self.archive_user_data(user_id)
        
        # Anonymize or delete personal data
        async with db.transaction():
            # Remove PII from main tables
            await db.execute(
                "UPDATE users SET email = NULL, phone_number = NULL "
                "WHERE id = $1",
                user_id
            )
            
            # Keep anonymized records for analytics
            await db.execute(
                "UPDATE fundi_profiles SET "
                "first_name = '[deleted]', last_name = '[deleted]', "
                "id_number = NULL, kra_pin = NULL "
                "WHERE id = $1",
                user_id
            )
            
            # Log deletion for audit
            await audit_logger.log_action(
                user_id=user_id,
                action="GDPR_DELETION",
                resource_type="user_data",
                resource_id=user_id,
                old_values=None,
                new_values=None,
                request=None
            )
    
    def get_data_export(self, user_id: str) -> Dict[str, Any]:
        """Export all user data (GDPR right to data portability)"""
        # Collect all user data from various tables
        user_data = {
            "profile": self.get_user_profile(user_id),
            "jobs": self.get_user_jobs(user_id),
            "payments": self.get_user_payments(user_id),
            "ratings": self.get_user_ratings(user_id),
            "communications": self.get_user_communications(user_id)
        }
        
        return user_data
7.3 Payment Security
python
# security/payment_security.py
import hmac
import hashlib
import base64
from typing import Dict, Any

class PaymentSecurityManager:
    """Secure payment processing"""
    
    def __init__(self):
        self.mpesa_consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.webhook_secret = settings.WEBHOOK_SECRET
    
    def generate_mpesa_password(self, business_shortcode: str, passkey: str) -> str:
        """Generate M-Pesa API password"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        data = business_shortcode + passkey + timestamp
        return base64.b64encode(data.encode()).decode()
    
    def verify_webhook_signature(self, payload: Dict[str, Any], signature: str) -> bool:
        """Verify webhook signature for payment callbacks"""
        message = json.dumps(payload, sort_keys=True).encode()
        expected = hmac.new(
            self.webhook_secret.encode(),
            message,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)
    
    def create_escrow(self, contract_id: str, amount: float, parties: Dict) -> str:
        """Create escrow for secure payment"""
        escrow_id = str(uuid.uuid4())
        
        # Store escrow in database
        escrow_data = {
            "id": escrow_id,
            "contract_id": contract_id,
            "amount": amount,
            "payer_id": parties["payer_id"],
            "payee_id": parties["payee_id"],
            "status": "held",
            "created_at": datetime.utcnow(),
            "conditions": parties.get("conditions", [])
        }
        
        db.escrows.insert_one(escrow_data)
        return escrow_id
    
    async def release_escrow(self, escrow_id: str, release_code: str):
        """Release escrow payment after conditions met"""
        escrow = await db.escrows.find_one({"id": escrow_id})
        
        if not escrow:
            raise ValueError("Escrow not found")
        
        if escrow["status"] != "held":
            raise ValueError("Escrow already released")
        
        # Verify release conditions
        conditions_met = await self.verify_escrow_conditions(escrow)
        
        if not conditions_met:
            raise ValueError("Release conditions not met")
        
        # Process payment
        await self.process_payment(
            from_account=escrow["payer_id"],
            to_account=escrow["payee_id"],
            amount=escrow["amount"],
            reference=f"ESCROW_{escrow_id}"
        )
        
        # Update escrow status
        await db.escrows.update_one(
            {"id": escrow_id},
            {
                "$set": {
                    "status": "released",
                    "released_at": datetime.utcnow(),
                    "release_code": release_code
                }
            }
        )
8. Enterprise Workflow Automation
8.1 Job Matching Engine
python
# matching/matching_engine.py
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import geopy.distance

class AdvancedMatchingEngine:
    """AI-powered matching engine for optimal fundi-job pairing"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000)
        self.skill_embeddings = {}
        self.location_cache = {}
        
    async def find_matches(
        self,
        job_id: str,
        min_score: float = 0.6,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Find best matching fundis for a job"""
        
        # Get job details
        job = await self.get_job_details(job_id)
        
        # Get eligible fundis (based on basic filters)
        fundis = await self.get_eligible_fundis(job)
        
        # Calculate match scores
        matches = []
        for fundi in fundis:
            score = await self.calculate_match_score(job, fundi)
            if score >= min_score:
                matches.append({
                    "fundi": fundi,
                    "score": score,
                    "details": await self.get_match_details(job, fundi)
                })
        
        # Sort by score and return top matches
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:limit]
    
    async def calculate_match_score(
        self,
        job: Dict[str, Any],
        fundi: Dict[str, Any]
    ) -> float:
        """Calculate comprehensive match score"""
        
        weights = {
            "skill": 0.35,
            "experience": 0.20,
            "location": 0.15,
            "availability": 0.10,
            "rating": 0.10,
            "price": 0.10
        }
        
        scores = {}
        
        # Skill match (using TF-IDF and cosine similarity)
        job_skills = " ".join([s["name"] for s in job["required_skills"]])
        fundi_skills = " ".join([s["name"] for s in fundi["skills"]])
        
        if hasattr(self, 'skill_vectors'):
            job_vector = self.vectorizer.transform([job_skills])
            fundi_vector = self.vectorizer.transform([fundi_skills])
            scores["skill"] = cosine_similarity(job_vector, fundi_vector)[0][0]
        else:
            # Fallback to simple overlap
            job_skill_set = set([s["id"] for s in job["required_skills"]])
            fundi_skill_set = set([s["id"] for s in fundi["skills"]])
            overlap = job_skill_set.intersection(fundi_skill_set)
            scores["skill"] = len(overlap) / max(len(job_skill_set), 1)
        
        # Experience match
        required_exp = job.get("required_experience_years", 0)
        fundi_exp = fundi.get("years_experience", 0)
        scores["experience"] = min(fundi_exp / max(required_exp, 1), 1.0)
        
        # Location match (using geodistance)
        job_coords = (job["latitude"], job["longitude"])
        fundi_coords = (fundi["latitude"], fundi["longitude"])
        
        distance = geopy.distance.distance(job_coords, fundi_coords).km
        max_distance = fundi.get("service_radius_km", 10)
        
        if distance <= max_distance:
            scores["location"] = 1 - (distance / max_distance)
        else:
            scores["location"] = 0
        
        # Availability match
        if fundi.get("availability_status") == "available":
            scores["availability"] = 1.0
        elif fundi.get("next_available_date") <= job.get("start_date"):
            scores["availability"] = 0.8
        else:
            scores["availability"] = 0
        
        # Rating match
        scores["rating"] = fundi.get("average_rating", 0) / 5.0
        
        # Price match
        job_budget_max = job.get("budget_max", float('inf'))
        fundi_rate = fundi.get("hourly_rate", 0)
        
        if fundi_rate <= job_budget_max:
            scores["price"] = 1.0
        else:
            scores["price"] = job_budget_max / fundi_rate
        
        # Calculate weighted score
        total_score = sum(
            weights[key] * scores.get(key, 0)
            for key in weights
        )
        
        return total_score
    
    async def get_match_details(
        self,
        job: Dict[str, Any],
        fundi: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get detailed breakdown of match"""
        
        return {
            "skill_match": {
                "matched_skills": [
                    s for s in fundi["skills"] 
                    if s["id"] in [rs["id"] for rs in job["required_skills"]]
                ],
                "missing_skills": [
                    rs for rs in job["required_skills"]
                    if rs["id"] not in [s["id"] for s in fundi["skills"]]
                ]
            },
            "experience_match": {
                "required": job.get("required_experience_years", 0),
                "actual": fundi.get("years_experience", 0)
            },
            "location": {
                "distance_km": geopy.distance.distance(
                    (job["latitude"], job["longitude"]),
                    (fundi["latitude"], fundi["latitude"])
                ).km,
                "within_radius": fundi.get("service_radius_km", 10)
            },
            "price_estimate": {
                "fundi_rate": fundi.get("hourly_rate"),
                "estimated_total": fundi.get("hourly_rate") * job.get("estimated_hours", 8),
                "within_budget": fundi.get("hourly_rate") <= job.get("budget_max", float('inf'))
            }
        }
    
    async def get_eligible_fundis(self, job: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get initial pool of eligible fundis based on basic filters"""
        
        query = """
            SELECT f.*, 
                   AVG(r.overall_rating) as average_rating,
                   array_agg(DISTINCT s.skill_id) as skill_ids
            FROM fundi_profiles f
            LEFT JOIN ratings r ON f.id = r.ratee_id
            LEFT JOIN fundi_skills s ON f.id = s.fundi_id
            WHERE f.availability_status = 'available'
                AND f.is_verified = true
                AND f.service_radius_km >= $1
            GROUP BY f.id
            HAVING COUNT(DISTINCT s.skill_id) > 0
        """
        
        # Get max distance needed
        max_distance = job.get("max_distance", 10)
        
        fundis = await db.fetch_all(query, max_distance)
        return [dict(f) for f in fundis]
8.2 Verification Workflow
python
# verification/verification_workflow.py
from typing import List, Dict, Any
import asyncio
from datetime import datetime

class VerificationWorkflow:
    """Automated verification workflow"""
    
    VERIFICATION_STEPS = {
        "phone": {
            "order": 1,
            "auto_verify": True,
            "timeout_minutes": 5,
            "retry_count": 3
        },
        "id": {
            "order": 2,
            "auto_verify": False,
            "requires_document": True,
            "verification_time_hours": 24
        },
        "address": {
            "order": 3,
            "auto_verify": False,
            "requires_proof": True,
            "verification_time_hours": 48
        },
        "skills": {
            "order": 4,
            "auto_verify": False,
            "requires_test": True,
            "verification_time_hours": 72
        }
    }
    
    async def start_verification(
        self,
        user_id: str,
        verification_type: str
    ) -> Dict[str, Any]:
        """Start verification process for a user"""
        
        step = self.VERIFICATION_STEPS.get(verification_type)
        if not step:
            raise ValueError(f"Invalid verification type: {verification_type}")
        
        # Create verification record
        verification_id = str(uuid.uuid4())
        verification = {
            "id": verification_id,
            "user_id": user_id,
            "type": verification_type,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=step.get("timeout_minutes", 48)),
            "attempts": 0,
            "metadata": {}
        }
        
        await db.verifications.insert_one(verification)
        
        # Trigger appropriate verification flow
        if step["auto_verify"]:
            asyncio.create_task(self.auto_verify(verification_id))
        else:
            asyncio.create_task(self.manual_verify(verification_id))
        
        return verification
    
    async def auto_verify(self, verification_id: str):
        """Automated verification (phone, email)"""
        
        verification = await db.verifications.find_one({"id": verification_id})
        
        # Generate OTP
        otp = self.generate_otp()
        
        # Store OTP
        await db.verifications.update_one(
            {"id": verification_id},
            {"$set": {"metadata.otp": otp, "metadata.otp_expires": datetime.utcnow() + timedelta(minutes=10)}}
        )
        
        # Send OTP via appropriate channel
        if verification["type"] == "phone":
            await self.send_sms_otp(verification["user_id"], otp)
        elif verification["type"] == "email":
            await self.send_email_otp(verification["user_id"], otp)
    
    async def verify_otp(
        self,
        verification_id: str,
        otp: str
    ) -> bool:
        """Verify OTP for auto-verification"""
        
        verification = await db.verifications.find_one({"id": verification_id})
        
        if not verification:
            raise ValueError("Verification not found")
        
        if verification["status"] != "pending":
            raise ValueError("Verification already processed")
        
        if datetime.utcnow() > verification["metadata"].get("otp_expires"):
            await db.verifications.update_one(
                {"id": verification_id},
                {"$set": {"status": "expired"}}
            )
            raise ValueError("OTP expired")
        
        if verification["metadata"].get("otp") == otp:
            # Mark as verified
            await db.verifications.update_one(
                {"id": verification_id},
                {
                    "$set": {
                        "status": "approved",
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            # Update user verification level
            await self.update_user_verification_level(verification["user_id"])
            
            return True
        else:
            # Increment attempts
            attempts = verification["attempts"] + 1
            if attempts >= 3:
                await db.verifications.update_one(
                    {"id": verification_id},
                    {"$set": {"status": "failed"}}
                )
            
            await db.verifications.update_one(
                {"id": verification_id},
                {"$inc": {"attempts": 1}}
            )
            
            return False
    
    async def manual_verify(self, verification_id: str):
        """Manual verification workflow with human review"""
        
        verification = await db.verifications.find_one({"id": verification_id})
        
        # Assign to verification team (round-robin)
        verifier = await self.assign_verifier()
        
        await db.verifications.update_one(
            {"id": verification_id},
            {"$set": {"assigned_to": verifier["id"]}}
        )
        
        # Create notification for verifier
        await notifications.create(
            user_id=verifier["id"],
            type="verification_assigned",
            data={
                "verification_id": verification_id,
                "user_id": verification["user_id"],
                "type": verification["type"]
            }
        )
    
    async def submit_verification_documents(
        self,
        verification_id: str,
        documents: List[Dict[str, Any]]
    ):
        """Submit documents for manual verification"""
        
        # Upload documents to secure storage
        document_urls = []
        for doc in documents:
            url = await self.upload_document(doc)
            document_urls.append(url)
        
        await db.verifications.update_one(
            {"id": verification_id},
            {
                "$set": {
                    "document_urls": document_urls,
                    "status": "in_progress",
                    "submitted_at": datetime.utcnow()
                }
            }
        )
    
    async def review_verification(
        self,
        verification_id: str,
        verifier_id: str,
        decision: str,
        notes: str = None
    ):
        """Review and decide on verification request"""
        
        if decision not in ["approve", "reject"]:
            raise ValueError("Decision must be 'approve' or 'reject'")
        
        verification = await db.verifications.find_one({"id": verification_id})
        
        if verification["assigned_to"] != verifier_id:
            raise ValueError("Not assigned to this verifier")
        
        status = "approved" if decision == "approve" else "rejected"
        
        await db.verifications.update_one(
            {"id": verification_id},
            {
                "$set": {
                    "status": status,
                    "reviewed_at": datetime.utcnow(),
                    "reviewed_by": verifier_id,
                    "review_notes": notes
                }
            }
        )
        
        if decision == "approve":
            # Update user verification level
            await self.update_user_verification_level(verification["user_id"])
            
            # Notify user
            await notifications.create(
                user_id=verification["user_id"],
                type="verification_approved",
                data={"verification_type": verification["type"]}
            )
        else:
            # Notify user with rejection reason
            await notifications.create(
                user_id=verification["user_id"],
                type="verification_rejected",
                data={
                    "verification_type": verification["type"],
                    "reason": notes
                }
            )
    
    async def update_user_verification_level(self, user_id: str):
        """Update user's overall verification level"""
        
        # Get all verifications for user
        verifications = await db.verifications.find(
            {"user_id": user_id, "status": "approved"}
        ).to_list(None)
        
        # Calculate level based on completed verifications
        level = len(verifications)
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"verification_level": level}}
        )
8.3 Dispute Resolution Workflow
python
# disputes/dispute_resolution.py
from typing import Dict, Any, List
from datetime import datetime, timedelta

class DisputeResolutionWorkflow:
    """Automated dispute resolution system"""
    
    DISPUTE_TYPES = {
        "payment": {
            "priority": 1,
            "resolution_time_hours": 48,
            "requires_evidence": True,
            "auto_resolve": False
        },
        "quality": {
            "priority": 2,
            "resolution_time_hours": 72,
            "requires_evidence": True,
            "auto_resolve": False
        },
        "no_show": {
            "priority": 1,
            "resolution_time_hours": 24,
            "requires_evidence": False,
            "auto_resolve": True
        },
        "damage": {
            "priority": 1,
            "resolution_time_hours": 96,
            "requires_evidence": True,
            "auto_resolve": False
        }
    }
    
    async def create_dispute(
        self,
        contract_id: str,
        raised_by: str,
        dispute_type: str,
        description: str,
        evidence: List[Dict] = None
    ) -> Dict[str, Any]:
        """Create a new dispute"""
        
        if dispute_type not in self.DISPUTE_TYPES:
            raise ValueError(f"Invalid dispute type: {dispute_type}")
        
        config = self.DISPUTE_TYPES[dispute_type]
        
        dispute = {
            "id": str(uuid.uuid4()),
            "contract_id": contract_id,
            "raised_by": raised_by,
            "type": dispute_type,
            "description": description,
            "evidence": evidence or [],
            "status": "pending",
            "priority": config["priority"],
            "created_at": datetime.utcnow(),
            "deadline": datetime.utcnow() + timedelta(hours=config["resolution_time_hours"]),
            "timeline": [
                {
                    "action": "dispute_created",
                    "user": raised_by,
                    "timestamp": datetime.utcnow(),
                    "notes": description
                }
            ],
            "messages": []
        }
        
        await db.disputes.insert_one(dispute)
        
        # Notify other party
        contract = await db.contracts.find_one({"id": contract_id})
        other_party = contract["employer_id"] if raised_by == contract["fundi_id"] else contract["fundi_id"]
        
        await notifications.create(
            user_id=other_party,
            type="dispute_raised",
            data={"dispute_id": dispute["id"], "type": dispute_type}
        )
        
        # Auto-resolve if applicable
        if config["auto_resolve"]:
            asyncio.create_task(self.auto_resolve_dispute(dispute["id"]))
        else:
            # Assign to support team
            asyncio.create_task(self.assign_to_support(dispute["id"]))
        
        return dispute
    
    async def add_evidence(
        self,
        dispute_id: str,
        user_id: str,
        evidence: Dict[str, Any]
    ):
        """Add evidence to dispute"""
        
        dispute = await db.disputes.find_one({"id": dispute_id})
        
        if not dispute:
            raise ValueError("Dispute not found")
        
        if dispute["status"] != "pending":
            raise ValueError("Dispute already resolved")
        
        # Upload evidence file
        file_url = await self.upload_evidence(evidence)
        
        await db.disputes.update_one(
            {"id": dispute_id},
            {
                "$push": {
                    "evidence": {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "type": evidence["type"],
                        "url": file_url,
                        "uploaded_at": datetime.utcnow(),
                        "description": evidence.get("description")
                    }
                },
                "$push": {
                    "timeline": {
                        "action": "evidence_added",
                        "user": user_id,
                        "timestamp": datetime.utcnow(),
                        "notes": f"Added {evidence['type']} evidence"
                    }
                }
            }
        )
    
    async def send_message(
        self,
        dispute_id: str,
        user_id: str,
        message: str
    ):
        """Send message in dispute conversation"""
        
        await db.disputes.update_one(
            {"id": dispute_id},
            {
                "$push": {
                    "messages": {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "message": message,
                        "timestamp": datetime.utcnow(),
                        "read": False
                    }
                },
                "$push": {
                    "timeline": {
                        "action": "message_sent",
                        "user": user_id,
                        "timestamp": datetime.utcnow()
                    }
                }
            }
        )
        
        # Notify other party
        dispute = await db.disputes.find_one({"id": dispute_id})
        contract = await db.contracts.find_one({"id": dispute["contract_id"]})
        other_party = contract["employer_id"] if user_id == contract["fundi_id"] else contract["fundi_id"]
        
        await notifications.create(
            user_id=other_party,
            type="dispute_message",
            data={"dispute_id": dispute_id}
        )
    
    async def propose_resolution(
        self,
        dispute_id: str,
        proposed_by: str,
        resolution: Dict[str, Any]
    ):
        """Propose a resolution to the dispute"""
        
        dispute = await db.disputes.find_one({"id": dispute_id})
        
        if dispute["status"] != "pending":
            raise ValueError("Dispute already resolved")
        
        resolution_data = {
            "id": str(uuid.uuid4()),
            "proposed_by": proposed_by,
            "terms": resolution,
            "proposed_at": datetime.utcnow(),
            "status": "pending",
            "accepted_by": None,
            "accepted_at": None
        }
        
        await db.disputes.update_one(
            {"id": dispute_id},
            {
                "$set": {"current_resolution": resolution_data},
                "$push": {
                    "timeline": {
                        "action": "resolution_proposed",
                        "user": proposed_by,
                        "timestamp": datetime.utcnow(),
                        "notes": f"Proposed resolution: {resolution}"
                    }
                }
            }
        )
        
        # Notify other party
        contract = await db.contracts.find_one({"id": dispute["contract_id"]})
        other_party = contract["employer_id"] if proposed_by == contract["fundi_id"] else contract["fundi_id"]
        
        await notifications.create(
            user_id=other_party,
            type="dispute_resolution_proposed",
            data={"dispute_id": dispute_id}
        )
    
    async def accept_resolution(
        self,
        dispute_id: str,
        user_id: str
    ):
        """Accept proposed resolution"""
        
        dispute = await db.disputes.find_one({"id": dispute_id})
        
        if not dispute.get("current_resolution"):
            raise ValueError("No resolution proposed")
        
        if dispute["current_resolution"]["status"] != "pending":
            raise ValueError("Resolution already processed")
        
        contract = await db.contracts.find_one({"id": dispute["contract_id"]})
        
        # Check if both parties have accepted
        if dispute["current_resolution"].get("accepted_by"):
            # Second acceptance - finalize
            await self.finalize_resolution(dispute_id)
        else:
            # First acceptance
            await db.disputes.update_one(
                {"id": dispute_id},
                {
                    "$set": {
                        "current_resolution.accepted_by": user_id,
                        "current_resolution.accepted_at": datetime.utcnow()
                    },
                    "$push": {
                        "timeline": {
                            "action": "resolution_accepted",
                            "user": user_id,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
            
            # Notify other party
            other_party = contract["employer_id"] if user_id == contract["fundi_id"] else contract["fundi_id"]
            
            await notifications.create(
                user_id=other_party,
                type="dispute_resolution_accepted",
                data={"dispute_id": dispute_id}
            )
    
    async def finalize_resolution(self, dispute_id: str):
        """Finalize dispute resolution"""
        
        dispute = await db.disputes.find_one({"id": dispute_id})
        resolution = dispute["current_resolution"]
        
        # Execute resolution terms
        await self.execute_resolution(dispute["contract_id"], resolution["terms"])
        
        # Update dispute status
        await db.disputes.update_one(
            {"id": dispute_id},
            {
                "$set": {
                    "status": "resolved",
                    "resolved_at": datetime.utcnow(),
                    "resolution": resolution
                },
                "$push": {
                    "timeline": {
                        "action": "dispute_resolved",
                        "timestamp": datetime.utcnow(),
                        "notes": "Dispute resolved by mutual agreement"
                    }
                }
            }
        )
        
        # Notify both parties
        contract = await db.contracts.find_one({"id": dispute["contract_id"]})
        
        for party in [contract["employer_id"], contract["fundi_id"]]:
            await notifications.create(
                user_id=party,
                type="dispute_resolved",
                data={"dispute_id": dispute_id}
            )
    
    async def auto_resolve_dispute(self, dispute_id: str):
        """Auto-resolve simple disputes (no-show, etc.)"""
        
        dispute = await db.disputes.find_one({"id": dispute_id})
        
        if dispute["type"] == "no_show":
            # Default to refund for employer
            resolution_terms = {
                "type": "refund",
                "amount": "full",
                "notes": "Auto-resolved: Fundi no-show"
            }
        else:
            # For other types, escalate to support
            await self.escalate_to_support(dispute_id)
            return
        
        # Auto-resolve
        await db.disputes.update_one(
            {"id": dispute_id},
            {
                "$set": {
                    "status": "resolved",
                    "resolved_at": datetime.utcnow(),
                    "resolution": {
                        "type": "auto",
                        "terms": resolution_terms
                    }
                },
                "$push": {
                    "timeline": {
                        "action": "dispute_resolved",
                        "timestamp": datetime.utcnow(),
                        "notes": f"Auto-resolved: {resolution_terms['notes']}"
                    }
                }
            }
        )
        
        # Execute resolution
        await self.execute_resolution(dispute["contract_id"], resolution_terms)
9. AI/ML Integration Strategy
9.1 Skill Recommendation Engine
python
# ml/skill_recommendations.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib

class SkillRecommendationEngine:
    """AI-powered skill recommendations for fundis"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.skill_embeddings = {}
        
    async def train_model(self):
        """Train recommendation model on historical data"""
        
        # Fetch training data
        query = """
            SELECT 
                f.id as fundi_id,
                f.years_experience,
                f.verification_level,
                f.average_rating,
                COUNT(DISTINCT j.id) as jobs_completed,
                AVG(j.budget_max) as avg_job_value,
                array_agg(DISTINCT j.skill_required_id) as skills_used,
                array_agg(DISTINCT s.skill_id) as skills_owned
            FROM fundi_profiles f
            LEFT JOIN contracts c ON f.id = c.fundi_id
            LEFT JOIN job_postings j ON c.job_id = j.id
            LEFT JOIN fundi_skills s ON f.id = s.fundi_id
            WHERE c.status = 'completed'
            GROUP BY f.id
        """
        
        data = await db.fetch_all(query)
        df = pd.DataFrame([dict(row) for row in data])
        
        # Prepare features
        features = df[[
            'years_experience', 'verification_level', 
            'average_rating', 'jobs_completed', 'avg_job_value'
        ]].fillna(0)
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Train model (simplified - in production, use proper ML pipeline)
        self.model = RandomForestRegressor(n_estimators=100)
        
        # Target: success in different skill categories
        # This is a simplified example
        y = df['avg_job_value'].fillna(0)
        
        self.model.fit(features_scaled, y)
        
        # Save model
        joblib.dump(self.model, 'models/skill_recommendation.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
    
    async def recommend_skills(
        self,
        fundi_id: str,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """Recommend skills for a fundi to learn"""
        
        # Get fundi profile
        fundi = await db.fetch_one(
            "SELECT * FROM fundi_profiles WHERE id = $1",
            fundi_id
        )
        
        # Get fundi's current skills
        current_skills = await db.fetch_all(
            "SELECT skill_id, proficiency_level FROM fundi_skills WHERE fundi_id = $1",
            fundi_id
        )
        current_skill_ids = [s['skill_id'] for s in current_skills]
        
        # Get market demand data
        demand_data = await db.fetch_all("""
            SELECT 
                s.id,
                s.name,
                s.category_id,
                COUNT(DISTINCT j.id) as job_count,
                AVG(j.budget_max) as avg_budget,
                COUNT(DISTINCT CASE WHEN j.status = 'unfilled' THEN j.id END) as unfilled_count
            FROM skills s
            LEFT JOIN job_postings j ON s.id = j.skill_required_id
            WHERE j.created_at > NOW() - INTERVAL '30 days'
            GROUP BY s.id
            ORDER BY job_count DESC
        """)
        
        recommendations = []
        
        for skill in demand_data:
            if skill['id'] in current_skill_ids:
                continue
            
            # Calculate recommendation score
            score = self.calculate_recommendation_score(
                skill,
                fundi,
                current_skills
            )
            
            recommendations.append({
                "skill_id": skill['id'],
                "skill_name": skill['name'],
                "category_id": skill['category_id'],
                "market_demand": skill['job_count'],
                "avg_budget": skill['avg_budget'],
                "unfilled_ratio": skill['unfilled_count'] / max(skill['job_count'], 1),
                "recommendation_score": score,
                "learning_resources": await self.get_learning_resources(skill['id'])
            })
        
        # Sort by score and return top N
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        return recommendations[:top_n]
    
    def calculate_recommendation_score(
        self,
        skill: Dict,
        fundi: Dict,
        current_skills: List
    ) -> float:
        """Calculate recommendation score for a skill"""
        
        score = 0
        
        # Market demand (30%)
        score += 0.3 * min(skill['job_count'] / 100, 1)
        
        # Unfilled demand (20%)
        score += 0.2 * skill.get('unfilled_ratio', 0)
        
        # High budget jobs (20%)
        max_budget = 50000  # Assume max budget
        score += 0.2 * min(skill['avg_budget'] / max_budget, 1)
        
        # Skill compatibility with current skills (30%)
        # Simplified - in production, use skill embeddings
        compatibility = self.calculate_skill_compatibility(
            skill['id'],
            [s['skill_id'] for s in current_skills]
        )
        score += 0.3 * compatibility
        
        return score
    
    def calculate_skill_compatibility(
        self,
        new_skill_id: int,
        current_skill_ids: List[int]
    ) -> float:
        """Calculate compatibility between new skill and current skills"""
        
        # Simplified compatibility matrix
        # In production, use skill embeddings or co-occurrence data
        compatibility_map = {
            1: [2, 3],  # Plumbing compatible with electrical, carpentry
            2: [1, 4],  # Electrical compatible with plumbing, painting
            3: [1, 5],  # Carpentry compatible with plumbing, masonry
            4: [2, 6],  # Painting compatible with electrical, drywall
            5: [3, 7],  # Masonry compatible with carpentry, tiling
        }
        
        if new_skill_id in compatibility_map:
            compatible = compatibility_map[new_skill_id]
            overlap = len(set(current_skill_ids).intersection(compatible))
            return overlap / len(compatible)
        
        return 0
    
    async def get_learning_resources(self, skill_id: int) -> List[Dict]:
        """Get learning resources for a skill"""
        
        # In production, integrate with online learning platforms
        resources = [
            {
                "type": "video",
                "title": "Introduction to the skill",
                "url": f"https://youtube.com/playlist?skill={skill_id}",
                "duration_minutes": 120
            },
            {
                "type": "course",
                "title": "Certification preparation",
                "provider": "Udemy",
                "url": f"https://udemy.com/course/{skill_id}",
                "cost": 1500
            }
        ]
        
        return resources
9.2 Price Optimization Engine
python
# ml/price_optimization.py
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

class PriceOptimizationEngine:
    """AI-powered price recommendations"""
    
    async def recommend_rate(
        self,
        fundi_id: str,
        skill_id: int
    ) -> Dict[str, Any]:
        """Recommend optimal hourly rate"""
        
        # Get fundi profile
        fundi = await db.fetch_one(
            "SELECT * FROM fundi_profiles WHERE id = $1",
            fundi_id
        )
        
        # Get market data
        market_data = await db.fetch_all("""
            SELECT 
                j.budget_min,
                j.budget_max,
                j.created_at,
                f.years_experience,
                f.average_rating,
                f.verification_level
            FROM job_postings j
            JOIN contracts c ON j.id = c.job_id
            JOIN fundi_profiles f ON c.fundi_id = f.id
            WHERE j.skill_required_id = $1
                AND j.created_at > NOW() - INTERVAL '90 days'
                AND c.status = 'completed'
        """, skill_id)
        
        if not market_data:
            return {
                "recommended_rate": None,
                "confidence": 0,
                "message": "Insufficient market data"
            }
        
        df = pd.DataFrame([dict(row) for row in market_data])
        
        # Calculate average rate per job
        df['rate'] = (df['budget_min'] + df['budget_max']) / 2
        
        # Build simple pricing model
        features = ['years_experience', 'average_rating', 'verification_level']
        X = df[features].fillna(0)
        y = df['rate']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict rate for this fundi
        fundi_features = [[
            fundi['years_experience'],
            fundi['average_rating'] or 0,
            fundi['verification_level']
        ]]
        
        predicted_rate = model.predict(fundi_features)[0]
        
        # Calculate confidence based on data size
        confidence = min(len(market_data) / 50, 1.0)
        
        # Get rate ranges
        rate_ranges = {
            "minimum": np.percentile(df['rate'], 10),
            "median": np.percentile(df['rate'], 50),
            "maximum": np.percentile(df['rate'], 90),
            "recommended": predicted_rate
        }
        
        # Calculate competitiveness
        competitiveness = self.calculate_competitiveness(
            predicted_rate,
            rate_ranges
        )
        
        return {
            "recommended_rate": round(predicted_rate, -2),  # Round to nearest 100
            "confidence": confidence,
            "rate_ranges": rate_ranges,
            "competitiveness": competitiveness,
            "market_insights": await self.get_market_insights(skill_id)
        }
    
    def calculate_competitiveness(
        self,
        rate: float,
        ranges: Dict
    ) -> str:
        """Calculate how competitive the rate is"""
        
        if rate < ranges['minimum']:
            return "very_competitive"
        elif rate < ranges['median']:
            return "competitive"
        elif rate < ranges['maximum']:
            return "above_average"
        else:
            return "premium"
    
    async def get_market_insights(self, skill_id: int) -> Dict:
        """Get market insights for a skill"""
        
        # Get demand trend
        demand_trend = await db.fetch_all("""
            SELECT 
                DATE_TRUNC('week', created_at) as week,
                COUNT(*) as job_count
            FROM job_postings
            WHERE skill_required_id = $1
                AND created_at > NOW() - INTERVAL '12 weeks'
            GROUP BY week
            ORDER BY week
        """, skill_id)
        
        # Calculate trend
        if len(demand_trend) >= 4:
            recent = sum(row['job_count'] for row in demand_trend[-4:])
            previous = sum(row['job_count'] for row in demand_trend[:4])
            trend = ((recent - previous) / previous) * 100
        else:
            trend = 0
        
        return {
            "demand_trend": trend,
            "seasonal_factors": self.get_seasonal_factors(skill_id),
            "top_locations": await self.get_top_locations(skill_id)
        }
9.3 Fraud Detection System
python
# ml/fraud_detection.py
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta

class FraudDetectionSystem:
    """AI-powered fraud detection"""
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.feature_columns = [
            'login_frequency', 'transaction_amount_avg',
            'location_changes', 'rating_deviation',
            'account_age_days', 'verification_level'
        ]
    
    async def train_model(self):
        """Train fraud detection model"""
        
        # Fetch user behavior data
        query = """
            SELECT 
                u.id,
                COUNT(DISTINCT DATE(l.created_at)) as login_frequency,
                AVG(p.amount) as transaction_amount_avg,
                COUNT(DISTINCT l.ip_address) as location_changes,
                STDDEV(r.overall_rating) as rating_deviation,
                EXTRACT(DAY FROM NOW() - u.created_at) as account_age_days,
                u.verification_level
            FROM users u
            LEFT JOIN login_logs l ON u.id = l.user_id
            LEFT JOIN payment_transactions p ON u.id = p.payer_id OR u.id = p.payee_id
            LEFT JOIN ratings r ON u.id = r.rater_id
            WHERE l.created_at > NOW() - INTERVAL '30 days'
            GROUP BY u.id
        """
        
        data = await db.fetch_all(query)
        df = pd.DataFrame([dict(row) for row in data])
        
        # Prepare features
        X = df[self.feature_columns].fillna(0)
        
        # Train model
        self.model.fit(X)
        
        # Save model
        joblib.dump(self.model, 'models/fraud_detection.pkl')
    
    async def analyze_user(self, user_id: str) -> Dict[str, Any]:
        """Analyze user for potential fraud"""
        
        # Get user data
        user_data = await db.fetch_one("""
            SELECT 
                u.*,
                COUNT(DISTINCT DATE(l.created_at)) as login_frequency,
                AVG(p.amount) as transaction_amount_avg,
                COUNT(DISTINCT l.ip_address) as location_changes,
                STDDEV(r.overall_rating) as rating_deviation,
                EXTRACT(DAY FROM NOW() - u.created_at) as account_age_days
            FROM users u
            LEFT JOIN login_logs l ON u.id = l.user_id
            LEFT JOIN payment_transactions p ON u.id = p.payer_id OR u.id = p.payee_id
            LEFT JOIN ratings r ON u.id = r.rater_id
            WHERE u.id = $1
                AND l.created_at > NOW() - INTERVAL '30 days'
            GROUP BY u.id
        """, user_id)
        
        if not user_data:
            return {"error": "User not found"}
        
        # Prepare feature vector
        features = np.array([[
            user_data['login_frequency'] or 0,
            user_data['transaction_amount_avg'] or 0,
            user_data['location_changes'] or 0,
            user_data['rating_deviation'] or 0,
            user_data['account_age_days'] or 0,
            user_data['verification_level'] or 0
        ]])
        
        # Predict anomaly score
        if hasattr(self.model, 'predict'):
            prediction = self.model.predict(features)[0]
            score = self.model.score_samples(features)[0]
            
            is_fraudulent = prediction == -1
            confidence = min(abs(score) / 10, 1.0)
        else:
            # Fallback to rule-based
            is_fraudulent, confidence = self.rule_based_detection(user_data)
        
        # Get specific risk factors
        risk_factors = await self.identify_risk_factors(user_data)
        
        return {
            "user_id": user_id,
            "is_fraudulent": is_fraudulent,
            "confidence": confidence,
            "risk_factors": risk_factors,
            "recommended_actions": self.get_recommended_actions(risk_factors),
            "score": score if 'score' in locals() else None
        }
    
    async def rule_based_detection(self, user_data: Dict) -> tuple:
        """Fallback rule-based fraud detection"""
        
        risk_score = 0
        
        # Check account age
        if user_data['account_age_days'] < 1:
            risk_score += 30
        elif user_data['account_age_days'] < 7:
            risk_score += 15
        
        # Check verification level
        if user_data['verification_level'] < 2:
            risk_score += 20
        
        # Check login frequency
        if user_data['login_frequency'] > 50:  # Too many logins
            risk_score += 25
        
        # Check location changes
        if user_data['location_changes'] > 5:  # Too many IP changes
            risk_score += 25
        
        # Check rating deviation
        if user_data['rating_deviation'] and user_data['rating_deviation'] > 2:
            risk_score += 20
        
        is_fraudulent = risk_score > 50
        confidence = risk_score / 100
        
        return is_fraudulent, confidence
    
    async def identify_risk_factors(self, user_data: Dict) -> List[Dict]:
        """Identify specific risk factors"""
        
        risk_factors = []
        
        if user_data['account_age_days'] < 1:
            risk_factors.append({
                "factor": "new_account",
                "severity": "high",
                "description": "Account created within last 24 hours"
            })
        
        if user_data['verification_level'] < 2:
            risk_factors.append({
                "factor": "unverified",
                "severity": "medium",
                "description": "Low verification level"
            })
        
        if user_data['location_changes'] > 5:
            risk_factors.append({
                "factor": "location_hopping",
                "severity": "high",
                "description": "Multiple IP address changes"
            })
        
        if user_data['login_frequency'] > 50:
            risk_factors.append({
                "factor": "excessive_logins",
                "severity": "medium",
                "description": "Unusually high login frequency"
            })
        
        if user_data['rating_deviation'] and user_data['rating_deviation'] > 2:
            risk_factors.append({
                "factor": "inconsistent_ratings",
                "severity": "low",
                "description": "Highly variable rating behavior"
            })
        
        return risk_factors
    
    def get_recommended_actions(self, risk_factors: List[Dict]) -> List[str]:
        """Get recommended actions based on risk factors"""
        
        actions = []
        
        for factor in risk_factors:
            if factor['factor'] == 'new_account':
                actions.append("Require additional verification")
                actions.append("Limit transaction amounts for first 7 days")
            
            elif factor['factor'] == 'unverified':
                actions.append("Send verification reminder")
                actions.append("Restrict access to high-value jobs")
            
            elif factor['factor'] == 'location_hopping':
                actions.append("Require phone verification")
                actions.append("Flag for manual review")
            
            elif factor['factor'] == 'excessive_logins':
                actions.append("Implement CAPTCHA on login")
                actions.append("Monitor for brute force attempts")
        
        return list(set(actions))
10. Testing & Quality Assurance
10.1 Test Strategy
python
# tests/conftest.py
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def db_engine():
    """Create test database engine"""
    engine = create_async_engine(
        "postgresql+asyncpg://test:test@localhost:5432/workforge_test",
        echo=False
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests"""
    async_session = sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def test_fundi(db_session):
    """Create test fundi user"""
    fundi = FundiProfile(
        id=uuid.uuid4(),
        first_name="Test",
        last_name="Fundi",
        phone="254712345678",
        email="test.fundi@example.com",
        id_number="12345678",
        county="Nairobi",
        sub_county="Westlands",
        years_experience=5,
        verification_level=2,
        availability_status="available"
    )
    
    db_session.add(fundi)
    await db_session.commit()
    
    return fundi

@pytest.fixture
async def test_employer(db_session):
    """Create test employer"""
    employer = EmployerProfile(
        id=uuid.uuid4(),
        company_name="Test Company Ltd",
        contact_person="John Doe",
        phone="254723456789",
        email="test@company.com",
        business_registration_number="BR123456",
        county="Nairobi",
        sub_county="Nairobi Central",
        is_verified=True
    )
    
    db_session.add(employer)
    await db_session.commit()
    
    return employer
10.2 Unit Tests
python
# tests/test_matching.py
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

class TestMatchingEngine:
    """Test matching engine functionality"""
    
    @pytest.mark.asyncio
    async def test_calculate_match_score_perfect_match(self, matching_engine, test_job, test_fundi):
        """Test match score calculation for perfect match"""
        
        # Setup perfect match conditions
        test_job.required_skills = [{"id": 1, "name": "Plumbing"}]
        test_fundi.skills = [{"id": 1, "name": "Plumbing", "proficiency": "expert"}]
        test_fundi.years_experience = 10
        test_job.required_experience_years = 5
        test_fundi.average_rating = 5.0
        test_fundi.hourly_rate = 500
        test_job.budget_max = 1000
        
        with patch.object(matching_engine, 'calculate_location_score', return_value=1.0):
            with patch.object(matching_engine, 'calculate_availability_score', return_value=1.0):
                score = await matching_engine.calculate_match_score(test_job, test_fundi)
        
        assert score == pytest.approx(1.0, rel=0.1)
    
    @pytest.mark.asyncio
    async def test_calculate_match_score_no_match(self, matching_engine, test_job, test_fundi):
        """Test match score calculation for no match"""
        
        # Setup no match conditions
        test_job.required_skills = [{"id": 1, "name": "Plumbing"}]
        test_fundi.skills = [{"id": 2, "name": "Electrical"}]
        test_fundi.years_experience = 0
        test_job.required_experience_years = 5
        test_fundi.average_rating = 0
        test_fundi.hourly_rate = 5000
        test_job.budget_max = 1000
        
        with patch.object(matching_engine, 'calculate_location_score', return_value=0):
            with patch.object(matching_engine, 'calculate_availability_score', return_value=0):
                score = await matching_engine.calculate_match_score(test_job, test_fundi)
        
        assert score < 0.3
    
    @pytest.mark.asyncio
    async def test_find_matches_returns_correct_number(self, matching_engine, test_job):
        """Test find_matches returns correct number of matches"""
        
        # Mock get_eligible_fundis to return 10 fundis
        mock_fundis = [Mock() for _ in range(10)]
        for i, fundi in enumerate(mock_fundis):
            fundi.id = i
            fundi.skills = [{"id": 1, "name": "Plumbing"}]
        
        with patch.object(matching_engine, 'get_eligible_fundis', return_value=mock_fundis):
            with patch.object(matching_engine, 'calculate_match_score', return_value=0.8):
                matches = await matching_engine.find_matches(test_job.id, limit=5)
        
        assert len(matches) == 5
    
    @pytest.mark.asyncio
    async def test_find_matches_respects_min_score(self, matching_engine, test_job):
        """Test find_matches respects minimum score threshold"""
        
        # Mock fundis with varying scores
        mock_fundis = [Mock() for _ in range(10)]
        scores = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0]
        
        with patch.object(matching_engine, 'get_eligible_fundis', return_value=mock_fundis):
            with patch.object(matching_engine, 'calculate_match_score', side_effect=scores):
                matches = await matching_engine.find_matches(test_job.id, min_score=0.6)
        
        assert len(matches) == 4  # Only scores >= 0.6
        assert all(m['score'] >= 0.6 for m in matches)

# tests/test_payments.py
class TestPaymentService:
    """Test payment processing"""
    
    @pytest.mark.asyncio
    async def test_create_escrow(self, payment_service, test_contract):
        """Test escrow creation"""
        
        escrow_id = await payment_service.create_escrow(
            contract_id=test_contract.id,
            amount=5000,
            parties={
                "payer_id": test_contract.employer_id,
                "payee_id": test_contract.fundi_id
            }
        )
        
        assert escrow_id is not None
        
        # Verify escrow in database
        escrow = await db.escrows.find_one({"id": escrow_id})
        assert escrow is not None
        assert escrow['status'] == 'held'
        assert escrow['amount'] == 5000
    
    @pytest.mark.asyncio
    async def test_release_escrow(self, payment_service, test_escrow):
        """Test escrow release"""
        
        with patch.object(payment_service, 'verify_escrow_conditions', return_value=True):
            with patch.object(payment_service, 'process_payment', return_value=True):
                result = await payment_service.release_escrow(
                    test_escrow.id,
                    release_code="TEST123"
                )
        
        assert result is True
        
        # Verify escrow updated
        escrow = await db.escrows.find_one({"id": test_escrow.id})
        assert escrow['status'] == 'released'
        assert escrow['release_code'] == "TEST123"
    
    @pytest.mark.asyncio
    async def test_release_escrow_conditions_not_met(self, payment_service, test_escrow):
        """Test escrow release fails when conditions not met"""
        
        with patch.object(payment_service, 'verify_escrow_conditions', return_value=False):
            with pytest.raises(ValueError, match="Release conditions not met"):
                await payment_service.release_escrow(test_escrow.id, "TEST123")
10.3 Integration Tests
python
# tests/integration/test_api_integration.py
import pytest
from httpx import AsyncClient

class TestAPIIntegration:
    """Test API integration"""
    
    @pytest.mark.asyncio
    async def test_complete_fundi_journey(self, client: AsyncClient):
        """Test complete fundi user journey"""
        
        # 1. Register fundi
        register_data = {
            "email": "new.fundi@example.com",
            "phone": "254701234567",
            "password": "SecurePass123!",
            "user_type": "fundi",
            "first_name": "New",
            "last_name": "Fundi"
        }
        
        response = await client.post("/api/auth/register", json=register_data)
        assert response.status_code == 201
        user_id = response.json()["user_id"]
        token = response.json()["access_token"]
        
        # 2. Complete profile
        headers = {"Authorization": f"Bearer {token}"}
        profile_data = {
            "id_number": "12345678",
            "county": "Nairobi",
            "sub_county": "Westlands",
            "years_experience": 3,
            "hourly_rate": 500,
            "availability_status": "available"
        }
        
        response = await client.put(
            f"/api/fundis/profile/{user_id}",
            json=profile_data,
            headers=headers
        )
        assert response.status_code == 200
        
        # 3. Add skills
        skills_data = {
            "skills": [
                {"skill_id": 1, "proficiency_level": "intermediate"},
                {"skill_id": 2, "proficiency_level": "beginner"}
            ]
        }
        
        response = await client.post(
            f"/api/fundis/{user_id}/skills",
            json=skills_data,
            headers=headers
        )
        assert response.status_code == 201
        
        # 4. Search for jobs
        response = await client.get(
            "/api/jobs?county=Nairobi&skill_id=1",
            headers=headers
        )
        assert response.status_code == 200
        jobs = response.json()["results"]
        
        if jobs:
            # 5. Apply for job
            job_id = jobs[0]["id"]
            apply_data = {
                "proposed_rate": 450,
                "cover_note": "I'm interested in this job",
                "available_from": "2024-06-01"
            }
            
            response = await client.post(
                f"/api/jobs/{job_id}/apply",
                json=apply_data,
                headers=headers
            )
            assert response.status_code == 201
    
    @pytest.mark.asyncio
    async def test_complete_employer_journey(self, client: AsyncClient):
        """Test complete employer user journey"""
        
        # 1. Register employer
        register_data = {
            "email": "hr@company.com",
            "phone": "254712345678",
            "password": "SecurePass123!",
            "user_type": "employer",
            "company_name": "Test Construction Ltd",
            "business_registration_number": "BR123456"
        }
        
        response = await client.post("/api/auth/register", json=register_data)
        assert response.status_code == 201
        user_id = response.json()["user_id"]
        token = response.json()["access_token"]
        
        # 2. Post a job
        headers = {"Authorization": f"Bearer {token}"}
        job_data = {
            "title": "Experienced Plumber Needed",
            "description": "Need plumber for bathroom installation",
            "skill_required_id": 1,
            "county": "Nairobi",
            "sub_county": "Westlands",
            "start_date": "2024-06-01",
            "estimated_duration_days": 3,
            "payment_type": "fixed",
            "budget_min": 5000,
            "budget_max": 8000
        }
        
        response = await client.post("/api/jobs", json=job_data, headers=headers)
        assert response.status_code == 201
        job_id = response.json()["id"]
        
        # 3. Get matching fundis
        response = await client.get(
            f"/api/jobs/{job_id}/match?min_match_score=0.7",
            headers=headers
        )
        assert response.status_code == 200
        matches = response.json()["matches"]
        
        # 4. Shortlist a fundi
        if matches:
            fundi_id = matches[0]["fundi"]["id"]
            response = await client.post(
                f"/api/jobs/{job_id}/shortlist",
                json={"fundi_id": fundi_id},
                headers=headers
            )
            assert response.status_code == 200
10.4 Performance Tests
python
# tests/performance/test_load.py
import asyncio
import time
from locust import HttpUser, task, between, events
import random

class WorkForgeLoadTest(HttpUser):
    """Load testing for WorkForge"""
    
    wait_time = between(1, 3)
    
    def on_start(self):
        """Setup before starting"""
        self.token = None
        self.user_id = None
        self.job_id = None
        
        # Register test user
        response = self.client.post("/api/auth/register", json={
            "email": f"loadtest{random.randint(1, 1000000)}@example.com",
            "phone": f"2547{random.randint(10000000, 99999999)}",
            "password": "TestPass123!",
            "user_type": "employer",
            "company_name": "Load Test Corp"
        })
        
        if response.status_code == 201:
            self.token = response.json()["access_token"]
            self.user_id = response.json()["user_id"]
    
    @task(3)
    def search_fundis(self):
        """Search for fundis"""
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        
        self.client.get(
            "/api/fundis/search",
            params={
                "county": "Nairobi",
                "skill_id": random.randint(1, 10),
                "limit": 20
            },
            headers=headers
        )
    
    @task(2)
    def get_job_details(self):
        """Get job details"""
        if not self.job_id:
            return
        
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        self.client.get(f"/api/jobs/{self.job_id}", headers=headers)
    
    @task(1)
    def create_job(self):
        """Create a new job posting"""
        if not self.token:
            return
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = self.client.post("/api/jobs", json={
            "title": f"Load Test Job {random.randint(1, 1000)}",
            "description": "This is a load test job posting",
            "skill_required_id": random.randint(1, 10),
            "county": "Nairobi",
            "sub_county": "Westlands",
            "start_date": "2024-06-01",
            "payment_type": "fixed",
            "budget_min": 5000,
            "budget_max": 10000
        }, headers=headers)
        
        if response.status_code == 201:
            self.job_id = response.json()["id"]
    
    @task(1)
    def get_matches(self):
        """Get matching fundis for job"""
        if not self.job_id or not self.token:
            return
        
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get(f"/api/jobs/{self.job_id}/match", headers=headers)
    
    @events.request.add_listener
    def request_success(request_type, name, response_time, response_length, **kwargs):
        """Track successful requests"""
        if response_time > 1000:  # Log slow requests (>1s)
            print(f"Slow request: {name} took {response_time}ms")
    
    @events.request.add_listener
    def request_failure(request_type, name, response_time, exception, **kwargs):
        """Track failed requests"""
        print(f"Failed request: {name} - {exception}")

# tests/performance/test_scalability.py
import asyncio
import time
import aiohttp
import numpy as np

async def test_concurrent_users():
    """Test system with increasing concurrent users"""
    
    results = []
    
    for concurrent_users in [10, 25, 50, 100, 200]:
        print(f"\nTesting with {concurrent_users} concurrent users...")
        
        start_time = time.time()
        successful = 0
        failed = 0
        response_times = []
        
        async def make_request(session, i):
            nonlocal successful, failed
            try:
                req_start = time.time()
                
                # Random endpoint to simulate real usage
                endpoint = random.choice([
                    "/api/fundis/search?county=Nairobi",
                    "/api/jobs?status=published",
                    "/api/skills"
                ])
                
                async with session.get(f"http://localhost:8000{endpoint}") as response:
                    if response.status == 200:
                        successful += 1
                        response_times.append(time.time() - req_start)
                    else:
                        failed += 1
            except Exception as e:
                failed += 1
                print(f"Request failed: {e}")
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for i in range(concurrent_users):
                tasks.append(make_request(session, i))
            
            await asyncio.gather(*tasks)
        
        total_time = time.time() - start_time
        
        results.append({
            "concurrent_users": concurrent_users,
            "total_time": total_time,
            "successful": successful,
            "failed": failed,
            "avg_response_time": np.mean(response_times) if response_times else 0,
            "p95_response_time": np.percentile(response_times, 95) if response_times else 0,
            "requests_per_second": successful / total_time if total_time > 0 else 0
        })
    
    # Print results
    print("\n=== Scalability Test Results ===")
    for result in results:
        print(f"\nConcurrent Users: {result['concurrent_users']}")
        print(f"  Successful: {result['successful']}")
        print(f"  Failed: {result['failed']}")
        print(f"  Total Time: {result['total_time']:.2f}s")
        print(f"  Avg Response: {result['avg_response_time']*1000:.2f}ms")
        print(f"  P95 Response: {result['p95_response_time']*1000:.2f}ms")
        print(f"  RPS: {result['requests_per_second']:.2f}")
    
    return results
11. DevOps & Infrastructure
11.1 Kubernetes Configuration
yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: workforge
  labels:
    name: workforge
    environment: production

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: workforge-config
  namespace: workforge
data:
  DATABASE_URL: "postgresql://postgres:postgres@postgres-service:5432/workforge"
  REDIS_URL: "redis://redis-service:6379"
  ELASTICSEARCH_URL: "http://elasticsearch-service:9200"
  RABBITMQ_URL: "amqp://rabbitmq-service:5672"
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  API_VERSION: "v2"
  CORS_ORIGINS: "https://app.workforge.co.ke,https://admin.workforge.co.ke"

---
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: workforge-secrets
  namespace: workforge
type: Opaque
data:
  # These should be base64 encoded
  JWT_SECRET_KEY: <base64-encoded>
  MPESA_CONSUMER_SECRET: <base64-encoded>
  MPESA_PASSKEY: <base64-encoded>
  ENCRYPTION_KEY: <base64-encoded>
  SMTP_PASSWORD: <base64-encoded>
  TWILIO_AUTH_TOKEN: <base64-encoded>

---
# k8s/deployment-api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workforge-api
  namespace: workforge
  labels:
    app: workforge
    component: api
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0
  selector:
    matchLabels:
      app: workforge
      component: api
  template:
    metadata:
      labels:
        app: workforge
        component: api
    spec:
      containers:
      - name: api
        image: workforge/api:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 8001
          name: metrics
        env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: workforge-config
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: workforge-config
              key: REDIS_URL
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: workforge-secrets
              key: JWT_SECRET_KEY
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: component
                  operator: In
                  values:
                  - api
              topologyKey: kubernetes.io/hostname

---
# k8s/deployment-worker.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workforge-worker
  namespace: workforge
  labels:
    app: workforge
    component: worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workforge
      component: worker
  template:
    metadata:
      labels:
        app: workforge
        component: worker
    spec:
      containers:
      - name: worker
        image: workforge/worker:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: workforge-config
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: workforge-config
              key: REDIS_URL
        - name: RABBITMQ_URL
          valueFrom:
            configMapKeyRef:
              name: workforge-config
              key: RABBITMQ_URL
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: workforge-api-service
  namespace: workforge
spec:
  selector:
    app: workforge
    component: api
  ports:
  - port: 80
    targetPort: 8000
    name: http
  - port: 8001
    targetPort: 8001
    name: metrics
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: workforge-ingress
  namespace: workforge
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.workforge.co.ke"
spec:
  tls:
  - hosts:
    - api.workforge.co.ke
    secretName: workforge-tls
  rules:
  - host: api.workforge.co.ke
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: workforge-api-service
            port:
              number: 80

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: workforge-api-hpa
  namespace: workforge
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workforge-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: 100
11.2 CI/CD Pipeline
yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: "registry.workforge.co.ke"
  KUBE_NAMESPACE: "workforge"

cache:
  paths:
    - .cache/pip
    - node_modules/

# Test Stage
unit-tests:
  stage: test
  image: python:3.11-slim
  before_script:
    - pip install poetry
    - poetry install
  script:
    - poetry run pytest tests/unit -v --cov=app --cov-report=term --cov-report=xml
  artifacts:
    reports:
      cobertura: coverage.xml

integration-tests:
  stage: test
  image: docker:latest
  services:
    - docker:dind
    - postgres:15
    - redis:7
  variables:
    POSTGRES_DB: workforge_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  before_script:
    - apk add --no-cache docker-compose
    - docker-compose -f docker-compose.test.yml up -d
  script:
    - docker-compose -f docker-compose.test.yml run tests
  after_script:
    - docker-compose -f docker-compose.test.yml down

security-scan:
  stage: test
  image: aquasec/trivy
  script:
    - trivy fs --severity HIGH,CRITICAL --no-progress .
    - trivy config --severity HIGH,CRITICAL --no-progress .

lint:
  stage: test
  image: python:3.11-slim
  before_script:
    - pip install black flake8 mypy
  script:
    - black --check .
    - flake8 .
    - mypy app

# Build Stage
build-api:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_REGISTRY/workforge/api:$CI_COMMIT_SHA -f docker/api.Dockerfile .
    - docker tag $DOCKER_REGISTRY/workforge/api:$CI_COMMIT_SHA $DOCKER_REGISTRY/workforge/api:latest
    - docker push $DOCKER_REGISTRY/workforge/api:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/workforge/api:latest
  only:
    - main
    - develop

build-worker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_REGISTRY/workforge/worker:$CI_COMMIT_SHA -f docker/worker.Dockerfile .
    - docker tag $DOCKER_REGISTRY/workforge/worker:$CI_COMMIT_SHA $DOCKER_REGISTRY/workforge/worker:latest
    - docker push $DOCKER_REGISTRY/workforge/worker:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/workforge/worker:latest
  only:
    - main
    - develop

build-frontend:
  stage: build
  image: node:18
  script:
    - cd frontend
    - npm ci
    - npm run build
    - docker build -t $DOCKER_REGISTRY/workforge/frontend:$CI_COMMIT_SHA -f docker/frontend.Dockerfile .
    - docker tag $DOCKER_REGISTRY/workforge/frontend:$CI_COMMIT_SHA $DOCKER_REGISTRY/workforge/frontend:latest
    - docker push $DOCKER_REGISTRY/workforge/frontend:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/workforge/frontend:latest
  only:
    - main
    - develop

# Deploy Stage
deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/workforge-api -n $KUBE_NAMESPACE api=$DOCKER_REGISTRY/workforge/api:$CI_COMMIT_SHA
    - kubectl set image deployment/workforge-worker -n $KUBE_NAMESPACE worker=$DOCKER_REGISTRY/workforge/worker:$CI_COMMIT_SHA
    - kubectl rollout status deployment/workforge-api -n $KUBE_NAMESPACE
    - kubectl rollout status deployment/workforge-worker -n $KUBE_NAMESPACE
  environment:
    name: staging
    url: https://staging.workforge.co.ke
  only:
    - develop

deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/workforge-api -n $KUBE_NAMESPACE api=$DOCKER_REGISTRY/workforge/api:$CI_COMMIT_SHA
    - kubectl set image deployment/workforge-worker -n $KUBE_NAMESPACE worker=$DOCKER_REGISTRY/workforge/worker:$CI_COMMIT_SHA
    - kubectl rollout status deployment/workforge-api -n $KUBE_NAMESPACE
    - kubectl rollout status deployment/workforge-worker -n $KUBE_NAMESPACE
  environment:
    name: production
    url: https://api.workforge.co.ke
  only:
    - main
  when: manual

# Monitoring
performance-test:
  stage: deploy
  image: locustio/locust
  script:
    - locust -f tests/performance/locustfile.py --headless -u 100 -r 10 --run-time 1m --host https://staging.workforge.co.ke
  only:
    - schedules
11.3 Monitoring & Observability
yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__
  
  - job_name: 'postgres'
    static_configs:
    - targets: ['postgres-exporter:9187']
  
  - job_name: 'redis'
    static_configs:
    - targets: ['redis-exporter:9121']
  
  - job_name: 'rabbitmq'
    static_configs:
    - targets: ['rabbitmq-exporter:9419']

# monitoring/alerts.yml
groups:
- name: workforge_alerts
  interval: 30s
  rules:
  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High HTTP error rate"
      description: "Error rate is {{ $value }}% for the last 5 minutes"
  
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time"
      description: "P95 response time is {{ $value }}s"
  
  - alert: DatabaseDown
    expr: pg_up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database is down"
      description: "PostgreSQL instance {{ $labels.instance }} is unreachable"
  
  - alert: QueueBacklog
    expr: rabbitmq_queue_messages{queue="workforge_tasks"} > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Queue backlog detected"
      description: "Queue {{ $labels.queue }} has {{ $value }} messages"
  
  - alert: LowDiskSpace
    expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Low disk space"
      description: "Disk usage is {{ $value }}%"
  
  - alert: PodRestarting
    expr: increase(kube_pod_container_status_restarts_total[10m]) > 3
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Pod restarting frequently"
      description: "Pod {{ $labels.pod }} has restarted {{ $value }} times"

# monitoring/grafana/dashboards/workforge.json
{
  "dashboard": {
    "title": "WorkForge Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (endpoint)",
            "legendFormat": "{{ endpoint }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error %"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, endpoint))",
            "legendFormat": "{{ endpoint }}"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "stat",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(active_users)"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "connections"
          }
        ]
      },
      {
        "title": "Queue Size",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rabbitmq_queue_messages",
            "legendFormat": "{{ queue }}"
          }
        ]
      }
    ]
  }
}
11.4 Backup & Disaster Recovery
yaml
# backup/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: workforge
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            env:
            - name: PGHOST
              value: postgres-service
            - name: PGUSER
              value: postgres
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: PGDATABASE
              value: workforge
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -Fc > /backup/workforge-$(date +%Y%m%d-%H%M%S).dump
              gzip /backup/*.dump
              aws s3 cp /backup/ s3://workforge-backups/postgres/ --recursive
              find /backup -type f -mtime +7 -delete
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
            - name: aws-credentials
              mountPath: /root/.aws
              readOnly: true
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          - name: aws-credentials
            secret:
              secretName: aws-credentials
          restartPolicy: OnFailure

# backup/disaster-recovery.md
# Disaster Recovery Plan

## 1. Recovery Objectives
- **RPO (Recovery Point Objective):** 1 hour
- **RTO (Recovery Time Objective):** 4 hours
- **Data Loss Tolerance:** Maximum 1 hour of transactions

## 2. Backup Strategy
- **Database:** Full backup daily, WAL archiving continuous
- **Files:** Hourly incremental backups to S3
- **Configuration:** Git version control + Kubernetes manifests

## 3. Recovery Procedures

### Database Recovery
```bash
# Restore from latest backup
kubectl exec -it postgres-pod -- pg_restore -d workforge /backup/latest.dump

# Point-in-time recovery
kubectl exec -it postgres-pod -- bash -c "
  pg_basebackup -D /var/lib/postgresql/data/restore
  cd /var/lib/postgresql/data/restore
  cp /archive/wal_files/* ./pg_wal/
  echo \"restore_command = 'cp /archive/wal_files/%f %p'\" >> postgresql.conf
  touch recovery.signal
"
Full System Recovery
yaml
# 1. Restore Kubernetes infrastructure
terraform apply

# 2. Restore database
kubectl apply -f k8s/postgres-restore.yaml

# 3. Restore applications
kubectl apply -f k8s/deployment-api.yaml
kubectl apply -f k8s/deployment-worker.yaml
kubectl apply -f k8s/deployment-frontend.yaml

# 4. Verify recovery
kubectl get pods -n workforge
kubectl logs -n workforge deployment/workforge-api
4. Failover to Secondary Region
yaml
apiVersion: v1
kind: Service
metadata:
  name: workforge-global
spec:
  type: ExternalName
  externalName: workforge-dr.workforge.co.ke
---
# Global load balancer configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: global-lb-config
data:
  primary: "workforge-primary.workforge.co.ke"
  secondary: "workforge-dr.workforge.co.ke"
  health_check: "/health"
  failover_threshold: "3"
5. Disaster Recovery Testing Schedule
Monthly: Database restore test

Quarterly: Full failover drill

Annually: Disaster recovery audit

6. Communication Plan
Incident detected: Alert on-call engineer

Confirmed disaster: Notify stakeholders

Recovery initiated: Update status page

Service restored: Send post-mortem

text

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [x] Project setup and repository structure
- [x] Database schema design
- [x] Core authentication system
- [x] Basic user registration (fundi/employer)
- [x] Development environment setup
- [x] CI/CD pipeline foundation

### Phase 2: Core Features (Weeks 5-8)
- [ ] Fundi profile management
- [ ] Employer profile management
- [ ] Job posting system
- [ ] Basic matching algorithm
- [ ] Notification system (email/SMS)
- [ ] Admin dashboard basics

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Enhanced matching engine with ML
- [ ] Payment integration (M-Pesa)
- [ ] Escrow system
- [ ] Rating and review system
- [ ] Document verification workflow
- [ ] Analytics dashboard

### Phase 4: Enterprise Features (Weeks 13-16)
- [ ] Advanced fraud detection
- [ ] Skill recommendation engine
- [ ] Price optimization
- [ ] Bulk hiring workflows
- [ ] API marketplace for partners
- [ ] White-label solutions

### Phase 5: Scaling & Optimization (Weeks 17-20)
- [ ] Performance optimization
- [ ] Load testing and tuning
- [ ] Multi-region deployment
- [ ] Disaster recovery implementation
- [ ] Security audit and penetration testing
- [ ] Compliance certification (ISO 27001)

### Phase 6: Launch & Growth (Weeks 21-24)
- [ ] Beta testing with 100 users
- [ ] Marketing campaign launch
- [ ] Partner integrations
- [ ] Mobile app development
- [ ] Community building
- [ ] Continuous improvement based on feedback

---

## 13. Risk Mitigation Strategies

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **Data Breach** | Medium | Critical | Encryption at rest and in transit, regular security audits, penetration testing, employee training |
| **Payment Fraud** | Medium | High | ML-based fraud detection, escrow system, transaction limits, manual review triggers |
| **Platform Downtime** | Low | High | Multi-region deployment, auto-scaling, load balancing, 24/7 monitoring |
| **User Churn** | High | Medium | Engagement analytics, feedback loops, loyalty programs, quality assurance |
| **Regulatory Changes** | Low | Medium | Legal compliance team, flexible architecture, regular audits |
| **Competitor Entry** | Medium | Medium | Continuous innovation, community building, exclusive partnerships |
| **Scalability Issues** | Medium | High | Microservices architecture, database sharding, caching, load testing |
| **Skill Mismatch** | Medium | Medium | ML-powered matching, skill verification, continuous feedback |

---

## 14. Success Metrics & KPIs

### Business Metrics
- **User Growth:** 50% MoM for first 6 months
- **Job Completion Rate:** >85%
- **User Retention:** >60% after 3 months
- **Average Match Time:** <24 hours
- **Platform Revenue:** 15% of transaction volume
- **Customer Acquisition Cost:** <KES 500
- **Lifetime Value:** >KES 10,000

### Technical Metrics
- **API Response Time:** P95 <500ms
- **System Uptime:** 99.9%
- **Error Rate:** <1% of requests
- **Database Queries:** <100ms average
- **Cache Hit Ratio:** >80%
- **Deployment Frequency:** Daily
- **MTTR:** <1 hour

### User Satisfaction
- **Fundi NPS:** >50
- **Employer NPS:** >60
- **Average Rating:** >4.5/5
- **Dispute Rate:** <2% of transactions
- **Repeat Usage:** >70% of users

### Financial Metrics
- **Monthly Recurring Revenue:** KES 5M by month 12
- **Gross Margin:** >70%
- **Average Transaction Value:** KES 5,000
- **Payment Success Rate:** >95%
- **Escrow Utilization:** >80% of transactions

---

## 15. Appendices

### A. Glossary of Terms
- **Fundi:** Skilled worker (plumber, electrician, carpenter, etc.)
- **Employer:** Individual or company hiring fundis
- **Escrow:** Secure payment holding until job completion
- **Verification Level:** Trust score based on verified credentials
- **Match Score:** Algorithm-generated compatibility percentage

### B. Compliance Requirements
- Kenya Data Protection Act 2019
- Payment gateway regulations (CBK)
- Tax compliance (KRA)
- Labor laws and worker rights

### C. Third-Party Integrations
- Safaricom M-Pesa API
- Integrated Population Registration System (IPRS)
- Google Maps Platform
- Twilio/Sinch for communications
- AWS/Azure cloud services

### D. Contact Information
- **Technical Lead:** [Name] - tech@workforge.co.ke
- **Product Manager:** [Name] - product@workforge.co.ke
- **Security Officer:** [Name] - security@workforge.co.ke
- **Emergency:** oncall@workforge.co.ke

---

**Document Version:** 1.0  
**Last Updated:** May 2024  
**Next Review:** Quarterly  
**Owner:** WorkForge Product Team

---

This comprehensive agenda provides a complete blueprint for building WorkForge as an enterprise-grade platform. It covers every aspect from architecture and implementation to operations and growth, ensuring that your development team (including AI agents) has all the details needed to execute successfully.
15. Geospatial Matching Engine (Uber-Style Proximity System)
15.1 Real-Time Location Architecture
# geospatial/location_service.py
import asyncio
from math import radians, cos, sin, asin, sqrt
from typing import List, Dict, Any, Optional
from redis.client import Redis
import json
from geopy.distance import geodesic
import aioredis

class GeospatialMatchingService:
    """
    Uber-style real-time geospatial matching service
    Connects employers with nearest available fundis in real-time
    """
    
    def __init__(self):
        self.redis_client = aioredis.from_url(
            "redis://redis-service:6379",
            decode_responses=True
        )
        # Geospatial indexes in Redis
        self.FUNDI_LOCATION_KEY = "fundi:locations"
        self.JOB_LOCATION_KEY = "job:locations"
        self.ACTIVE_FUNDI_KEY = "fundi:active"
        self.PENDING_JOBS_KEY = "jobs:pending"
        
    async def update_fundi_location(
        self, 
        fundi_id: str, 
        latitude: float, 
        longitude: float,
        accuracy: float = 10.0
    ):
        """
        Update fundi's real-time location (like Uber driver app)
        Called every few seconds from mobile app
        """
        # Store in Redis geospatial index
        await self.redis_client.geoadd(
            self.FUNDI_LOCATION_KEY,
            (longitude, latitude, fundi_id)  # Redis uses (lon, lat) order
        )
        
        # Store last update timestamp
        await self.redis_client.hset(
            f"fundi:last_seen:{fundi_id}`",
            mapping={
                "lat": latitude,
                "lon": longitude,
                "timestamp": asyncio.get_event_loop().time(),
                "accuracy": accuracy
            }
        )
        
        # Set expiration (clean up inactive fundis after 5 minutes)
        await self.redis_client.expire(f"fundi:last_seen:{fundi_id}", 300)
        
        # If fundi is available, add to active set
        is_available = await self.redis_client.sismember(
            self.ACTIVE_FUNDI_KEY, 
            fundi_id
        )
        
        if is_available:
            # Broadcast location update to nearby employers looking for this skill
            await self.broadcast_fundi_availability(fundi_id, latitude, longitude)
    
    async def find_nearest_available_fundis(
        self,
        employer_id: str,
        job_id: str,
        latitude: float,
        longitude: float,
        skill_required: int,
        radius_km: float = 10.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find nearest available fundis for a job (like Uber finding nearby drivers)
        Returns fundis sorted by distance
        """
        
        # Find fundis within radius using Redis geospatial
        nearby_fundis = await self.redis_client.georadius(
            self.FUNDI_LOCATION_KEY,
            longitude,
            latitude,
            radius_km,
            unit="km",
            withcoord=True,
            withdist=True,
            sort="ASC"
        )
        
        if not nearby_fundis:
            return []
        
        # Filter by skill and availability
        matching_fundis = []
        for fundi_id, distance, coord in nearby_fundis[:limit]:
            # Check if fundi has required skill and is available
            if await self.is_fundi_eligible(fundi_id, skill_required):
                fundi_details = await self.get_fundi_details(fundi_id)
                
                # Calculate ETA based on distance and traffic
                eta_minutes = self.calculate_eta(distance, fundi_details.get('transport_mode', 'walking'))
                
                matching_fundis.append({
                    "fundi_id": fundi_id,
                    "name": fundi_details.get('name'),
                    "distance_km": round(distance, 2),
                    "eta_minutes": eta_minutes,
                    "rating": fundi_details.get('rating', 0),
                    "hourly_rate": fundi_details.get('hourly_rate', 0),
                    "profile_photo": fundi_details.get('profile_photo'),
                    "coordinates": {
                        "lat": coord[1],
                        "lon": coord[0]
                    },
                    "match_score": await self.calculate_match_score(
                        job_id, fundi_id, distance
                    )
                })
        
        # Sort by combined score (distance + rating + price)
        matching_fundis.sort(key=lambda x: x['match_score'], reverse=True)
        
        return matching_fundis
    
    async def find_nearest_jobs_for_fundi(
        self,
        fundi_id: str,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find nearest available jobs for a fundi (like Uber finding nearby rides)
        Returns jobs sorted by distance
        """
        
        # Get fundi's skills
        fundi_skills = await self.get_fundi_skills(fundi_id)
        
        if not fundi_skills:
            return []
        
        # Find jobs within radius
        nearby_jobs = await self.redis_client.georadius(
            self.JOB_LOCATION_KEY,
            longitude,
            latitude,
            radius_km,
            unit="km",
            withcoord=True,
            withdist=True,
            sort="ASC"
        )
        
        matching_jobs = []
        for job_id, distance, coord in nearby_jobs[:limit]:
            job_details = await self.get_job_details(job_id)
            
            # Check if job requires skill fundi has
            if job_details.get('skill_required_id') in fundi_skills:
                # Check if job is still open
                if job_details.get('status') == 'published':
                    matching_jobs.append({
                        "job_id": job_id,
                        "title": job_details.get('title'),
                        "employer": job_details.get('employer_name'),
                        "distance_km": round(distance, 2),
                        "eta_minutes": self.calculate_eta(distance, 'driving'),
                        "budget": job_details.get('budget_max'),
                        "payment_type": job_details.get('payment_type'),
                        "coordinates": {
                            "lat": coord[1],
                            "lon": coord[0]
                        },
                        "match_score": await self.calculate_job_match_score(
                            fundi_id, job_id, distance
                        )
                    })
        
        matching_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        return matching_jobs
    
    async def request_immediate_match(
        self,
        employer_id: str,
        job_id: str,
        latitude: float,
        longitude: float,
        skill_required: int
    ) -> Dict[str, Any]:
        """
        Request immediate matching (like Uber requesting a ride)
        This pushes notification to nearest available fundis
        """
        
        # Find nearest available fundis
        nearby_fundis = await self.find_nearest_available_fundis(
            employer_id=employer_id,
            job_id=job_id,
            latitude=latitude,
            longitude=longitude,
            skill_required=skill_required,
            radius_km=5.0,  # Start with 5km radius
            limit=5
        )
        
        if not nearby_fundis:
            # Expand radius if no fundis found
            nearby_fundis = await self.find_nearest_available_fundis(
                employer_id=employer_id,
                job_id=job_id,
                latitude=latitude,
                longitude=longitude,
                skill_required=skill_required,
                radius_km=10.0,
                limit=5
            )
        
        if not nearby_fundis:
            return {
                "status": "no_fundis_available",
                "message": "No available fundis in your area"
            }
        
        # Create match request
        match_request_id = f"match:{job_id}:{asyncio.get_event_loop().time()}"
        
        # Store match request in Redis with TTL
        match_request = {
            "id": match_request_id,
            "job_id": job_id,
            "employer_id": employer_id,
            "latitude": latitude,
            "longitude": longitude,
            "skill_required": skill_required,
            "status": "pending",
            "created_at": asyncio.get_event_loop().time(),
            "candidates": [
                {
                    "fundi_id": f['fundi_id'],
                    "distance": f['distance_km'],
                    "eta": f['eta_minutes'],
                    "status": "pending"
                }
                for f in nearby_fundis
            ]
        }
        
        await self.redis_client.setex(
            f"match_request:{match_request_id}`",
            300,  # 5 minutes TTL
            json.dumps(match_request)
        )
        
        # Notify top 3 nearest fundis (like Uber sending to nearby drivers)
        for candidate in match_request['candidates'][:3]:
            await self.notify_fundi_of_job(
                fundi_id=candidate['fundi_id'],
                job_id=job_id,
                employer_location={
                    "lat": latitude,
                    "lon": longitude
                },
                distance=candidate['distance'],
                eta=candidate['eta'],
                match_request_id=match_request_id
            )
        
        return {
            "status": "matching_initiated",
            "match_request_id": match_request_id,
            "nearby_fundis": nearby_fundis[:3],
            "message": f"Notifying {min(3, len(nearby_fundis))} nearby fundis"
        }
    
    async def accept_match(
        self,
        fundi_id: str,
        match_request_id: str,
        estimated_arrival: int  # minutes
    ) -> Dict[str, Any]:
        """
        Fundi accepts the job (like driver accepting a ride)
        First to accept gets the job
        """
        
        # Get match request
        match_request_json = await self.redis_client.get(
            f"match_request:{match_request_id}"
        )
        
        if not match_request_json:
            return {
                "status": "expired",
                "message": "Match request has expired"
            }
        
        match_request = json.loads(match_request_json)
        
        if match_request['status'] != 'pending':
            return {
                "status": "already_matched",
                "message": "This job has already been assigned"
            }
        
        # Check if this fundi was a candidate
        candidate = next(
            (c for c in match_request['candidates'] if c['fundi_id'] == fundi_id),
            None
        )
        
        if not candidate:
            return {
                "status": "not_invited",
                "message": "You were not invited to this job"
            }
        
        # Accept the match - first come first served
        match_request['status'] = 'accepted'
        match_request['accepted_by'] = fundi_id
        match_request['accepted_at'] = asyncio.get_event_loop().time()
        match_request['estimated_arrival'] = estimated_arrival
        
        await self.redis_client.setex(
            f"match_request:{match_request_id}",
            300,
            json.dumps(match_request)
        )
        
        # Create contract
        contract = await self.create_instant_contract(
            job_id=match_request['job_id'],
            fundi_id=fundi_id,
            employer_id=match_request['employer_id'],
            estimated_arrival=estimated_arrival
        )
        
        # Notify employer
        await self.notify_employer_of_match(
            employer_id=match_request['employer_id'],
            fundi_id=fundi_id,
            estimated_arrival=estimated_arrival,
            contract_id=contract['id']
        )
        
        # Notify other candidates that job is taken
        await self.notify_candidates_job_taken(
            match_request['candidates'],
            match_request['job_id'],
            fundi_id
        )
        
        return {
            "status": "matched",
            "contract_id": contract['id'],
            "estimated_arrival": estimated_arrival,
            "fundi_location": await self.get_fundi_location(fundi_id),
            "employer_details": await self.get_employer_details(
                match_request['employer_id']
            )
        }
    
    async def track_fundi_to_job(
        self,
        contract_id: str,
        fundi_id: str,
        employer_id: str
    ):
        """
        Track fundi's progress to job location (like Uber ETA tracking)
        """
        
        # Get job location
        contract = await self.get_contract(contract_id)
        job_location = contract['job_location']
        
        while True:
            # Get fundi's current location
            fundi_location = await self.get_fundi_location(fundi_id)
            
            if not fundi_location:
                break
            
            # Calculate distance remaining
            distance_remaining = geodesic(
                (fundi_location['lat'], fundi_location['lon']),
                (job_location['lat'], job_location['lon'])
            ).km
            
            # Calculate ETA
            eta = self.calculate_eta(distance_remaining, 'driving')
            
            # Broadcast to employer
            await self.redis_client.publish(
                f"tracking:{contract_id}",
                json.dumps({
                    "type": "location_update",
                    "fundi_id": fundi_id,
                    "lat": fundi_location['lat'],
                    "lon": fundi_location['lon'],
                    "distance_remaining_km": round(distance_remaining, 2),
                    "eta_minutes": eta,
                    "timestamp": asyncio.get_event_loop().time()
                })
            )
            
            # If fundi arrived
            if distance_remaining < 0.1:  # Within 100 meters
                await self.redis_client.publish(
                    f"tracking:{contract_id}",
                    json.dumps({
                        "type": "fundi_arrived",
                        "fundi_id": fundi_id,
                        "timestamp": asyncio.get_event_loop().time()
                    })
                )
                break
            
            await asyncio.sleep(5)  # Update every 5 seconds
    
    def calculate_eta(self, distance_km: float, mode: str = 'walking') -> int:
        """
        Calculate ETA in minutes based on distance and transport mode
        """
        speeds = {
            'walking': 5,  # km/h
            'bicycle': 15,
            'motorcycle': 40,
            'car': 30,
            'public_transport': 20
        }
        
        speed = speeds.get(mode, 5)
        hours = distance_km / speed
        minutes = hours * 60
        
        return round(minutes)
    
    async def get_fundi_location(self, fundi_id: str) -> Optional[Dict]:
        """
        Get fundi's current location
        """
        location = await self.redis_client.hgetall(
            f"fundi:last_seen:{fundi_id}"
        )
        
        if location:
            return {
                "lat": float(location['lat']),
                "lon": float(location['lon']),
                "timestamp": float(location['timestamp']),
                "accuracy": float(location.get('accuracy', 10))
            }
        return None
    
    async def broadcast_fundi_availability(
        self,
        fundi_id: str,
        latitude: float,
        longitude: float
    ):
        """
        Broadcast that fundi is available to nearby employers
        (Like Uber showing available drivers on map)
        """
        
        # Find employers with pending jobs in area
        pending_jobs = await self.redis_client.georadius(
            self.JOB_LOCATION_KEY,
            longitude,
            latitude,
            5,  # 5km radius
            unit="km"
        )
        
        for job_id in pending_jobs:
            job_details = await self.get_job_details(job_id)
            
            # Check if fundi has required skill
            fundi_skills = await self.get_fundi_skills(fundi_id)
            if job_details.get('skill_required_id') in fundi_skills:
                # Notify employer of available fundi nearby
                await self.redis_client.publish(
                    f"employer:jobs:{job_details['employer_id']}",
                    json.dumps({
                        "type": "fundi_available_nearby",
                        "job_id": job_id,
                        "fundi_id": fundi_id,
                        "distance_km": await self.calculate_distance(
                            (latitude, longitude),
                            (job_details['latitude'], job_details['longitude'])
                        )
                    })
                )

15.2 Dynamic Geofencing & Service Areas
# geospatial/geofencing.py
from shapely.geometry import Point, Polygon
import json
import requests

class DynamicGeofencing:
    """
    Create dynamic service areas based on fundi density and demand
    Like Uber's heat maps showing where drivers are needed
    """
    
    async def create_demand_heatmap(
        self,
        city: str,
        date: datetime
    ) -> Dict[str, Any]:
        """
        Generate heatmap of job demand and fundi availability
        """
        
        # Get job density per grid cell
        job_density = await self.get_job_density(city, date)
        
        # Get fundi availability per grid cell
        fundi_density = await self.get_fundi_density(city, date)
        
        # Calculate supply-demand ratio
        heatmap = []
        for cell in job_density:
            ratio = cell['jobs'] / max(cell['fundis'], 1)
            
            # Color code based on ratio
            if ratio > 2:  # High demand, low supply
                color = "red"
                recommendation = "Increase prices, recruit more fundis"
            elif ratio > 1:  # Balanced
                color = "yellow"
                recommendation = "Normal operations"
            else:  # Low demand, high supply
                color = "green"
                recommendation = "Decrease prices, fundis should move to other areas"
            
            heatmap.append({
                "grid_cell": cell['coordinates'],
                "job_density": cell['jobs'],
                "fundi_density": cell['fundis'],
                "supply_demand_ratio": ratio,
                "color": color,
                "recommendation": recommendation
            })
        
        return {
            "city": city,
            "date": date.isoformat(),
            "heatmap": heatmap,
            "surge_pricing_zones": self.calculate_surge_zones(heatmap)
        }
    
    async def get_job_density(self, city: str, date: datetime) -> List[Dict]:
        """
        Get job density per grid cell (1km x 1km)
        """
        query = """
            SELECT 
                ST_SnapToGrid(ST_MakePoint(longitude, latitude), 0.01) as grid_cell,
                COUNT(*) as job_count,
                AVG(budget_max) as avg_budget
            FROM job_postings
            WHERE created_at::date = $1
                AND status = 'published'
            GROUP BY grid_cell
        """
        
        results = await db.fetch_all(query, date.date())
        
        return [
            {
                "coordinates": r['grid_cell'],
                "jobs": r['job_count'],
                "avg_budget": r['avg_budget']
            }
            for r in results
        ]
    
    async def get_fundi_density(self, city: str, date: datetime) -> List[Dict]:
        """
        Get fundi density per grid cell based on real-time locations
        """
        # Get all active fundi locations from Redis
        active_fundis = await redis_client.zrange(
            f"fundi:active:{city}",
            0,
            -1,
            withscores=True
        )
        
        # Group by grid cell
        density = {}
        for fundi_id, score in active_fundis:
            location = await redis_client.hgetall(f"fundi:last_seen:{fundi_id}")
            if location:
                lat, lon = float(location['lat']), float(location['lon'])
                grid_cell = f"{round(lat, 2)},{round(lon, 2)}"
                
                if grid_cell not in density:
                    density[grid_cell] = {
                        "count": 0,
                        "coordinates": [round(lat, 2), round(lon, 2)]
                    }
                density[grid_cell]['count'] += 1
        
        return [
            {
                "coordinates": v['coordinates'],
                "fundis": v['count']
            }
            for v in density.values()
        ]
    
    def calculate_surge_zones(self, heatmap: List[Dict]) -> List[Dict]:
        """
        Calculate surge pricing zones based on demand
        """
        surge_zones = []
        
        for cell in heatmap:
            if cell['supply_demand_ratio'] > 2:
                surge_multiplier = min(1.5 + (cell['supply_demand_ratio'] * 0.1), 3.0)
                surge_zones.append({
                    "zone": cell['grid_cell'],
                    "multiplier": round(surge_multiplier, 1),
                    "reason": "High demand, low supply"
                })
            elif cell['supply_demand_ratio'] < 0.5:
                surge_multiplier = max(0.7, cell['supply_demand_ratio'])
                surge_zones.append({
                    "zone": cell['grid_cell'],
                    "multiplier": round(surge_multiplier, 1),
                    "reason": "Low demand, high supply"
                })
        
        return surge_zones
Proximity-Based Notifications
# notifications/proximity_alerts.py
from geopy.distance import geodesic
import asyncio

class ProximityAlertSystem:
    """
    Send alerts when fundis enter specific zones or approach job locations
    """
    
    async def setup_geofence_alerts(
        self,
        employer_id: str,
        job_id: str,
        latitude: float,
        longitude: float,
        radius_meters: float = 100
    ):
        """
        Set up geofence around job location
        Alert when fundi enters the zone
        """
        
        geofence_key = f"geofence:job:{job_id}"
        
        # Store geofence in Redis
        await redis_client.setex(
            geofence_key,
            86400,  # 24 hours
            json.dumps({
                "job_id": job_id,
                "employer_id": employer_id,
                "center": {"lat": latitude, "lon": longitude},
                "radius": radius_meters,
                "active": True
            })
        )
        
        # Start monitoring thread
        asyncio.create_task(self.monitor_geofence(job_id))
    
    async def monitor_geofence(self, job_id: str):
        """
        Monitor fundis entering/exiting geofence
        """
        geofence = await redis_client.get(f"geofence:job:{job_id}")
        if not geofence:
            return
        
        geofence = json.loads(geofence)
        center = (geofence['center']['lat'], geofence['center']['lon'])
        radius = geofence['radius']
        
        # Track fundis inside geofence
        inside_fundis = set()
        
        while geofence['active']:
            # Get all active fundis
            active_fundis = await redis_client.smembers("fundi:active")
            
            for fundi_id in active_fundis:
                location = await redis_client.hgetall(f"fundi:last_seen:{fundi_id}")
                
                if location:
                    fundi_pos = (float(location['lat']), float(location['lon']))
                    distance = geodesic(center, fundi_pos).meters
                    
                    if distance <= radius:
                        if fundi_id not in inside_fundis:
                            # Fundi just entered
                            await self.notify_fundi_entry(
                                fundi_id,
                                job_id,
                                geofence['employer_id'],
                                distance
                            )
                            inside_fundis.add(fundi_id)
                    else:
                        if fundi_id in inside_fundis:
                            # Fundi just left
                            await self.notify_fundi_exit(
                                fundi_id,
                                job_id,
                                geofence['employer_id']
                            )
                            inside_fundis.remove(fundi_id)
            
            await asyncio.sleep(5)  # Check every 5 seconds
    
    async def notify_fundi_entry(
        self,
        fundi_id: str,
        job_id: str,
        employer_id: str,
        distance: float
    ):
        """
        Notify employer when fundi enters job area
        """
        await notification_service.send(
            user_id=employer_id,
            type="fundi_arrived",
            data={
                "job_id": job_id,
                "fundi_id": fundi_id,
                "distance_meters": round(distance),
                "message": f"Fundi is within {round(distance)} meters of job location"
            }
        )
    
    async def find_fundis_in_radius(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 1.0
    ) -> List[Dict]:
        """
        Find all active fundis within a specific radius
        """
        nearby_fundis = await redis_client.georadius(
            "fundi:locations",
            longitude,
            latitude,
            radius_km,
            unit="km",
            withcoord=True,
            withdist=True
        )
        
        results = []
        for fundi_id, distance, coord in nearby_fundis:
            fundi_details = await self.get_fundi_summary(fundi_id)
            results.append({
                "fundi_id": fundi_id,
                "name": fundi_details['name'],
                "distance_km": round(distance, 2),
                "rating": fundi_details['rating'],
                "skills": fundi_details['skills'],
                "location": {"lat": coord[1], "lon": coord[0]}
            })
        
        return results

15.6 WebSocket for Real-Time Matching
# websocket/match_socket.py
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

class MatchConnectionManager:
    """
    Manage WebSocket connections for real-time matching
    """
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.fundi_sockets: Dict[str, WebSocket] = {}
        self.employer_sockets: Dict[str, WebSocket] = {}
        self.job_subscriptions: Dict[str, Set[str]] = {}  # job_id -> set of fundi_ids
    
    async def connect_fundi(self, fundi_id: str, websocket: WebSocket):
        await websocket.accept()
        self.fundi_sockets[fundi_id] = websocket
        self.active_connections[fundi_id] = websocket
        
        # Mark fundi as online
        await redis_client.sadd("fundi:online", fundi_id)
    
    async def connect_employer(self, employer_id: str, websocket: WebSocket):
        await websocket.accept()
        self.employer_sockets[employer_id] = websocket
        self.active_connections[employer_id] = websocket
    
    async def disconnect(self, user_id: str):
        if user_id in self.fundi_sockets:
            del self.fundi_sockets[user_id]
            await redis_client.srem("fundi:online", user_id)
        elif user_id in self.employer_sockets:
            del self.employer_sockets[user_id]
        
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def broadcast_to_nearby_fundis(
        self,
        job_id: str,
        job_location: tuple,
        skill_required: int,
        radius_km: float = 5.0
    ):
        """
        Broadcast job to nearby fundis (like Uber broadcasting ride request)
        """
        
        # Find nearby fundis using Redis geospatial
        nearby_fundis = await redis_client.georadius(
            "fundi:locations",
            job_location[1],  # lon
            job_location[0],  # lat
            radius_km,
            unit="km"
        )
        
        # Filter by skill and online status
        for fundi_id in nearby_fundis:
            if fundi_id in self.fundi_sockets:
                # Check if fundi has required skill
                fundi_skills = await redis_client.smembers(f"fundi:skills:{fundi_id}")
                
                if str(skill_required) in fundi_skills:
                    # Send job notification
                    await self.fundi_sockets[fundi_id].send_json({
                        "type": "new_job_alert",
                        "job_id": job_id,
                        "distance_km": await self.calculate_distance(
                            job_location,
                            await self.get_fundi_location(fundi_id)
                        ),
                        "estimated_earnings": await self.calculate_estimated_earnings(
                            job_id
                        ),
                        "expires_in": 30  # seconds
                    })
                    
                    # Add to job subscribers
                    if job_id not in self.job_subscriptions:
                        self.job_subscriptions[job_id] = set()
                    self.job_subscriptions[job_id].add(fundi_id)
    
    async def notify_fundi_response(
        self,
        job_id: str,
        fundi_id: str,
        response: str  # 'accept' or 'decline'
    ):
        """
        Handle fundi's response to job alert
        First to accept gets the job
        """
        
        if response == 'accept':
            # Check if job is still available
            job_status = await redis_client.get(f"job:status:{job_id}")
            
            if job_status == 'available':
                # Mark job as taken
                await redis_client.setex(f"job:status:{job_id}", 3600, "taken")
                
                # Get job details
                job_details = await self.get_job_details(job_id)
                
                # Notify employer
                if job_details['employer_id'] in self.employer_sockets:
                    await self.employer_sockets[job_details['employer_id']].send_json({
                        "type": "job_accepted",
                        "job_id": job_id,
                        "fundi_id": fundi_id,
                        "eta_minutes": await self.calculate_eta(
                            await self.get_fundi_location(fundi_id),
                            (job_details['latitude'], job_details['longitude'])
                        )
                    })
                
                # Notify other fundis that job is taken
                await self.notify_fundis_job_taken(job_id, fundi_id)
                
                return True
        
        return False
    
    async def notify_fundis_job_taken(self, job_id: str, accepted_fundi_id: str):
        """
        Notify all other fundis that job is no longer available
        """
        if job_id in self.job_subscriptions:
            for fundi_id in self.job_subscriptions[job_id]:
                if fundi_id != accepted_fundi_id and fundi_id in self.fundi_sockets:
                    await self.fundi_sockets[fundi_id].send_json({
                        "type": "job_taken",
                        "job_id": job_id
                    })
    
    async def update_fundi_location(
        self,
        fundi_id: str,
        latitude: float,
        longitude: float
    ):
        """
        Update fundi's location in real-time and notify nearby employers
        """
        
        # Update in Redis
        await redis_client.geoadd(
            "fundi:locations",
            (longitude, latitude, fundi_id)
        )
        
        # Find employers with active job searches in this area
        active_employers = await redis_client.georadius(
            "employer:search_locations",
            longitude,
            latitude,
            5.0,  # 5km radius
            unit="km"
        )
        
        # Notify employers of nearby fundi
        for employer_id in active_employers:
            if employer_id in self.employer_sockets:
                await self.employer_sockets[employer_id].send_json({
                    "type": "fundi_nearby",
                    "fundi_id": fundi_id,
                    "location": {"lat": latitude, "lon": longitude},
                    "distance_km": await self.calculate_distance(
                        (latitude, longitude),
                        await self.get_employer_location(employer_id)
                    )
                })

# WebSocket endpoint
@app.websocket("/ws/{user_type}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_type: str,
    user_id: str
):
    if user_type == "fundi":
        await manager.connect_fundi(user_id, websocket)
    elif user_type == "employer":
        await manager.connect_employer(user_id, websocket)
    else:
        await websocket.close()
        return
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data['type'] == 'location_update':
                await manager.update_fundi_location(
                    user_id,
                    data['latitude'],
                    data['longitude']
                )
            
            elif data['type'] == 'job_response':
                await manager.notify_fundi_response(
                    data['job_id'],
                    user_id,
                    data['response']
                )
            
            elif data['type'] == 'request_fundi':
                await manager.broadcast_to_nearby_fundis(
                    data['job_id'],
                    (data['latitude'], data['longitude']),
                    data['skill_required']
                )
    
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
15.7 Matching Visualization Dashboard
// components/MatchingDashboard/MatchingDashboard.tsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div<{ trend: 'up' | 'down' | 'stable' }>`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  .label {
    color: #666;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 32px;
    font-weight: bold;
    color: #333;
  }
  
  .trend {
    margin-top: 8px;
    font-size: 14px;
    color: ${props => 
      props.trend === 'up' ? '#4caf50' : 
      props.trend === 'down' ? '#f44336' : 
      '#ff9800'
    };
  }
`;

const ChartContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const HeatMap = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  height: 200px;
  margin-top: 20px;
`;

const HeatCell = styled.div<{ intensity: number }>`
  background: ${props => `rgba(66, 133, 244, ${props.intensity})`};
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.1);
    z-index: 10;
  }
`;

interface MatchingMetrics {
  avg_match_time: number;
  matches_per_hour: number;
  avg_distance_km: number;
  success_rate: number;
  demand_supply_ratio: number;
  surge_zones: any[];
  heatmap_data: number[][];
}

export const MatchingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MatchingMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch metrics from API
    const fetchMetrics = async () => {
      const response = await fetch('/api/analytics/matching-metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    const fetchTimeSeries = async () => {
      const response = await fetch('/api/analytics/matching-timeseries?hours=24');
      const data = await response.json();
      setTimeSeriesData(data);
    };
    
    fetchMetrics();
    fetchTimeSeries();
    
    // Subscribe to real-time updates
    const socket = io(process.env.REACT_APP_WEBSOCKET_URL);
    socket.on('matching-update', (data) => {
      setMetrics(prev => ({ ...prev, ...data }));
    });
    
    return () => socket.disconnect();
  }, []);
  
  if (!metrics) return <div>Loading...</div>;
  
  return (
    <DashboardContainer>
      <h1 style={{ marginBottom: 24 }}>Real-Time Matching Dashboard</h1>
      
      <MetricsGrid>
        <MetricCard trend={metrics.avg_match_time < 5 ? 'up' : 'down'}>
          <div className="label">Avg Match Time</div>
          <div className="value">{metrics.avg_match_time} min</div>
          <div className="trend">
            {metrics.avg_match_time < 5 ? '⬆️ Faster' : '⬇️ Slower'}
          </div>
        </MetricCard>
        
        <MetricCard trend={metrics.matches_per_hour > 50 ? 'up' : 'down'}>
          <div className="label">Matches/Hour</div>
          <div className="value">{metrics.matches_per_hour}</div>
          <div className="trend">
            {metrics.matches_per_hour > 50 ? '⬆️ High' : '⬇️ Low'}
          </div>
        </MetricCard>
        
        <MetricCard trend={metrics.avg_distance_km < 3 ? 'up' : 'down'}>
          <div className="label">Avg Distance</div>
          <div className="value">{metrics.avg_distance_km} km</div>
          <div className="trend">
            {metrics.avg_distance_km < 3 ? '⬆️ Close' : '⬇️ Far'}
          </div>
        </MetricCard>
        
        <MetricCard trend={metrics.success_rate > 80 ? 'up' : 'down'}>
          <div className="label">Success Rate</div>
          <div className="value">{metrics.success_rate}%</div>
          <div className="trend">
            {metrics.success_rate > 80 ? '⬆️ Good' : '⬇️ Needs improvement'}
          </div>
        </MetricCard>
      </MetricsGrid>
      
      <ChartContainer>
        <h3>Matching Activity (Last 24 Hours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="matches" 
              stroke="#4285F4" 
              fill="#4285F4" 
              fillOpacity={0.3} 
            />
            <Area 
              type="monotone" 
              dataKey="requests" 
              stroke="#EA4335" 
              fill="#EA4335" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <ChartContainer>
        <h3>Supply-Demand Ratio by Area</h3>
        <div style={{ display: 'flex', marginBottom: 16 }}>
          <div style={{ marginRight: 24 }}>
            <span style={{ color: '#4caf50' }}>●</span> High Supply
          </div>
          <div style={{ marginRight: 24 }}>
            <span style={{ color: '#ff9800' }}>●</span> Balanced
          </div>
          <div>
            <span style={{ color: '#f44336' }}>●</span> High Demand
          </div>
        </div>
        
        <HeatMap>
          {metrics.heatmap_data.flat().map((intensity, index) => (
            <HeatCell 
              key={index} 
              intensity={intensity}
              title={`Cell ${index}: ${Math.round(intensity * 100)}% demand`}
            />
          ))}
        </HeatMap>
      </ChartContainer>
      
      <ChartContainer>
        <h3>Surge Pricing Zones</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {metrics.surge_zones.map((zone, index) => (
            <div key={index} style={{
              padding: 16,
              background: zone.multiplier > 1.5 ? '#ffebee' : 
                         zone.multiplier > 1.2 ? '#fff3e0' : '#e8f5e8',
              borderRadius: 8
            }}>
              <div style={{ fontWeight: 'bold' }}>Zone {index + 1}</div>
              <div>Multiplier: {zone.multiplier}x</div>
              <div style={{ fontSize: 12, color: '#666' }}>{zone.reason}</div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </DashboardContainer>
  );
};
15.2 Dynamic Geofencing & Service Areas
# geospatial/geofencing.py
from shapely.geometry import Point, Polygon
import json
import requests

class DynamicGeofencing:
    """
    Create dynamic service areas based on fundi density and demand
    Like Uber's heat maps showing where drivers are needed
    """
    
    async def create_demand_heatmap(
        self,
        city: str,
        date: datetime
    ) -> Dict[str, Any]:
        """
        Generate heatmap of job demand and fundi availability
        """
        
        # Get job density per grid cell
        job_density = await self.get_job_density(city, date)
        
        # Get fundi availability per grid cell
        fundi_density = await self.get_fundi_density(city, date)
        
        # Calculate supply-demand ratio
        heatmap = []
        for cell in job_density:
            ratio = cell['jobs'] / max(cell['fundis'], 1)
            
            # Color code based on ratio
            if ratio > 2:  # High demand, low supply
                color = "red"
                recommendation = "Increase prices, recruit more fundis"
            elif ratio > 1:  # Balanced
                color = "yellow"
                recommendation = "Normal operations"
            else:  # Low demand, high supply
                color = "green"
                recommendation = "Decrease prices, fundis should move to other areas"
            
            heatmap.append({
                "grid_cell": cell['coordinates'],
                "job_density": cell['jobs'],
                "fundi_density": cell['fundis'],
                "supply_demand_ratio": ratio,
                "color": color,
                "recommendation": recommendation
            })
        
        return {
            "city": city,
            "date": date.isoformat(),
            "heatmap": heatmap,
            "surge_pricing_zones": self.calculate_surge_zones(heatmap)
        }
    
    async def get_job_density(self, city: str, date: datetime) -> List[Dict]:
        """
        Get job density per grid cell (1km x 1km)
        """
        query = """
            SELECT 
                ST_SnapToGrid(ST_MakePoint(longitude, latitude), 0.01) as grid_cell,
                COUNT(*) as job_count,
                AVG(budget_max) as avg_budget
            FROM job_postings
            WHERE created_at::date = $1
                AND status = 'published'
            GROUP BY grid_cell
        """
        
        results = await db.fetch_all(query, date.date())
        
        return [
            {
                "coordinates": r['grid_cell'],
                "jobs": r['job_count'],
                "avg_budget": r['avg_budget']
            }
            for r in results
        ]
    
    async def get_fundi_density(self, city: str, date: datetime) -> List[Dict]:
        """
        Get fundi density per grid cell based on real-time locations
        """
        # Get all active fundi locations from Redis
        active_fundis = await redis_client.zrange(
            f"fundi:active:{city}",
            0,
            -1,
            withscores=True
        )
        
        # Group by grid cell
        density = {}
        for fundi_id, score in active_fundis:
            location = await redis_client.hgetall(f"fundi:last_seen:{fundi_id}")
            if location:
                lat, lon = float(location['lat']), float(location['lon'])
                grid_cell = f"{round(lat, 2)},{round(lon, 2)}"
                
                if grid_cell not in density:
                    density[grid_cell] = {
                        "count": 0,
                        "coordinates": [round(lat, 2), round(lon, 2)]
                    }
                density[grid_cell]['count'] += 1
        
        return [
            {
                "coordinates": v['coordinates'],
                "fundis": v['count']
            }
            for v in density.values()
        ]
    
    def calculate_surge_zones(self, heatmap: List[Dict]) -> List[Dict]:
        """
        Calculate surge pricing zones based on demand
        """
        surge_zones = []
        
        for cell in heatmap:
            if cell['supply_demand_ratio'] > 2:
                surge_multiplier = min(1.5 + (cell['supply_demand_ratio'] * 0.1), 3.0)
                surge_zones.append({
                    "zone": cell['grid_cell'],
                    "multiplier": round(surge_multiplier, 1),
                    "reason": "High demand, low supply"
                })
            elif cell['supply_demand_ratio'] < 0.5:
                surge_multiplier = max(0.7, cell['supply_demand_ratio'])
                surge_zones.append({
                    "zone": cell['grid_cell'],
                    "multiplier": round(surge_multiplier, 1),
                    "reason": "Low demand, high supply"
                })
        
        return surge_zones