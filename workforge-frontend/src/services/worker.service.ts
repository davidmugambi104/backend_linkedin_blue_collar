import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Worker, 
  WorkerUpdateRequest, 
  WorkerSkill, 
  WorkerSkillRequest,
  WorkerStats,
  Job,
  Review 
} from '@types';

class WorkerService {
  // Public endpoints
  async searchWorkers(params?: any): Promise<Worker[]> {
    return axiosClient.get<Worker[]>(ENDPOINTS.WORKERS.LIST, { params });
  }

  async getWorkerById(workerId: number): Promise<Worker> {
    return axiosClient.get<Worker>(ENDPOINTS.WORKERS.DETAIL(workerId));
  }

  // Profile
  async getProfile(): Promise<Worker> {
    return axiosClient.get<Worker>(ENDPOINTS.WORKERS.PROFILE);
  }

  async updateProfile(data: WorkerUpdateRequest): Promise<Worker> {
    return axiosClient.put<Worker>(ENDPOINTS.WORKERS.PROFILE, data);
  }

  // Skills
  async getSkills(): Promise<WorkerSkill[]> {
    return axiosClient.get<WorkerSkill[]>(ENDPOINTS.WORKERS.SKILLS);
  }

  async addSkill(data: WorkerSkillRequest): Promise<WorkerSkill> {
    return axiosClient.post<WorkerSkill>(ENDPOINTS.WORKERS.SKILLS, data);
  }

  async updateSkill(skillId: number, data: Partial<WorkerSkillRequest>): Promise<WorkerSkill> {
    return axiosClient.put<WorkerSkill>(ENDPOINTS.WORKERS.SKILL(skillId), data);
  }

  async removeSkill(skillId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.WORKERS.SKILL(skillId));
  }

  // Jobs
  async getRecommendedJobs(): Promise<Job[]> {
    return axiosClient.get<Job[]>(ENDPOINTS.WORKERS.RECOMMENDATIONS);
  }

  // Stats
  async getStats(): Promise<WorkerStats> {
    return axiosClient.get<WorkerStats>(ENDPOINTS.WORKERS.STATS);
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    return axiosClient.get<Review[]>(ENDPOINTS.WORKERS.REVIEWS);
  }
}

export const workerService = new WorkerService();