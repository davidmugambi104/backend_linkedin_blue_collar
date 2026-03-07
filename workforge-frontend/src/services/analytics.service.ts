import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

// ============ ANALYTICS SERVICE ============
export interface AnalyticsOverview {
  total_users: number;
  total_workers: number;
  total_employers: number;
  total_jobs: number;
  total_applications: number;
  total_payments: number;
  revenue: number;
}

export interface RevenueData {
  date: string;
  amount: number;
  value?: number;
}

export interface WorkerRanking {
  worker_id: number;
  worker_name: string;
  score: number;
  rank: number;
}

export interface SkillAnalytics {
  skill_id: number;
  skill_name: string;
  job_count: number;
  avg_rate: number;
}

class AnalyticsService {
  // Overview
  async getOverview(): Promise<AnalyticsOverview> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.OVERVIEW);
  }

  async getDashboard(): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.DASHBOARD);
  }

  // Revenue
  async getRevenue(params?: { start_date?: string; end_date?: string }): Promise<RevenueData[]> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.REVENUE, { params });
  }

  // Jobs analytics
  async getJobsAnalytics(params?: { period?: string }): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.JOBS, { params });
  }

  // Users analytics
  async getUsersAnalytics(params?: { period?: string }): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.USERS, { params });
  }

  // Workers analytics
  async getWorkersAnalytics(params?: { period?: string }): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.WORKERS, { params });
  }

  // Specific worker analytics
  async getWorkerAnalytics(workerId: number): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.WORKER(workerId));
  }

  // Worker ranking
  async getWorkerRanking(workerId: number): Promise<WorkerRanking> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.WORKER_RANKING(workerId));
  }

  // Employer analytics
  async getEmployerAnalytics(employerId: number): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.EMPLOYER(employerId));
  }

  // Job analytics
  async getJobAnalytics(jobId: number): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.JOB_ANALYTICS(jobId));
  }

  // Skills analytics
  async getSkillsAnalytics(): Promise<SkillAnalytics[]> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.SKILLS);
  }

  // Growth analytics
  async getGrowth(params?: { period?: string }): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.GROWTH, { params });
  }

  // Legacy - for backward compatibility
  async getUserGrowth(params?: { period?: string }): Promise<any> {
    return this.getGrowth(params);
  }

  async getUserRetention(params?: { period?: string }): Promise<any> {
    return this.getGrowth(params);
  }

  // Location analytics
  async getLocationAnalytics(): Promise<any> {
    return axiosClient.get(ENDPOINTS.ANALYTICS.LOCATION);
  }
}

export const analyticsService = new AnalyticsService();
