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

// Admin Operations Service - Release 2
class AdminOpsService {
  // === USER MANAGEMENT ===
  
  async suspendUser(userId: number, reason: string): Promise<any> {
    return apiClient.post(`/admin/users/${userId}/suspend`, { reason });
  }
  
  async reactivateUser(userId: number): Promise<any> {
    return apiClient.post(`/admin/users/${userId}/reactivate`);
  }
  
  async resetVerification(userId: number): Promise<any> {
    return apiClient.post(`/admin/users/${userId}/reset-verification`);
  }

  // === JOB MODERATION ===
  
  async flagJob(jobId: number, reason: string): Promise<any> {
    return apiClient.post(`/admin/jobs/${jobId}/flag`, { reason });
  }
  
  async unpublishJob(jobId: number, reason: string): Promise<any> {
    return apiClient.post(`/admin/jobs/${jobId}/unpublish`, { reason });
  }
  
  async restoreJob(jobId: number): Promise<any> {
    return apiClient.post(`/admin/jobs/${jobId}/restore`);
  }

  // === VERIFICATION QUEUE ===
  
  async getVerificationQueue(params?: {
    page?: number;
    per_page?: number;
    type?: string;
  }): Promise<any> {
    return apiClient.get('/admin/verifications/queue', { params });
  }
  
  async approveVerification(verificationId: number, notes?: string): Promise<any> {
    return apiClient.post(`/admin/verifications/${verificationId}/approve`, { notes });
  }
  
  async rejectVerification(verificationId: number, reason: string): Promise<any> {
    return apiClient.post(`/admin/verifications/${verificationId}/reject`, { reason });
  }
  
  async bulkVerification(ids: number[], action: 'approve' | 'reject', reason?: string): Promise<any> {
    return apiClient.post('/admin/verifications/bulk', { ids, action, reason });
  }

  // === DISPUTE MANAGEMENT ===
  
  async getDisputeQueue(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    priority?: string;
  }): Promise<any> {
    return apiClient.get('/admin/disputes/queue', { params });
  }
  
  async assignDispute(disputeId: number, assignedTo: number): Promise<any> {
    return apiClient.post(`/admin/disputes/${disputeId}/assign`, { assigned_to: assignedTo });
  }
  
  async resolveDispute(disputeId: number, resolution: any, notes?: string): Promise<any> {
    return apiClient.post(`/admin/disputes/${disputeId}/resolve`, { resolution, notes });
  }
}

export const adminOpsService = new AdminOpsService();
export default adminOpsService;

class AdminService {
  // Dashboard & Analytics
  async getPlatformStats(): Promise<PlatformStats> {
    return apiClient.get<PlatformStats>('/admin/stats');
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
    limit?: number;
    sort_by?: 'created_at' | 'action' | 'entity_type' | 'admin_id';
    sort_order?: 'asc' | 'desc';
  }): Promise<{ entries: AuditLogEntry[]; total: number; pages?: number; current_page?: number }> {
    return apiClient.get('/admin/audit-log', { params });
  }

  async exportAuditLogCsv(params?: {
    admin_id?: number;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: 'created_at' | 'action' | 'entity_type' | 'admin_id';
    sort_order?: 'asc' | 'desc';
  }): Promise<Blob> {
    return apiClient.get('/admin/audit-log', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
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