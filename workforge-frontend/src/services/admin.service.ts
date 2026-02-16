import { apiClient } from '@lib/api-client';
import { ENDPOINTS } from '@config/endpoints';
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
    return apiClient.get<PlatformStats>('/admin/stats');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>('/admin/system/health');
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
    return apiClient.get('/admin/audit-log', { params });
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