/**
 * Application-wide constants and configuration
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

// App Metadata
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'WorkForge';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

// Feature Flags
export const FEATURES = {
  CHAT: import.meta.env.VITE_ENABLE_CHAT === 'true',
  PAYMENTS: import.meta.env.VITE_ENABLE_PAYMENTS === 'true',
  REVIEWS: import.meta.env.VITE_ENABLE_REVIEWS === 'true',
  NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Job Categories
export const JOB_CATEGORIES = [
  'Construction',
  'Manufacturing',
  'Transportation',
  'Warehousing',
  'Maintenance',
  'Food Service',
  'Cleaning',
  'Landscaping',
  'Security',
  'Retail',
  'Other',
] as const;

// Job Types
export const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Seasonal',
] as const;

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

// Job Status
export const JOB_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Geolocation
export const DEFAULT_LOCATION_RADIUS = 50; // miles
export const LOCATION_RADIUS_OPTIONS = [10, 25, 50, 100, 200];

// Rating
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// Skills
export const MAX_SKILLS_PER_WORKER = 15;
export const MIN_SKILL_LEVEL = 1;
export const MAX_SKILL_LEVEL = 5;

// Messages
export const MAX_MESSAGE_LENGTH = 2000;
export const MESSAGE_PAGE_SIZE = 50;

// Toast Duration
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
  WARNING: 4000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'workforge_auth_token',
  REFRESH_TOKEN: 'workforge_refresh_token',
  USER_DATA: 'workforge_user_data',
  THEME: 'workforge_theme',
  SIDEBAR_STATE: 'workforge_sidebar_state',
} as const;

// API Retry Configuration
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // ms

// WebSocket Configuration
export const WS_RECONNECT_ATTEMPTS = 5;
export const WS_RECONNECT_DELAY = 3000; // ms

// Currency
export const CURRENCY_SYMBOL = '$';
export const CURRENCY_CODE = 'USD';

// Phone Regex
export const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// Email Regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password Requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export default {
  API_BASE_URL,
  WS_BASE_URL,
  APP_NAME,
  APP_VERSION,
  FEATURES,
  DEFAULT_PAGE_SIZE,
  JOB_CATEGORIES,
  JOB_TYPES,
  APPLICATION_STATUS,
  JOB_STATUS,
  PAYMENT_STATUS,
};
