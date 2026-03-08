/**
 * Admin Dashboard Hooks
 * - KPIs
 * - Permissions
 * - Audit logs
 */
import { useQuery } from '@tanstack/react-query';
import { adminDashboardService, AdminKPIs, AdminPermissions, AuditLogEntry } from '@services/admin-dashboard.service';

// === KPI HOOKS ===

export const useAdminKPIs = () => {
  return useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: () => adminDashboardService.getKPIs(),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useActivityFeed = (limit: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'activity-feed', limit],
    queryFn: () => adminDashboardService.getActivityFeed(limit),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// === PERMISSION HOOKS ===

export const useAdminPermissions = () => {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => adminDashboardService.getMyPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCheckPermissions = (permissions: string[]) => {
  return useQuery({
    queryKey: ['admin', 'check-permissions', permissions],
    queryFn: () => adminDashboardService.checkPermissions(permissions),
    enabled: permissions.length > 0,
  });
};

// === AUDIT LOG HOOKS ===

export const useAuditLog = (params?: {
  page?: number;
  per_page?: number;
  action?: string;
  user_id?: number;
}) => {
  return useQuery({
    queryKey: ['admin', 'audit-log', params],
    queryFn: () => adminDashboardService.getAuditLog(params),
    placeholderData: (previousData) => previousData,
  });
};
