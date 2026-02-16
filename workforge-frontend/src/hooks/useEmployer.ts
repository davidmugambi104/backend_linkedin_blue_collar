import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@services/employer.service';
import { toast } from 'react-toastify';

export const useEmployerProfile = () => {
  return useQuery({
    queryKey: ['employerProfile'],
    queryFn: () => employerService.getProfile(),
  });
};

export const useUpdateEmployerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => employerService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerProfile'] });
      toast.success('Company profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });
};

export const useEmployerStats = () => {
  return useQuery({
    queryKey: ['employerStats'],
    queryFn: () => employerService.getStats(),
  });
};

export const useEmployerApplications = (status?: string) => {
  return useQuery({
    queryKey: ['employerApplications', { status }],
    queryFn: () => employerService.getApplications(status),
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: string }) =>
      employerService.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerApplications'] });
      toast.success('Application status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update application');
    },
  });
};