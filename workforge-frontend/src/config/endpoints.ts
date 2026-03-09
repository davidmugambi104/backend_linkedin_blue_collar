export const ENDPOINTS = {
  // ============ AUTH ============
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    LOGOUT_REFRESH: '/auth/logout/refresh',
    REFRESH: '/auth/refresh',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
    PASSWORD_RESET_VERIFY: '/auth/password-reset/verify',
    PASSWORD_CHANGE: '/auth/password/change',
    ADMIN_ACTIVATE: (userId: number) => `/auth/admin/users/${userId}/activate`,
  },

  // ============ USERS ============
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/profile',
    UPDATE: '/users/me',
    UPDATE_BY_ID: (userId: number) => `/users/${userId}`,
    DELETE: (userId: number) => `/users/${userId}`,
    CHANGE_PASSWORD: '/users/change-password',
    ADMIN_USERS_ACTIVATE: (userId: number) => `/admin/users/${userId}/activate`,
  },

  // ============ WORKERS ============
  WORKERS: {
    LIST: '/workers',
    SEARCH: '/workers/search',
    DETAIL: (workerId: number) => `/workers/${workerId}`,
    PROFILE: '/workers/profile',
    SKILLS: '/workers/skills',
    SKILL: (skillId: number) => `/workers/skills/${skillId}`,
    APPLICATIONS: '/workers/applications',
    RECOMMENDATIONS: '/workers/jobs/recommended',
    MATCH_JOB: (jobId: number) => `/workers/match/jobs/${jobId}`,
    REVIEWS: '/workers/reviews',
    STATS: '/workers/stats',
    VERIFICATION: '/workers/verification',
  },

  // ============ EMPLOYERS ============
  EMPLOYERS: {
    PROFILE: '/employers/profile',
    UPDATE: '/employers/profile',
    JOBS: '/employers/jobs',
    JOB: (jobId: number) => `/employers/jobs/${jobId}`,
    CREATE_JOB: '/employers/jobs',
    UPDATE_JOB: (jobId: number) => `/employers/jobs/${jobId}`,
    DELETE_JOB: (jobId: number) => `/employers/jobs/${jobId}`,
    APPLICATIONS: '/employers/applications',
    JOB_APPLICATIONS: (jobId: number) => `/employers/jobs/${jobId}/applications`,
    APPLICATION_STATUS: (applicationId: number) => `/employers/applications/${applicationId}`,
    WORKERS_SEARCH: '/employers/workers/search',
    STATS: '/employers/stats',
    REVIEWS: '/employers/reviews',
  },

  // ============ JOBS ============
  JOBS: {
    LIST: '/jobs',
    DETAIL: (jobId: number) => `/jobs/${jobId}`,
    CREATE: '/jobs',
    UPDATE: (jobId: number) => `/jobs/${jobId}`,
    DELETE: (jobId: number) => `/jobs/${jobId}`,
    APPLY: (jobId: number) => `/jobs/${jobId}/apply`,
    APPLICATIONS: '/jobs/applications',
    MY_APPLICATIONS: '/jobs/my-applications',
    SEARCH: '/jobs/search',
    EXPIRED: '/jobs/expired',
    CLOSE_EXPIRED: '/jobs/expired/close',
    MATCH_WORKERS: (jobId: number) => `/jobs/match/workers/${jobId}`,
    SHORTLIST: (jobId: number, workerId: number) => `/jobs/${jobId}/shortlist/${workerId}`,
    COMPLETE: (jobId: number) => `/jobs/${jobId}/complete`,
    CANCEL: (jobId: number) => `/jobs/${jobId}/cancel`,
    CONTEXT: (userId: number) => `/jobs/context/${userId}`,
  },

  // ============ APPLICATIONS ============
  APPLICATIONS: {
    LIST: '/applications',
    STATS: '/applications/stats',
    DETAIL: (applicationId: number) => `/applications/${applicationId}`,
    UPDATE: (applicationId: number) => `/applications/${applicationId}`,
    DELETE: (applicationId: number) => `/applications/${applicationId}`,
    WITHDRAW: (applicationId: number) => `/applications/${applicationId}/withdraw`,
  },

  // ============ PAYMENTS ============
  PAYMENTS: {
    LIST: '/payments',
    MY: '/payments/my',
    DETAIL: (paymentId: number) => `/payments/${paymentId}`,
    CREATE: '/payments',
    DEPOSIT: '/payments/deposit',
    WITHDRAW: '/payments/withdraw',
    CONFIG: '/payments/config',
    STATUS: (checkoutRequestId: string) => `/payments/status/${checkoutRequestId}`,
    CALLBACK: '/payments/callback',
    REFUND: (paymentId: number) => `/payments/${paymentId}/refund`,
  },

  // ============ ESCROW ============
  ESCROW: {
    HOLD: '/escrow/hold',
    RELEASE: '/escrow/release',
    REFUND: '/escrow/refund',
    JOB: (jobId: number) => `/escrow/job/${jobId}`,
    DETAIL: (escrowId: number) => `/escrow/${escrowId}`,
  },

  // ============ REVIEWS ============
  REVIEWS: {
    LIST: '/reviews',
    ALL: '/reviews',
    GET: (reviewId: number) => `/reviews/${reviewId}`,
    CREATE: '/reviews',
    UPDATE: (reviewId: number) => `/reviews/${reviewId}`,
    DELETE: (reviewId: number) => `/reviews/${reviewId}`,
    WORKER_AVERAGE: (workerId: number) => `/reviews/worker/${workerId}/average`,
  },

  // ============ MESSAGES ============
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    CONVERSATION: (userId: number) => `/messages/conversations/${userId}`,
    MARK_READ: (userId: number) => `/messages/conversations/${userId}/mark-read`,
    USERS: '/messages/users',
    LIST: '/messages',
    SEND: '/messages/send',
    UNREAD_COUNT: '/messages/unread/count',
    TYPING: '/messages/typing',
  },

  // ============ LOCATION ============
  LOCATION: {
    UPDATE: '/location/update-location',
    MY_LOCATION: '/location/my-location',
    NEARBY_JOBS: '/location/nearby-jobs',
    NEARBY_WORKERS: '/location/nearby-workers',
    JOB_MATCHES: (jobId: number) => `/location/job/${jobId}/matches`,
    BROADCAST_JOB: (jobId: number) => `/location/broadcast-job/${jobId}`,
  },

  // ============ ML / AI ============
  ML: {
    RECOMMENDATIONS: {
      SKILLS: (workerId: number) => `/ml/recommendations/skills/${workerId}`,
      TRENDS: '/ml/recommendations/trends',
    },
    PRICE: {
      MARKET: (skillId: number) => `/ml/price/market/${skillId}`,
      WORKER: (workerId: number) => `/ml/price/worker/${workerId}`,
      JOB: (jobId: number) => `/ml/price/job/${jobId}`,
    },
    FRAUD: {
      TRANSACTION: (paymentId: number) => `/ml/fraud/transaction/${paymentId}`,
      USER: (userId: number) => `/ml/fraud/user/${userId}`,
    },
  },

  // ============ ANALYTICS ============
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    DASHBOARD: '/analytics/dashboard',
    REVENUE: '/analytics/revenue',
    JOBS: '/analytics/jobs',
    USERS: '/analytics/users',
    WORKERS: '/analytics/workers',
    WORKER: (workerId: number) => `/analytics/worker/${workerId}`,
    WORKER_RANKING: (workerId: number) => `/analytics/worker/${workerId}/ranking`,
    EMPLOYER: (employerId: number) => `/analytics/employer/${employerId}`,
    JOB_ANALYTICS: (jobId: number) => `/analytics/job/${jobId}`,
    SKILLS: '/analytics/skills',
    GROWTH: '/analytics/growth',
    LOCATION: '/analytics/location',
  },

  // ============ BULK OPERATIONS ============
  BULK: {
    USERS: '/bulk/users',
    JOBS: '/bulk/jobs',
    MESSAGES: '/bulk/messages',
    VERIFY: '/bulk/verify',
    EXPORT: '/bulk/export',
    HIRE: (jobId: number) => `/bulk/hire/${jobId}`,
  },

  // ============ DISPUTES ============
  DISPUTES: {
    LIST: '/disputes',
    CREATE: '/disputes',
    DETAIL: (disputeId: number) => `/disputes/${disputeId}`,
    UPDATE: (disputeId: number) => `/disputes/${disputeId}`,
    RESPOND: (disputeId: number) => `/disputes/${disputeId}/respond`,
    MESSAGE: (disputeId: number) => `/disputes/${disputeId}/message`,
    RESOLVE: (disputeId: number) => `/disputes/${disputeId}/resolve`,
  },

  // ============ ADMIN ============
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    USER: (userId: number) => `/admin/users/${userId}`,
    JOBS: '/admin/jobs',
    VERIFICATIONS: '/admin/verifications',
    PAYMENTS: '/admin/payments',
    REPORTS: '/admin/reports',
    DASHBOARD: '/admin/dashboard',
  },

  // ============ VERIFICATION ============
  VERIFICATION: {
    SEND_CODE: '/verification/send-code',
    VERIFY_CODE: '/verification/verify-code',
    VERIFY_PHONE: '/verification/verify-phone',
    RESEND_CODE: '/verification/resend-code',
    STATUS: '/verification/status',
    DOCUMENT_UPLOAD: '/verification/document/upload',
    DOCUMENTS: '/verification/documents',
    DOCUMENTS_UPLOAD: '/verification/documents/upload',
    DOCUMENT: (verificationId: number) => `/verification/documents/${verificationId}`,
    MY_DOCUMENTS: '/verification/documents/my',
    ADMIN_QUEUE: '/verification/admin/queue',
    ADMIN_REVIEW: (docId: number) => `/verification/admin/review/${docId}`,
  },

  // ============ SKILLS ============
  SKILLS: {
    LIST: '/skills',
    DETAIL: (skillId: number) => `/skills/${skillId}`,
    CREATE: '/skills',
    UPDATE: (skillId: number) => `/skills/${skillId}`,
    DELETE: (skillId: number) => `/skills/${skillId}`,
    CATEGORIES: '/skills/categories',
  },
};
