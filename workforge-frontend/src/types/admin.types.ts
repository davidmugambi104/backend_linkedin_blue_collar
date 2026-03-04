import { User, Job, Payment, Review, Verification } from './index';

// Platform Statistics
export interface PlatformStats {
  // Users
  total_users: number;
  active_users: number;
  workers_count: number;
  employers_count: number;
  verified_users: number;
  new_users_today: number;
  user_growth_rate: number;

  // Jobs
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  jobs_today: number;
  average_job_value: number;

  // Payments
  total_revenue: number;
  platform_fees_total: number;
  pending_payments: number;
  completed_payments: number;
  average_transaction: number;

  // Reviews
  total_reviews: number;
  average_rating: number;
  pending_reviews: number;

  // Verifications
  pending_verifications: number;
  verified_workers: number;
  verified_employers: number;
}

// User Management
export interface UserWithDetails extends User {
  status?: string;
  worker_profile?: {
    id: number;
    full_name: string;
    is_verified: boolean;
    verification_score: number;
    average_rating: number;
    total_jobs_completed: number;
    total_earnings: number;
    profile_picture?: string;
  };
  employer_profile?: {
    id: number;
    company_name: string;
    is_verified: boolean;
    total_jobs_posted: number;
    total_spent: number;
    logo?: string;
  };
  reports_count: number;
  warnings_count: number;
  last_active: string;
}

export interface UserBanRequest {
  user_id: number;
  reason: string;
  duration: '24h' | '7d' | '30d' | 'permanent';
  notify_user: boolean;
}

export interface UserWarning {
  id: number;
  user_id: number;
  admin_id: number;
  reason: string;
  created_at: string;
  expires_at?: string;
}

// Job Moderation
export interface JobModerationQueue {
  id: number;
  job: Job;
  reported_by: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

export interface JobModerationAction {
  job_id: number;
  action: 'approve' | 'reject' | 'feature' | 'unfeature' | 'remove';
  reason?: string;
  notify_employer: boolean;
}

// Verification Queue
export interface VerificationRequest extends Verification {
  worker: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    verification_score: number;
    profile_picture?: string;
  };
  submitted_at: string;
  reviewed_by?: number;
  review_notes?: string;
}

// Dispute Management
export interface DisputeCase {
  id: number;
  payment_id: number;
  job_id: number;
  employer_id: number;
  worker_id: number;
  initiated_by: 'employer' | 'worker';
  reason: string;
  description: string;
  evidence_urls?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  assigned_admin?: number;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

// Analytics
export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface RevenueAnalytics {
  daily_revenue: TimeSeriesData[];
  monthly_revenue: TimeSeriesData[];
  revenue_by_source: Record<string, number>;
  platform_fees_collected: number;
  refunds_processed: number;
  projected_revenue: number;
}

export interface UserAnalytics {
  user_growth: TimeSeriesData[];
  user_retention: TimeSeriesData[];
  user_segmentation: {
    workers: number;
    employers: number;
    verified: number;
    active: number;
  };
  geographic_distribution: Record<string, number>;
}

export interface UserGrowthPoint {
  date: string;
  workers: number;
  employers: number;
}

export interface UserRetentionPoint {
  date: string;
  retention: number;
}

// System Health
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  response_time: number;
  active_connections: number;
  api_requests: {
    total: number;
    successful: number;
    failed: number;
    avg_response: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    query_time: number;
    connections: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    memory_usage: number;
    hit_rate: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
  };
}

// Audit Log
export interface AuditLogEntry {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  entity_type: 'user' | 'job' | 'payment' | 'review' | 'verification';
  entity_id: number;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// Support Tickets
export interface SupportTicket {
  id: number;
  user_id: number;
  user: {
    username: string;
    email: string;
    role: string;
  };
  subject: string;
  category: 'payment' | 'verification' | 'job' | 'account' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  messages: SupportMessage[];
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  attachments?: string[];
  is_admin: boolean;
  created_at: string;
}

// Platform Settings
export interface PlatformSettings {
  // Fee Settings
  platform_fee_percentage: number;
  minimum_platform_fee: number;
  maximum_platform_fee: number;
  
  // Job Settings
  job_approval_required: boolean;
  job_expiry_days: number;
  featured_job_price: number;
  
  // Verification Settings
  verification_required: boolean;
  max_verification_attempts: number;
  verification_score_threshold: number;
  
  // Payment Settings
  minimum_payout_amount: number;
  payout_schedule: 'daily' | 'weekly' | 'monthly';
  escrow_release_days: number;
  
  // Security Settings
  max_login_attempts: number;
  session_timeout_minutes: number;
  two_factor_required: boolean;
  
  // Email Settings
  sender_email: string;
  sender_name: string;
  email_signature: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  last_updated: string;
}