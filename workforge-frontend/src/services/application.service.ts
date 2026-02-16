import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Application, 
  ApplicationCreateRequest, 
  ApplicationUpdateRequest,
  ApplicationStats 
} from '@types';

class ApplicationService {
  async getApplications(status?: string): Promise<Application[]> {
    const params = status ? { status } : {};
    return axiosClient.get<Application[]>(ENDPOINTS.APPLICATIONS.LIST, { params });
  }

  async getApplication(applicationId: number): Promise<Application> {
    return axiosClient.get<Application>(ENDPOINTS.APPLICATIONS.DETAIL(applicationId));
  }

  async updateApplication(applicationId: number, data: ApplicationUpdateRequest): Promise<Application> {
    return axiosClient.put<Application>(ENDPOINTS.APPLICATIONS.UPDATE(applicationId), data);
  }

  async withdrawApplication(applicationId: number): Promise<Application> {
    return axiosClient.put<Application>(ENDPOINTS.APPLICATIONS.UPDATE(applicationId), {
      status: 'withdrawn'
    });
  }

  async deleteApplication(applicationId: number): Promise<void> {
    await axiosClient.delete(ENDPOINTS.APPLICATIONS.DETAIL(applicationId));
  }

  async applyToJob(jobId: number, coverLetter?: string): Promise<Application> {
    return axiosClient.post<Application>(ENDPOINTS.JOBS.APPLY(jobId), {
      cover_letter: coverLetter,
    });
  }

  async getStats(): Promise<ApplicationStats> {
    return axiosClient.get<ApplicationStats>(ENDPOINTS.APPLICATIONS.LIST + '/stats');
  }
}

export const applicationService = new ApplicationService();