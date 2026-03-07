import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

// ============ JOB SERVICE ============
export interface Job {
  id: number;
  title: string;
  description: string;
  status: string;
  budget: number;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  employer_id: number;
  required_skill_id: number;
  created_at: string;
  updated_at?: string;
  // Additional optional fields from API
  employer?: any;
  required_skill?: any;
  application_count?: number;
  distance_km?: number;
  match_score?: number;
  pay_min?: number;
  pay_max?: number;
  pay_type?: any;
  expiration_date?: string;
  [key: string]: any;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  budget: number;
  skill_id: number;
  address?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface JobSearchParams {
  skill_id?: number;
  status?: string;
  min_budget?: number;
  max_budget?: number;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  limit?: number;
  page?: number;
}

class JobService {
  // Public job listings
  async getJobs(params?: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    return axiosClient.get(ENDPOINTS.JOBS.LIST, { params });
  }

  async getJob(jobId: number): Promise<Job> {
    return axiosClient.get(ENDPOINTS.JOBS.DETAIL(jobId));
  }

  // Search jobs
  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    return axiosClient.get(ENDPOINTS.JOBS.SEARCH, { params });
  }

  // Create job (employer)
  async createJob(data: JobCreateRequest): Promise<Job> {
    return axiosClient.post(ENDPOINTS.JOBS.CREATE, data);
  }

  // Update job
  async updateJob(jobId: number, data: Partial<JobCreateRequest>): Promise<Job> {
    return axiosClient.put(ENDPOINTS.JOBS.UPDATE(jobId), data);
  }

  // Delete job
  async deleteJob(jobId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.JOBS.DELETE(jobId));
  }

  // Get matched workers for a job
  async getMatchedWorkers(jobId: number): Promise<any[]> {
    return axiosClient.get(ENDPOINTS.JOBS.MATCH_WORKERS(jobId));
  }

  // Apply for a job (worker)
  async applyForJob(jobId: number, cover_letter?: string): Promise<any> {
    return axiosClient.post(ENDPOINTS.JOBS.APPLY(jobId), { cover_letter });
  }

  // Legacy alias
  async applyToJob(jobId: number, cover_letter?: string): Promise<any> {
    return this.applyForJob(jobId, cover_letter);
  }

  // Get job applications (public)
  async getJobApplications(jobId: number): Promise<any[]> {
    return axiosClient.get(ENDPOINTS.JOBS.APPLICATIONS, { params: { job_id: jobId } });
  }

  // Shortlist worker for job
  async shortlistWorker(jobId: number, workerId: number): Promise<any> {
    return axiosClient.post(ENDPOINTS.JOBS.SHORTLIST(jobId, workerId));
  }

  // Complete job
  async completeJob(jobId: number): Promise<Job> {
    return axiosClient.put(ENDPOINTS.JOBS.COMPLETE(jobId));
  }

  // Cancel job
  async cancelJob(jobId: number): Promise<Job> {
    return axiosClient.put(ENDPOINTS.JOBS.CANCEL(jobId));
  }

  // Get expired jobs
  async getExpiredJobs(): Promise<{ jobs: Job[] }> {
    return axiosClient.get(ENDPOINTS.JOBS.EXPIRED);
  }

  // Close expired jobs
  async closeExpiredJobs(): Promise<{ closed: number }> {
    return axiosClient.post(ENDPOINTS.JOBS.CLOSE_EXPIRED);
  }
}

export const jobService = new JobService();

// ============ APPLICATION SERVICE ============
export interface Application {
  id: number;
  job_id: number;
  worker_id: number;
  status: string;
  cover_letter?: string;
  created_at: string;
  [key: string]: any;
}

class ApplicationService {
  async getApplications(params?: { job_id?: number; status?: string; page?: number }): Promise<{ applications: Application[]; total: number }> {
    return axiosClient.get(ENDPOINTS.APPLICATIONS.LIST, { params });
  }

  async getApplication(applicationId: number): Promise<Application> {
    return axiosClient.get(ENDPOINTS.APPLICATIONS.DETAIL(applicationId));
  }

  async updateApplication(applicationId: number, data: { status?: string; notes?: string }): Promise<Application> {
    return axiosClient.put(ENDPOINTS.APPLICATIONS.UPDATE(applicationId), data);
  }

  async withdrawApplication(applicationId: number): Promise<void> {
    return axiosClient.post(ENDPOINTS.APPLICATIONS.WITHDRAW(applicationId));
  }

  async deleteApplication(applicationId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.APPLICATIONS.DELETE(applicationId));
  }

  async getStats(): Promise<any> {
    return axiosClient.get(ENDPOINTS.APPLICATIONS.STATS);
  }
}

export const applicationService = new ApplicationService();

// ============ SKILL SERVICE ============
export interface Skill {
  id: number;
  name: string;
  category: string;
}

class SkillService {
  async getSkills(): Promise<Skill[]> {
    return axiosClient.get(ENDPOINTS.SKILLS.LIST);
  }

  async getSkill(skillId: number): Promise<Skill> {
    return axiosClient.get(ENDPOINTS.SKILLS.DETAIL(skillId));
  }

  async createSkill(data: { name: string; category: string }): Promise<Skill> {
    return axiosClient.post(ENDPOINTS.SKILLS.CREATE, data);
  }

  async updateSkill(skillId: number, data: { name?: string; category?: string }): Promise<Skill> {
    return axiosClient.put(ENDPOINTS.SKILLS.UPDATE(skillId), data);
  }

  async deleteSkill(skillId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.SKILLS.DELETE(skillId));
  }

  async getCategories(): Promise<string[]> {
    return axiosClient.get(ENDPOINTS.SKILLS.CATEGORIES);
  }
}

export const skillService = new SkillService();
