import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';
import type { Application } from '@types';

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string | number;
      status: Application['status'];
    }) => employerService.updateApplicationStatus(applicationId as any, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    },
  });
};
