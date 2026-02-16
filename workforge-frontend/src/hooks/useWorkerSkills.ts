import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workerService } from '@services/worker.service';
import { toast } from 'react-toastify';

export const useWorkerSkills = () => {
  return useQuery({
    queryKey: ['workerSkills'],
    queryFn: () => workerService.getSkills(),
  });
};

export const useAddWorkerSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => workerService.addSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerSkills'] });
      queryClient.invalidateQueries({ queryKey: ['workerProfile'] });
      toast.success('Skill added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add skill');
    },
  });
};

export const useUpdateWorkerSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ skillId, data }: { skillId: number; data: any }) =>
      workerService.updateSkill(skillId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerSkills'] });
      toast.success('Skill updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update skill');
    },
  });
};

export const useRemoveWorkerSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillId: number) => workerService.removeSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workerSkills'] });
      toast.success('Skill removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove skill');
    },
  });
};