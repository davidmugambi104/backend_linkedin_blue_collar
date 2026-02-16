import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Job, 
  JobCreateRequest, 
  JobUpdateRequest,
  Application 
} from '@types';

interface JobSearchParams {
  title?: string;
  skill_id?: number;
  employer_id?: number;
  status?: string;
  pay_min?: number;
  pay_max?: number;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
}

class JobService {
  // Public endpoints
  async getJobs(params?: JobSearchParams): Promise<Job[]> {
    return axiosClient.get<Job[]>(ENDPOINTS.JOBS.LIST, { params });
  }

  async getJob(jobId: number): Promise<Job> {
    return axiosClient.get<Job>(ENDPOINTS.JOBS.DETAIL(jobId));
  }

  // Worker actions
  async applyToJob(jobId: number, coverLetter?: string): Promise<Application> {
    return axiosClient.post<Application>(
      ENDPOINTS.JOBS.APPLY(jobId),
      { cover_letter: coverLetter }
    );
  }

  // Employer actions (delegated through employer service but accessible here)
  async createJob(data: JobCreateRequest): Promise<Job> {
    return axiosClient.post<Job>(ENDPOINTS.EMPLOYERS.JOBS, data);
  }

  async updateJob(jobId: number, data: JobUpdateRequest): Promise<Job> {
    return axiosClient.put<Job>(ENDPOINTS.EMPLOYERS.JOB(jobId), data);
  }

  async deleteJob(jobId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.EMPLOYERS.JOB(jobId));
  }

  async searchJobs(params: JobSearchParams): Promise<Job[]> {
    return axiosClient.get<Job[]>(ENDPOINTS.JOBS.LIST, { params });
  }
}

export const jobService = new JobService();
export default jobService;
