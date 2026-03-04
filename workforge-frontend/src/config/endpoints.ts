export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
    PASSWORD_RESET_VERIFY: '/auth/password-reset/verify',
    PASSWORD_CHANGE: '/auth/password/change',
  },
  
  // User endpoints
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
    CHANGE_PASSWORD: '/users/change-password',
    ADMIN_USERS_ACTIVATE: (userId: number) => `/admin/users/${userId}/activate`,
  },
  
  // Worker endpoints
  WORKERS: {
    LIST: '/workers',
    SEARCH: '/workers/search',
    DETAIL: (workerId: number) => `/workers/${workerId}`,
    PROFILE: '/workers/profile',
    SKILLS: '/workers/skills',
    SKILL: (skillId: number) => `/workers/skills/${skillId}`,
    APPLICATIONS: '/workers/applications',
    RECOMMENDATIONS: '/workers/jobs/recommended',
    REVIEWS: '/workers/reviews',
    STATS: '/workers/stats',
    VERIFICATION: '/workers/verification',
  },
  
  // Employer endpoints
  EMPLOYERS: {
    PROFILE: '/employers/profile',
    JOBS: '/employers/jobs',
    JOB: (jobId: number) => `/employers/jobs/${jobId}`,
    APPLICATIONS: '/employers/applications',
    JOB_APPLICATIONS: (jobId: number) => `/employers/jobs/${jobId}/applications`,
    APPLICATION_STATUS: (applicationId: number) => `/employers/applications/${applicationId}`,
    WORKERS_SEARCH: '/employers/workers/search',
    STATS: '/employers/stats',
    REVIEWS: '/employers/reviews',
  },
  
  // Job endpoints
  JOBS: {
    LIST: '/jobs',
    DETAIL: (jobId: number) => `/jobs/${jobId}`,
    CREATE: '/jobs',
    UPDATE: (jobId: number) => `/jobs/${jobId}`,
    DELETE: (jobId: number) => `/jobs/${jobId}`,
    APPLY: (jobId: number) => `/jobs/${jobId}/apply`,
    APPLICATIONS: '/jobs/applications',
    SEARCH: '/jobs/search',
    MATCH_WORKERS: (jobId: number) => `/jobs/match/workers/${jobId}`,
    SHORTLIST: (jobId: number, workerId: number) => `/jobs/${jobId}/shortlist/${workerId}`,
  },
  
  // Matching endpoints
  MATCHING: {
    WORKER_TO_JOB: (jobId: number) => `/workers/match/jobs/${jobId}`,
  },
  
  // Application endpoints
  APPLICATIONS: {
    LIST: '/applications',
    DETAIL: (applicationId: number) => `/applications/${applicationId}`,
    UPDATE: (applicationId: number) => `/applications/${applicationId}`,
  },
  
  // Payment endpoints
  PAYMENTS: {
    LIST: '/payments',
    DETAIL: (paymentId: number) => `/payments/${paymentId}`,
    CREATE: '/payments',
    VERIFY: '/payments/verify',
    REFUND: (paymentId: number) => `/payments/${paymentId}/refund`,
  },
  
  // Review endpoints
  REVIEWS: {
    LIST: '/reviews',
    ALL: '/reviews/all',
    GET: (reviewId: number) => `/reviews/${reviewId}`,
    CREATE: '/reviews',
    UPDATE: (reviewId: number) => `/reviews/${reviewId}`,
    DELETE: (reviewId: number) => `/reviews/${reviewId}`,
    WORKER_AVERAGE: '/reviews/worker-average',
  },
  
  // Message endpoints
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    CONVERSATION: (userId: number) => `/messages/conversations/${userId}`,
    LIST: '/messages',
    SEND: '/messages',
    MARK_READ: (userId: number) => `/messages/mark-read/${userId}`,
    UNREAD_COUNT: '/messages/unread-count',
    TYPING: '/messages/typing',
  },
  
  // Admin endpoints
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    JOBS: '/admin/jobs',
    VERIFICATIONS: '/admin/verifications',
    PAYMENTS: '/admin/payments',
    REPORTS: '/admin/reports',
  },
  
  // Verification endpoints
  VERIFICATION: {
    SEND_CODE: '/verification/send-code',
    VERIFY_CODE: '/verification/verify-code',
    VERIFY_PHONE: '/verification/verify-phone',
    RESEND_CODE: '/verification/resend-code',
    UPLOAD_DOCUMENT: '/verification/document/upload',
    MY_DOCUMENTS: '/verification/documents',
    STATUS: '/verification/status',
    ADMIN_QUEUE: '/verification/admin/queue',
    ADMIN_REVIEW: (docId: number) => `/verification/admin/review/${docId}`,
  },
  
  // Escrow endpoints
  ESCROW: {
    HOLD: '/escrow/hold',
    RELEASE: '/escrow/release',
    REFUND: '/escrow/refund',
    JOB: (jobId: number) => `/escrow/job/${jobId}`,
  },
};
