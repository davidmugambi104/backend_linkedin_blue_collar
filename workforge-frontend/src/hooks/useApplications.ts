import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@services/application.service';
import { ApplicationUpdateRequest } from '@types';

/**
 * Fetch all worker applications
 */
export const useWorkerApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.getApplications(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch applications for an employer (all applications to their jobs)
 */
export const useEmployerApplications = () => {
  return useQuery({
    queryKey: ['applications-employer'],
    queryFn: () => applicationService.getApplications(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Get a single application by ID
 */
export const useApplicationDetail = (applicationId: number | null) => {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () =>
      applicationId ? applicationService.getApplication(applicationId) : Promise.reject('No ID'),
    enabled: !!applicationId,
  });
};

/**
 * Mutation to update an application (status, cover letter, etc)
 */
export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationUpdateRequest }) =>
      applicationService.updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications-employer'] });
    },
  });
};

/**
 * Mutation to apply to a job
 */
export const useApplyToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, coverLetter }: { jobId: number; coverLetter?: string }) =>
      applicationService.applyToJob(jobId, coverLetter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

/**
 * Mutation to withdraw an application
 */
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: number) =>
      applicationService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
