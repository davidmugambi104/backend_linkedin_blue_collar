export interface Employer {
  id: number;
  user_id: number;
  company_name: string;
  description?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  phone?: string;
  website?: string;
  logo?: string;
  total_jobs?: number;
  active_jobs?: number;
  verification_score?: number;
  created_at: string;
  updated_at: string;
}

export interface EmployerUpdateRequest {
  company_name?: string;
  description?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  phone?: string;
  website?: string;
  logo?: string;
}

export interface EmployerStats {
  total_jobs: number;
  job_status_counts: Record<string, number>;
  total_applications: number;
  application_status_counts: Record<string, number>;
  reviews_given: number;
  total_spent?: number;
}