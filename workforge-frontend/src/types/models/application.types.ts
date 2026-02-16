import { Job } from './job.types';
import { Worker } from './worker.types';

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface Application {
  id: number;
  job_id: number;
  worker_id: number;
  status: ApplicationStatus;
  cover_letter?: string;
  message?: string;
  proposed_rate?: number;
  created_at: string;
  updated_at: string;
  job?: Job;
  worker?: Worker;
}

export interface ApplicationCreateRequest {
  job_id: number;
  cover_letter?: string;
  proposed_rate?: number;
}

export interface ApplicationUpdateRequest {
  status?: ApplicationStatus;
  cover_letter?: string;
  proposed_rate?: number;
}

export interface ApplicationStats {
  total: number;
  status_counts: Record<string, number>;
}