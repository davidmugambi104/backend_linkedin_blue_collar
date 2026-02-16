import { useQuery } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';

export const useJobApplications = (jobId: string) => {
  return useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => employerService.getApplications(jobId),
    enabled: !!jobId,
  });
};
