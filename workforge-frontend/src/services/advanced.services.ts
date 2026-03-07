import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

// ============ ESCROW SERVICE ============

export interface EscrowHoldRequest {
  job_id: number;
  amount: number;
  payer_id: number;
  payee_id: number;
}

export interface EscrowReleaseRequest {
  escrow_id: number;
  amount?: number;
}

export interface EscrowRefundRequest {
  escrow_id: number;
  reason: string;
}

export interface Escrow {
  id: number;
  job_id: number;
  amount: number;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  payer_id: number;
  payee_id: number;
  created_at: string;
  released_at?: string;
}

class EscrowService {
  async holdFunds(data: EscrowHoldRequest): Promise<Escrow> {
    return axiosClient.post(ENDPOINTS.ESCROW.HOLD, data);
  }

  async releaseFunds(data: EscrowReleaseRequest): Promise<Escrow> {
    return axiosClient.post(ENDPOINTS.ESCROW.RELEASE, data);
  }

  async refund(data: EscrowRefundRequest): Promise<Escrow> {
    return axiosClient.post(ENDPOINTS.ESCROW.REFUND, data);
  }

  async getJobEscrow(jobId: number): Promise<Escrow> {
    return axiosClient.get(ENDPOINTS.ESCROW.JOB(jobId));
  }

  async getEscrowDetail(escrowId: number): Promise<Escrow> {
    return axiosClient.get(ENDPOINTS.ESCROW.DETAIL(escrowId));
  }
}

export const escrowService = new EscrowService();

// ============ DISPUTE SERVICE ============

export interface Dispute {
  id: number;
  job_id: number;
  applicant_id: number;
  employer_id: number;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

export interface CreateDisputeRequest {
  job_id: number;
  reason: string;
  description: string;
}

export interface RespondDisputeRequest {
  response: string;
  evidence?: string;
}

class DisputeService {
  async listDisputes(params?: { status?: string; page?: number; limit?: number }): Promise<{ disputes: Dispute[]; total: number }> {
    return axiosClient.get(ENDPOINTS.DISPUTES.LIST, { params });
  }

  async getDispute(disputeId: number): Promise<Dispute> {
    return axiosClient.get(ENDPOINTS.DISPUTES.DETAIL(disputeId));
  }

  async createDispute(data: CreateDisputeRequest): Promise<Dispute> {
    return axiosClient.post(ENDPOINTS.DISPUTES.CREATE, data);
  }

  async updateDispute(disputeId: number, data: Partial<CreateDisputeRequest>): Promise<Dispute> {
    return axiosClient.put(ENDPOINTS.DISPUTES.UPDATE(disputeId), data);
  }

  async respondToDispute(disputeId: number, data: RespondDisputeRequest): Promise<Dispute> {
    return axiosClient.post(ENDPOINTS.DISPUTES.RESPOND(disputeId), data);
  }

  async resolveDispute(disputeId: number, resolution: string): Promise<Dispute> {
    return axiosClient.post(ENDPOINTS.DISPUTES.RESOLVE(disputeId), { resolution });
  }
}

export const disputeService = new DisputeService();

// ============ BULK SERVICE ============

export interface BulkUserImport {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'worker' | 'employer';
  skills?: number[];
}

export interface BulkJobImport {
  title: string;
  description: string;
  budget: number;
  location: string;
  employer_id: number;
  required_skill_id: number;
}

export interface BulkExportRequest {
  entity: 'users' | 'workers' | 'employers' | 'jobs' | 'applications';
  format: 'csv' | 'json';
  filters?: Record<string, any>;
}

class BulkService {
  async importUsers(users: BulkUserImport[]): Promise<{ imported: number; failed: number; errors: string[] }> {
    return axiosClient.post(ENDPOINTS.BULK.USERS, { users });
  }

  async importJobs(jobs: BulkJobImport[]): Promise<{ imported: number; failed: number; errors: string[] }> {
    return axiosClient.post(ENDPOINTS.BULK.JOBS, { jobs });
  }

  async exportData(data: BulkExportRequest): Promise<Blob> {
    const response = await axiosClient.get(ENDPOINTS.BULK.EXPORT, {
      params: data,
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export const bulkService = new BulkService();

// ============ ML SERVICE ============

export interface SkillRecommendation {
  skill_id: number;
  skill_name: string;
  demand_score: number;
  avg_rate: number;
}

export interface MarketTrend {
  skill_id: number;
  skill_name: string;
  job_count: number;
  avg_rate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WorkerPricePrediction {
  worker_id: number;
  skill_id: number;
  suggested_min_rate: number;
  suggested_max_rate: number;
  confidence: number;
}

class MLService {
  async getSkillRecommendations(workerId: number): Promise<SkillRecommendation[]> {
    return axiosClient.get(ENDPOINTS.ML.RECOMMENDATIONS.SKILLS(workerId));
  }

  async getMarketTrends(): Promise<MarketTrend[]> {
    return axiosClient.get(ENDPOINTS.ML.RECOMMENDATIONS.TRENDS);
  }

  async getMarketPrice(skillId: number): Promise<{ skill_id: number; avg_rate: number; min_rate: number; max_rate: number }> {
    return axiosClient.get(ENDPOINTS.ML.PRICE.MARKET(skillId));
  }

  async getWorkerPrice(workerId: number): Promise<WorkerPricePrediction> {
    return axiosClient.get(ENDPOINTS.ML.PRICE.WORKER(workerId));
  }
}

export const mlService = new MLService();
