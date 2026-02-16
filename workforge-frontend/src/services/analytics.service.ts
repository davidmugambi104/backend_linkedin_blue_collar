import { apiClient } from '@lib/api-client';
import type {
  TimeSeriesData,
  RevenueAnalytics,
  UserAnalytics,
} from '../types/admin.types';

class AnalyticsService {
  // Revenue Analytics
  async getRevenueAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<RevenueAnalytics> {
    return apiClient.get<RevenueAnalytics>('/admin/analytics/revenue', { params });
  }

  async getDailyRevenue(days: number = 30): Promise<TimeSeriesData[]> {
    return apiClient.get<TimeSeriesData[]>('/admin/analytics/revenue/daily', {
      params: { days },
    });
  }

  async getMonthlyRevenue(months: number = 12): Promise<TimeSeriesData[]> {
    return apiClient.get<TimeSeriesData[]>('/admin/analytics/revenue/monthly', {
      params: { months },
    });
  }

  // User Analytics
  async getUserAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<UserAnalytics> {
    return apiClient.get<UserAnalytics>('/admin/analytics/users', { params });
  }

  async getUserGrowth(days: number = 30): Promise<TimeSeriesData[]> {
    return apiClient.get<TimeSeriesData[]>('/admin/analytics/users/growth', {
      params: { days },
    });
  }

  async getUserRetention(days: number = 90): Promise<TimeSeriesData[]> {
    return apiClient.get<TimeSeriesData[]>('/admin/analytics/users/retention', {
      params: { days },
    });
  }

  // Job Analytics
  async getJobAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_jobs: number;
    active_jobs: number;
    completed_jobs: number;
    avg_completion_time: number;
    jobs_by_category: Record<string, number>;
    jobs_by_status: Record<string, number>;
  }> {
    return apiClient.get('/admin/analytics/jobs', { params });
  }

  async getPopularSkills(limit: number = 10): Promise<Array<{ skill: string; count: number }>> {
    return apiClient.get('/admin/analytics/skills/popular', {
      params: { limit },
    });
  }

  // Payment Analytics
  async getPaymentAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_transactions: number;
    total_volume: number;
    average_transaction: number;
    success_rate: number;
    payments_by_method: Record<string, number>;
    payments_by_status: Record<string, number>;
  }> {
    return apiClient.get('/admin/analytics/payments', { params });
  }

  // Geographic Analytics
  async getGeographicDistribution(): Promise<{
    users_by_country: Record<string, number>;
    jobs_by_country: Record<string, number>;
    revenue_by_country: Record<string, number>;
  }> {
    return apiClient.get('/admin/analytics/geographic');
  }

  // Performance Metrics
  async getPerformanceMetrics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    avg_response_time: number;
    uptime_percentage: number;
    error_rate: number;
    api_usage: TimeSeriesData[];
  }> {
    return apiClient.get('/admin/analytics/performance', { params });
  }

  // Custom Reports
  async generateCustomReport(params: {
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    date_range: { start: string; end: string };
  }): Promise<any> {
    return apiClient.post('/admin/analytics/custom-report', params);
  }

  // Export Analytics
  async exportAnalytics(params: {
    report_type: string;
    format: 'csv' | 'excel' | 'pdf' | 'json';
    date_range?: { start: string; end: string };
  }): Promise<Blob> {
    return apiClient.get('/admin/analytics/export', {
      params,
      responseType: 'blob',
    });
  }
}

export const analyticsService = new AnalyticsService();