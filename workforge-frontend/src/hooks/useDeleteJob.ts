import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number | string) => employerService.deleteJob(jobId as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
