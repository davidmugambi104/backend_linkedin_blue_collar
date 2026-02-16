import { Skill } from './skill.types';
import { User } from './user.types';

export interface Worker {
  id: number;
  user_id: number;
  full_name: string;
  title?: string;
  bio?: string;
  user?: User;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  location?: {
    city?: string;
    country?: string;
  };
  phone?: string;
  profile_picture?: string;
  hourly_rate?: number;
  years_experience?: number;
  availability?: string;
  is_verified: boolean;
  verification_score: number;
  average_rating: number;
  total_ratings: number;
  rating?: number;
  completed_jobs?: number;
  created_at: string;
  updated_at: string;
  skills?: WorkerSkill[];
  distance_km?: number;
}

export interface WorkerSkill {
  id: number;
  worker_id: number;
  skill_id: number;
  proficiency_level: number;
  skill?: Skill;
}

export interface WorkerUpdateRequest {
  full_name?: string;
  bio?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  phone?: string;
  profile_picture?: string;
  hourly_rate?: number;
}

export interface WorkerSkillRequest {
  skill_id: number;
  proficiency_level?: number;
}

export interface WorkerStats {
  total_applications: number;
  application_status_counts: Record<string, number>;
  average_rating: number;
  completed_jobs: number;
  total_earnings?: number;
  verification_status: boolean;
  verification_score: number;
}