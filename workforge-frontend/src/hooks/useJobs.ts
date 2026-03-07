import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@services/job.service';
import type { Job } from '@services/job.service';
import { JobSearchParams } from '@types';

export const useJobs = (params?: JobSearchParams) => {
  return useQuery<Job[]>({
    queryKey: ['jobs', params ?? {}],
    queryFn: async () => {
      try {
        const res = await jobService.getJobs(params);
        return res.jobs || [];
      } catch (error) {
        console.error('Error fetching jobs:', error);
        return [];
      }
    },
    staleTime: 30000,
  });
};

export const useJob = (jobId: number) => {
  return useQuery<Job>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');
      return jobService.getJob(jobId);
    },
    enabled: !!jobId,
    staleTime: 30000,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: number; data: any }) =>
      jobService.updateJob(jobId, data),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobService.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useApplyToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: number; data: any }) =>
      jobService.applyForJob(jobId, data?.cover_letter),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};