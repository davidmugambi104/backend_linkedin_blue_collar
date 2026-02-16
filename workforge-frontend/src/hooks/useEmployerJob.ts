import { useQuery } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';

export const useEmployerJob = (jobId: string | number) => {
  return useQuery({
    queryKey: ['employer-job', jobId],
    queryFn: () => employerService.getJob(jobId as any),
    enabled: !!jobId,
  });
};
