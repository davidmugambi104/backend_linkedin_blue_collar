import type { Employer } from './models/employer.types';
import type { Job } from './models/job.types';
import type { User } from './models/user.types';
import type { Worker } from './models/worker.types';
import type { Payment as ModelPayment } from './models/payment.types';
import type { Review as ModelReview } from './models/review.types';

// Re-export model types (these are the authoritative definitions)
export { UserRole } from './models/user.types'; // Export as value since it's an enum
export { JobStatus } from './models/job.types'; // Export as value since it's an enum
export { ApplicationStatus } from './models/application.types'; // Export as value since it's an enum
export type { User } from './models/user.types';
export type { Job, JobCreateRequest, JobUpdateRequest } from './models/job.types';
export type { Worker, WorkerSkill, WorkerUpdateRequest } from './models/worker.types';
export type { Employer } from './models/employer.types';
export type { Application } from './models/application.types';

// Keep these for backwards compatibility, but prefer the model types above

// Job interface is exported from models/job.types.ts below
// See JobCreateRequest and JobUpdateRequest for additional types

// Application interface is exported from models/application.types.ts below

export type Payment = ModelPayment;

export type Review = ModelReview;

export interface Verification {
  id: number;
  user_id: number;
  user?: User;
  type: 'identity' | 'skill' | 'education' | 'certification' | 'background';
  status: 'pending' | 'verified' | 'rejected';
  document_urls?: string[];
  verified_by?: number;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id?: number;
  sender?: User;
  content: string;
  is_read: boolean;
  _optimistic?: boolean;
  _status?: 'sending' | 'sent' | 'failed';
  error?: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  conversation_id: string;
  other_user: {
    id: number;
    username: string;
    email: string;
    role: string;
    profile: {
      id: number;
      full_name?: string;
      company_name?: string;
      profile_picture?: string;
      logo?: string;
      role: string;
      is_online?: boolean;
    } | null;
  };
  last_message?: Message;
  last_message_time?: string;
  unread_count: number;
}

export interface TypingIndicator {
  conversation_id: number;
  user_id: number;
  is_typing: boolean;
  updated_at: string;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface Skill {
  id: number;
  name: string;
  category?: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface Certification {
  id: number;
  name: string;
  issuing_organization: string;
  credential_id?: string;
  issue_date: string;
  expiry_date?: string;
  credential_url?: string;
}

export interface Location {
  address?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Export all from models
export * from './models/payment.types';
export * from './models/message.types';
export * from './models/job.types';
export * from './models/worker.types';
export * from './models/employer.types';
export * from './models/skill.types';
export * from './models/application.types';
export * from './models/review.types';
export * from './models/verification.types';
export * from './models/user.types';

// Admin types
export type {
  JobModerationQueue,
  DisputeCase,
  UserWithDetails,
  VerificationRequest,
  PlatformSettings,
  EmailTemplate,
} from './admin.types';

// Additional message-related types
export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}
