import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerService } from '@services/worker.service';
import { toast } from 'react-toastify';

// Public hooks for browsing workers
export const useWorkers = (params?: any) => {
  return useQuery({
    queryKey: ['workers', params],
    queryFn: () => workerService.searchWorkers(params),
  });
};

export const useWorker = (workerId: number) => {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => workerService.getWorkerById(workerId),
    enabled: !!workerId,
  });
};

// Authenticated worker profile hooks
export const useWorkerProfile = () => {
  return useQuery({
    queryKey: ['workerProfile'],
    queryFn: () => workerService.getProfile(),
  });
};

export const useUpdateWorkerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => workerService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });
};

export const useWorkerStats = () => {
  return useQuery({
    queryKey: ['workerStats'],
    queryFn: () => workerService.getStats(),
  });
};

export const useRecommendedJobs = () => {
  return useQuery({
    queryKey: ['recommendedJobs'],
    queryFn: () => workerService.getRecommendedJobs(),
  });
};

export const useWorkerReviews = () => {
  return useQuery({
    queryKey: ['workerReviews'],
    queryFn: () => workerService.getReviews(),
  });
};

// Hook for getting reviews of a specific worker (public profile)
export const useWorkerPublicReviews = (workerId: number) => {
  return useQuery({
    queryKey: ['worker-public-reviews', workerId],
    queryFn: () => workerService.getWorkerReviews(workerId),
    enabled: !!workerId,
  });
};