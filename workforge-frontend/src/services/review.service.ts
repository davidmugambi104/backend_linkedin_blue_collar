import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Review, 
  ReviewCreateRequest, 
  ReviewUpdateRequest,
  ReviewStats,
  ReviewResponse,
  ReviewFlag,
  WorkerAverageRating
} from '@types';

class ReviewService {
  // Review CRUD
  async createReview(data: ReviewCreateRequest): Promise<Review> {
    return axiosClient.post<Review>(ENDPOINTS.REVIEWS.CREATE, data);
  }

  async getReviews(params?: {
    worker_id?: number;
    employer_id?: number;
    job_id?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<{ reviews: Review[]; total: number; pages: number }> {
    return axiosClient.get(ENDPOINTS.REVIEWS.ALL, { params });
  }

  async getReview(reviewId: number): Promise<Review> {
    return axiosClient.get<Review>(ENDPOINTS.REVIEWS.GET(reviewId));
  }

  async updateReview(reviewId: number, data: ReviewUpdateRequest): Promise<Review> {
    return axiosClient.put<Review>(ENDPOINTS.REVIEWS.UPDATE(reviewId), data);
  }

  async deleteReview(reviewId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.REVIEWS.DELETE(reviewId));
  }

  // Worker Reviews
  async getWorkerReviews(workerId: number, params?: { page?: number; limit?: number }): Promise<{
    reviews: Review[];
    total: number;
    average: number;
  }> {
    return axiosClient.get(`/reviews/worker/${workerId}`, { params });
  }

  async getWorkerAverageRating(workerId: number): Promise<WorkerAverageRating> {
    return axiosClient.get<WorkerAverageRating>(ENDPOINTS.REVIEWS.WORKER_AVERAGE(workerId));
  }

  async getWorkerReviewStats(workerId: number): Promise<ReviewStats> {
    return axiosClient.get<ReviewStats>(`/reviews/worker/${workerId}/stats`);
  }

  // Employer Reviews
  async getEmployerReviews(employerId: number): Promise<Review[]> {
    return axiosClient.get<Review[]>(`/reviews/employer/${employerId}`);
  }

  // Review Responses
  async addResponse(reviewId: number, content: string): Promise<ReviewResponse> {
    return axiosClient.post<ReviewResponse>(`/reviews/${reviewId}/responses`, { content });
  }

  async updateResponse(reviewId: number, responseId: number, content: string): Promise<ReviewResponse> {
    return axiosClient.put<ReviewResponse>(
      `/reviews/${reviewId}/responses/${responseId}`,
      { content }
    );
  }

  async deleteResponse(reviewId: number, responseId: number): Promise<void> {
    return axiosClient.delete(`/reviews/${reviewId}/responses/${responseId}`);
  }

  // Review Helpful
  async markHelpful(reviewId: number): Promise<void> {
    return axiosClient.post(`/reviews/${reviewId}/helpful`);
  }

  async unmarkHelpful(reviewId: number): Promise<void> {
    return axiosClient.delete(`/reviews/${reviewId}/helpful`);
  }

  // Review Reporting
  async reportReview(reviewId: number, reason: string): Promise<ReviewFlag> {
    return axiosClient.post<ReviewFlag>(`/reviews/${reviewId}/report`, { reason });
  }

  // Admin
  async moderateReview(reviewId: number, action: 'approve' | 'reject' | 'hide', reason?: string): Promise<Review> {
    return axiosClient.post<Review>(`/admin/reviews/${reviewId}/moderate`, { action, reason });
  }

  async getFlaggedReviews(): Promise<Review[]> {
    return axiosClient.get<Review[]>('/admin/reviews/flagged');
  }
}

export const reviewService = new ReviewService();