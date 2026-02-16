import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Employer, 
  EmployerUpdateRequest,
  EmployerStats,
  Job,
  JobCreateRequest,
  JobUpdateRequest,
  Application,
  Worker,
  Review,
  ReviewCreateRequest
} from '@types';

class EmployerService {
  // Profile
  async getProfile(): Promise<Employer> {
    return axiosClient.get<Employer>(ENDPOINTS.EMPLOYERS.PROFILE);
  }

  async updateProfile(data: EmployerUpdateRequest): Promise<Employer> {
    return axiosClient.put<Employer>(ENDPOINTS.EMPLOYERS.PROFILE, data);
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return axiosClient.get<Job[]>(ENDPOINTS.EMPLOYERS.JOBS);
  }

  async getJob(jobId: number): Promise<Job> {
    return axiosClient.get<Job>(ENDPOINTS.EMPLOYERS.JOB(jobId));
  }

  async createJob(data: JobCreateRequest): Promise<Job> {
    return axiosClient.post<Job>(ENDPOINTS.EMPLOYERS.JOBS, data);
  }

  async updateJob(jobId: number, data: JobUpdateRequest): Promise<Job> {
    return axiosClient.put<Job>(ENDPOINTS.EMPLOYERS.JOB(jobId), data);
  }

  async deleteJob(jobId: number): Promise<void> {
    await axiosClient.delete(ENDPOINTS.EMPLOYERS.JOB(jobId));
  }

  // Applications
  async getApplications(status?: string): Promise<Application[]> {
    const params = status ? { status } : {};
    return axiosClient.get<Application[]>(ENDPOINTS.APPLICATIONS.LIST, { params });
  }

  async getJobApplications(jobId: number): Promise<Application[]> {
    return axiosClient.get<Application[]>(ENDPOINTS.EMPLOYERS.JOB_APPLICATIONS(jobId));
  }

  async updateApplicationStatus(applicationId: number, status: string): Promise<Application> {
    return axiosClient.put<Application>(
      ENDPOINTS.EMPLOYERS.APPLICATION_STATUS(applicationId),
      { status }
    );
  }

  // Worker Search
  async searchWorkers(params: any): Promise<Worker[]> {
    return axiosClient.get<Worker[]>(ENDPOINTS.EMPLOYERS.WORKERS_SEARCH, { params });
  }

  // Stats
  async getStats(): Promise<EmployerStats> {
    return axiosClient.get<EmployerStats>(ENDPOINTS.EMPLOYERS.STATS);
  }

  // Reviews
  async createReview(data: ReviewCreateRequest): Promise<Review> {
    return axiosClient.post<Review>(ENDPOINTS.REVIEWS.CREATE, data);
  }
}

export const employerService = new EmployerService();