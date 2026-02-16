import { Worker } from './worker.types';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Verification {
  id: number;
  worker_id: number;
  verification_type: string;
  document_url: string;
  status: VerificationStatus;
  reviewed_by?: number;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  worker?: Worker;
}

export interface VerificationCreateRequest {
  worker_id: number;
  verification_type: string;
  document_url: string;
}

export interface VerificationUpdateRequest {
  status: VerificationStatus;
  review_notes?: string;
}

export interface WorkerVerificationStatus {
  worker_id: number;
  is_verified: boolean;
  verification_score: number;
  verification_counts: Record<string, number>;
  total_verifications: number;
}