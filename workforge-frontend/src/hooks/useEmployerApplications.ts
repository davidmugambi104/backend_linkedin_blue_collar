import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';
import { toast } from 'react-toastify';

export const useJobApplications = (jobId: number) => {
  return useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: () => employerService.getJobApplications(jobId),
    enabled: !!jobId,
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: string }) =>
      employerService.updateApplicationStatus(applicationId, status),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['employerStats'] });
      toast.success('Application status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update application');
    },
  });
};