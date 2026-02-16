import { Job } from './job.types';
import { Worker } from './worker.types';
import { Employer } from './employer.types';

export interface Review {
  id: number;
  job_id: number;
  worker_id: number;
  employer_id: number;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  would_recommend: boolean;
  is_anonymous: boolean;
  is_public: boolean;
  helpful_count: number;
  reported_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  job?: Job;
  worker?: Worker;
  employer?: Employer;
  responses?: ReviewResponse[];
  flags?: ReviewFlag[];
}

export interface ReviewResponse {
  id: number;
  review_id: number;
  user_id: number;
  content: string;
  is_employer_response: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export interface ReviewFlag {
  id: number;
  review_id: number;
  user_id: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface ReviewCreateRequest {
  job_id: number;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  would_recommend?: boolean;
  is_anonymous?: boolean;
}

export interface ReviewUpdateRequest {
  rating?: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  would_recommend?: boolean;
  is_anonymous?: boolean;
  is_public?: boolean;
}

export interface ReviewStats {
  worker_id: number;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recommendation_rate: number;
  response_rate: number;
  average_response_time?: number;
}

export interface ReviewSummary {
  rating: number;
  count: number;
  percentage: number;
}

export interface WorkerAverageRating {
  worker_id: number;
  average_rating: number;
  total_ratings: number;
  recent_ratings: number;
  trend: 'up' | 'down' | 'stable';
}