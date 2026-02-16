import { Employer } from './employer.types';
import { Skill } from './skill.types';
import { Worker } from './worker.types';

export enum JobStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum PayType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  FIXED = 'fixed',
}

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  description: string;
  required_skill_id: number;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  pay_min?: number;
  pay_max?: number;
  pay_type?: PayType;
  status: JobStatus;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
  employer?: Employer;
  worker?: Worker;
  required_skill?: Skill;
  application_count?: number;
  distance_km?: number;
  // Additional optional properties for UI
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  applicants?: Array<any>;
  requirements?: string;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  required_skill_id: number;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  pay_min?: number;
  pay_max?: number;
  pay_type?: PayType;
  expiration_date?: string;
}

export interface JobUpdateRequest {
  title?: string;
  description?: string;
  required_skill_id?: number;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  pay_min?: number;
  pay_max?: number;
  pay_type?: PayType;
  status?: JobStatus;
  expiration_date?: string;
}

export interface JobSearchParams {
  title?: string;
  skill_id?: number;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  pay_min?: number;
  pay_max?: number;
  pay_type?: PayType;
  status?: JobStatus;
  employer_id?: number;
}