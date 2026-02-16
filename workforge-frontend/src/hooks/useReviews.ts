import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@services/review.service';
import { toast } from 'react-toastify';
import { ReviewCreateRequest, ReviewUpdateRequest } from '@types';

export const useReviews = (params?: { 
  worker_id?: number; 
  employer_id?: number; 
  job_id?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewService.getReviews(params),
  });
};

export const useReview = (reviewId: number) => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => reviewService.getReview(reviewId),
    enabled: !!reviewId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewCreateRequest) => reviewService.createReview(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['workerReviews', data.worker_id] });
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['workerStats'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.job_id] });
      toast.success('Review submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: number; data: ReviewUpdateRequest }) =>
      reviewService.updateReview(reviewId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      queryClient.invalidateQueries({ queryKey: ['workerReviews', data.worker_id] });
      toast.success('Review updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update review');
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete review');
    },
  });
};

export const useWorkerReviews = (workerId: number, page?: number) => {
  return useQuery({
    queryKey: ['workerReviews', workerId, page],
    queryFn: () => reviewService.getWorkerReviews(workerId, { page, limit: 10 }),
    enabled: !!workerId,
  });
};

export const useWorkerReviewStats = (workerId: number) => {
  return useQuery({
    queryKey: ['workerReviewStats', workerId],
    queryFn: () => reviewService.getWorkerReviewStats(workerId),
    enabled: !!workerId,
  });
};

export const useWorkerAverageRating = (workerId: number) => {
  return useQuery({
    queryKey: ['workerAverageRating', workerId],
    queryFn: () => reviewService.getWorkerAverageRating(workerId),
    enabled: !!workerId,
  });
};

export const useReviewResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: number; content: string }) =>
      reviewService.addResponse(reviewId, content),
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Response added successfully');
    },
  });
};

export const useMarkHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => reviewService.markHelpful(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};