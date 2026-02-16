import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@services/application.service';
import { toast } from 'react-toastify';

export const useWorkerApplications = (status?: string) => {
  return useQuery({
    queryKey: ['workerApplications', status],
    queryFn: () => applicationService.getApplications(status),
  });
};

export const useApplication = (applicationId: number) => {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationService.getApplication(applicationId),
    enabled: !!applicationId,
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: number) => 
      applicationService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerApplications'] });
      toast.success('Application withdrawn successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to withdraw application');
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: number) => 
      applicationService.deleteApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerApplications'] });
      toast.success('Application deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete application');
    },
  });
};

export const useApplicationStats = () => {
  return useQuery({
    queryKey: ['applicationStats'],
    queryFn: () => applicationService.getStats(),
  });
};