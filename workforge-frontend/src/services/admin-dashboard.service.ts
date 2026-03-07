/**
 * Admin Dashboard Service
 * - KPI endpoints
 * - Permission management
 * - Audit logs
 */
import { apiClient } from '@lib/api-client';

export interface AdminKPIs {
  users: {
    total: number;
    active: number;
    workers: number;
    employers: number;
    verified_workers: number;
    new_today: number;
    new_week: number;
    new_month: number;
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
    new_today: number;
  };
  applications: {
    total: number;
    new_today: number;
  };
  verifications: {
    pending: number;
    this_week: number;
  };
  disputes: {
    open: number;
    this_week: number;
  };
  payments: {
    total_volume: number;
    volume_today: number;
    volume_week: number;
    completed: number;
    pending: number;
    failed: number;
  };
  platform_health: {
    verification_rate: number;
    job_completion_rate: number;
    application_success_rate: number;
  };
  generated_at: string;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export interface AdminPermissions {
  user_id: number;
  username: string;
  admin_role: string;
  permissions: string[];
  all_permissions: string[];
}

class AdminDashboardService {
  // === KPI ENDPOINTS ===
  
  async getKPIs(): Promise<AdminKPIs> {
    return apiClient.get<AdminKPIs>('/admin/kpis');
  }

  async getActivityFeed(limit: number = 20): Promise<any> {
    return apiClient.get('/admin/activity-feed', { params: { limit } });
  }

  // === PERMISSIONS ===

  async getMyPermissions(): Promise<AdminPermissions> {
    return apiClient.get<AdminPermissions>('/admin/permissions');
  }

  async checkPermissions(permissions: string[]): Promise<{ has_permissions: boolean; missing: string[] }> {
    return apiClient.post('/admin/permissions/check', { permissions });
  }

  // === AUDIT LOG ===

  async getAuditLog(params?: {
    page?: number;
    per_page?: number;
    action?: string;
    user_id?: number;
  }): Promise<{
    audit_logs: AuditLogEntry[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }> {
    return apiClient.get('/admin/audit-log', { params });
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
