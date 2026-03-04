import { apiClient } from '@lib/api-client';
import type {
  PlatformStats,
  UserWithDetails,
  UserBanRequest,
  UserWarning,
  JobModerationQueue,
  JobModerationAction,
  VerificationRequest,
  DisputeCase,
  PlatformSettings,
  EmailTemplate,
  AuditLogEntry,
  SupportTicket,
  SupportMessage,
  SystemHealth,
} from '../types/admin.types';

class AdminService {
  // Dashboard & Analytics
  async getPlatformStats(): Promise<PlatformStats> {
    type JobItem = {
      id: number;
      employer_id?: number;
      created_at?: string;
      pay_min?: number | null;
      pay_max?: number | null;
    };
    type WorkerItem = {
      created_at?: string;
      is_verified?: boolean;
    };
    type ReviewItem = {
      rating?: number;
    };
    type PaymentStats = {
      total_payments?: number;
      total_amount_paid?: number;
      total_platform_fees?: number;
      payments_by_status?: Record<string, number>;
      recent_payments_last_30_days?: number;
    };
    type ApplicationStats = {
      total?: number;
      status_counts?: Record<string, number>;
    };

    const fetchJobsByStatus = async (status: string): Promise<JobItem[]> => {
      try {
        return await apiClient.get<JobItem[]>('/jobs', { params: { status }, silentError: true } as any);
      } catch (error) {
        console.warn(`Failed to fetch jobs with status ${status}:`, error);
        return [];
      }
    };

    const todayKey = new Date().toISOString().slice(0, 10);

    // Fetch data with error handling for each call
    const [
      paymentStats,
      applicationStats,
      openJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      expiredJobs,
      workers,
      reviews,
      pendingVerifications,
    ] = await Promise.all([
      apiClient.get<PaymentStats>('/payments/stats', { silentError: true } as any).catch(() => ({} as PaymentStats)),
      apiClient.get<ApplicationStats>('/applications/stats', { silentError: true } as any).catch(() => ({} as ApplicationStats)),
      fetchJobsByStatus('open'),
      fetchJobsByStatus('in_progress'),
      fetchJobsByStatus('completed'),
      fetchJobsByStatus('cancelled'),
      fetchJobsByStatus('expired'),
      apiClient.get<WorkerItem[]>('/workers', { silentError: true } as any).catch(() => []),
      apiClient.get<ReviewItem[]>('/reviews', { silentError: true } as any).catch(() => []),
      apiClient.get('/verification', { params: { status: 'pending' }, silentError: true } as any).catch(() => []),
    ]);

    const allJobs: JobItem[] = [
      ...openJobs,
      ...inProgressJobs,
      ...completedJobs,
      ...cancelledJobs,
      ...expiredJobs,
    ];

    const employerIds = new Set<number>();
    allJobs.forEach((job) => {
      if (typeof job.employer_id === 'number') {
        employerIds.add(job.employer_id);
      }
    });

    const jobValues = allJobs
      .map((job) => (job.pay_max ?? job.pay_min ?? 0))
      .filter((value) => value > 0);
    const averageJobValue = jobValues.length
      ? jobValues.reduce((sum, value) => sum + value, 0) / jobValues.length
      : 0;

    const jobsToday = allJobs.filter((job) => {
      const createdKey = job.created_at?.slice(0, 10);
      return createdKey === todayKey;
    }).length;

    const totalWorkers = workers.length;
    const verifiedWorkers = workers.filter((worker) => worker.is_verified).length;

    const newWorkersToday = workers.filter((worker) => {
      const createdKey = worker.created_at?.slice(0, 10);
      return createdKey === todayKey;
    }).length;

    const newWorkersLast7Days = workers.filter((worker) => {
      if (!worker.created_at) {
        return false;
      }
      const created = new Date(worker.created_at);
      const daysAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length;

    const totalUsers = totalWorkers + employerIds.size;
    const userGrowthRate = totalUsers
      ? Math.round((newWorkersLast7Days / totalUsers) * 100)
      : 0;

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.map((r: ReviewItem) => r.rating || 0).reduce((a: number, b: number) => a + b, 0) / totalReviews
      : 0;

    const paymentsByStatus = paymentStats.payments_by_status || {};
    const completedPayments = paymentsByStatus.paid || 0;
    const totalRevenue = paymentStats.total_amount_paid || 0;
    const averageTransaction = completedPayments
      ? totalRevenue / completedPayments
      : 0;

    return {
      total_users: totalUsers,
      active_users: totalUsers,
      workers_count: totalWorkers,
      employers_count: employerIds.size,
      verified_users: verifiedWorkers,
      new_users_today: newWorkersToday,
      user_growth_rate: userGrowthRate,
      total_jobs: allJobs.length,
      active_jobs: openJobs.length + inProgressJobs.length,
      completed_jobs: completedJobs.length,
      jobs_today: jobsToday,
      average_job_value: averageJobValue,
      total_revenue: totalRevenue,
      platform_fees_total: paymentStats.total_platform_fees || 0,
      pending_payments: paymentsByStatus.pending || 0,
      completed_payments: completedPayments,
      average_transaction: averageTransaction,
      total_reviews: totalReviews,
      average_rating: averageRating,
      pending_reviews: 0,
      pending_verifications: Array.isArray(pendingVerifications)
        ? pendingVerifications.length
        : 0,
      verified_workers: verifiedWorkers,
      verified_employers: 0,
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const startedAt = Date.now();
    let status: SystemHealth['status'] = 'healthy';
    try {
      await apiClient.get('/jobs', { params: { status: 'open' } });
    } catch (error) {
      status = 'degraded';
    }
    const responseTime = Date.now() - startedAt;

    return {
      status,
      uptime: 0,
      response_time: responseTime,
      active_connections: 0,
      api_requests: {
        total: 1,
        successful: status === 'healthy' ? 1 : 0,
        failed: status === 'healthy' ? 0 : 1,
        avg_response: responseTime,
      },
      database: {
        status: status === 'healthy' ? 'connected' : 'disconnected',
        query_time: responseTime,
        connections: 0,
      },
      redis: {
        status: 'disconnected',
        memory_usage: 0,
        hit_rate: 0,
      },
      storage: {
        total: 0,
        used: 0,
        free: 0,
      },
    };
  }

  // User Management
  async getUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{ users: UserWithDetails[]; total: number; pages: number }> {
    return apiClient.get('/admin/users', { params });
  }

  async getUserDetails(userId: number): Promise<UserWithDetails> {
    return apiClient.get<UserWithDetails>(`/admin/users/${userId}`);
  }

  async banUser(userId: number, data: UserBanRequest): Promise<void> {
    return apiClient.post(`/admin/users/${userId}/ban`, data);
  }

  async unbanUser(userId: number): Promise<void> {
    return apiClient.post(`/admin/users/${userId}/unban`);
  }

  async warnUser(userId: number, reason: string): Promise<UserWarning> {
    return apiClient.post<UserWarning>(`/admin/users/${userId}/warn`, { reason });
  }

  async deleteUser(userId: number): Promise<void> {
    return apiClient.delete(`/admin/users/${userId}`);
  }

  // Job Moderation
  async getModerationQueue(params?: {
    status?: string;
    priority?: string;
    page?: number;
  }): Promise<{ items: JobModerationQueue[]; total: number }> {
    return apiClient.get('/admin/moderation/jobs', { params });
  }

  async moderateJob(jobId: number, action: JobModerationAction): Promise<void> {
    return apiClient.post(`/admin/jobs/${jobId}/moderate`, action);
  }

  async featureJob(jobId: number): Promise<void> {
    return apiClient.post(`/admin/jobs/${jobId}/feature`);
  }

  async unfeatureJob(jobId: number): Promise<void> {
    return apiClient.post(`/admin/jobs/${jobId}/unfeature`);
  }

  // Verification Queue
  async getVerificationQueue(params?: {
    status?: string;
    type?: string;
    page?: number;
  }): Promise<{ requests: VerificationRequest[]; total: number }> {
    return apiClient.get('/admin/verifications', { params });
  }

  async reviewVerification(
    verificationId: number,
    data: { status: 'approved' | 'rejected'; notes?: string }
  ): Promise<void> {
    return apiClient.put(`/admin/verifications/${verificationId}`, data);
  }

  async getDocument(url: string): Promise<Blob> {
    return apiClient.get(url, { responseType: 'blob' });
  }

  // Dispute Management
  async getDisputes(params?: {
    status?: string;
    priority?: string;
    page?: number;
  }): Promise<{ disputes: DisputeCase[]; total: number }> {
    return apiClient.get('/admin/disputes', { params });
  }

  async getDisputeDetails(disputeId: number): Promise<DisputeCase> {
    return apiClient.get<DisputeCase>(`/admin/disputes/${disputeId}`);
  }

  async resolveDispute(
    disputeId: number,
    data: { resolution: string; refund_amount?: number }
  ): Promise<void> {
    return apiClient.post(`/admin/disputes/${disputeId}/resolve`, data);
  }

  // Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings> {
    return apiClient.get<PlatformSettings>('/admin/settings');
  }

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    return apiClient.put<PlatformSettings>('/admin/settings', settings);
  }

  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return apiClient.get<EmailTemplate[]>('/admin/settings/email-templates');
  }

  async updateEmailTemplate(templateId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return apiClient.put<EmailTemplate>(`/admin/settings/email-templates/${templateId}`, data);
  }

  // Audit Log
  async getAuditLog(params?: {
    admin_id?: number;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
  }): Promise<{ entries: AuditLogEntry[]; total: number }> {
    return { entries: [], total: 0 };
  }

  // Support Tickets
  async getSupportTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    page?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number }> {
    return apiClient.get('/admin/support/tickets', { params });
  }

  async getTicketDetails(ticketId: number): Promise<SupportTicket> {
    return apiClient.get<SupportTicket>(`/admin/support/tickets/${ticketId}`);
  }

  async respondToTicket(ticketId: number, message: string): Promise<SupportMessage> {
    return apiClient.post<SupportMessage>(`/admin/support/tickets/${ticketId}/respond`, { message });
  }

  async updateTicketStatus(ticketId: number, status: string): Promise<void> {
    return apiClient.put(`/admin/support/tickets/${ticketId}/status`, { status });
  }

  async assignTicket(ticketId: number, adminId: number): Promise<void> {
    return apiClient.post(`/admin/support/tickets/${ticketId}/assign`, { admin_id: adminId });
  }

  // Reports & Exports
  async generateReport(type: string, params: any): Promise<Blob> {
    return apiClient.get(`/admin/reports/${type}`, {
      params,
      responseType: 'blob',
    });
  }

  async exportData(params: {
    entity: 'users' | 'jobs' | 'payments' | 'reviews';
    format: 'csv' | 'excel' | 'pdf';
    filters?: any;
  }): Promise<Blob> {
    return apiClient.get('/admin/export', {
      params,
      responseType: 'blob',
    });
  }

  // Bulk Operations
  async bulkDeleteUsers(userIds: number[]): Promise<void> {
    return apiClient.post('/admin/users/bulk-delete', { user_ids: userIds });
  }

  async bulkVerifyUsers(userIds: number[]): Promise<void> {
    return apiClient.post('/admin/users/bulk-verify', { user_ids: userIds });
  }

  async bulkFeatureJobs(jobIds: number[]): Promise<void> {
    return apiClient.post('/admin/jobs/bulk-feature', { job_ids: jobIds });
  }
}

export const adminService = new AdminService();