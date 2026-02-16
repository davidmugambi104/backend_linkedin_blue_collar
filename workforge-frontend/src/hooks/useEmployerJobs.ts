import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';
import { toast } from 'react-toastify';
import { JobCreateRequest, JobUpdateRequest } from '@types';

export const useEmployerJobs = () => {
  return useQuery({
    queryKey: ['employerJobs'],
    queryFn: () => employerService.getJobs(),
  });
};

export const useEmployerJob = (jobId: number) => {
  return useQuery({
    queryKey: ['employerJob', jobId],
    queryFn: () => employerService.getJob(jobId),
    enabled: !!jobId,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreateRequest) => employerService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerStats'] });
      toast.success('Job posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to post job');
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: number; data: JobUpdateRequest }) =>
      employerService.updateJob(jobId, data),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['employerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerJob', jobId] });
      toast.success('Job updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update job');
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => employerService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['employerStats'] });
      toast.success('Job deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete job');
    },
  });
};