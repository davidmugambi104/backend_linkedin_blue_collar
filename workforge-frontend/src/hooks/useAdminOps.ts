/**
 * Admin Operations Hooks - Release 2
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminOpsService } from '@services/admin.service';

// === USER MANAGEMENT HOOKS ===

export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason?: string }) =>
      adminOpsService.suspendUser(userId, reason || 'Suspended by admin'),
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to suspend user');
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) => adminOpsService.reactivateUser(userId),
    onSuccess: () => {
      toast.success('User reactivated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reactivate user');
    },
  });
};

export const useResetVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) => adminOpsService.resetVerification(userId),
    onSuccess: () => {
      toast.success('Verification reset');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reset verification');
    },
  });
};

// === JOB MODERATION HOOKS ===

export const useFlagJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: number; reason?: string }) =>
      adminOpsService.flagJob(jobId, reason || 'Flagged by admin'),
    onSuccess: () => {
      toast.success('Job flagged');
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to flag job');
    },
  });
};

export const useUnpublishJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: number; reason?: string }) =>
      adminOpsService.unpublishJob(jobId, reason || 'Unpublished by admin'),
    onSuccess: () => {
      toast.success('Job unpublished');
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unpublish job');
    },
  });
};

export const useRestoreJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: number) => adminOpsService.restoreJob(jobId),
    onSuccess: () => {
      toast.success('Job restored');
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to restore job');
    },
  });
};

// === VERIFICATION QUEUE HOOKS ===

export const useVerificationQueue = (params?: { page?: number; per_page?: number; type?: string }) => {
  return useQuery({
    queryKey: ['admin', 'verification-queue', params],
    queryFn: () => adminOpsService.getVerificationQueue(params),
  });
};

export const useApproveVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ verificationId, notes }: { verificationId: number; notes?: string }) =>
      adminOpsService.approveVerification(verificationId, notes),
    onSuccess: () => {
      toast.success('Verification approved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve verification');
    },
  });
};

export const useRejectVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ verificationId, reason }: { verificationId: number; reason: string }) =>
      adminOpsService.rejectVerification(verificationId, reason),
    onSuccess: () => {
      toast.success('Verification rejected');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject verification');
    },
  });
};

export const useBulkVerification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, action, reason }: { ids: number[]; action: 'approve' | 'reject'; reason?: string }) =>
      adminOpsService.bulkVerification(ids, action, reason),
    onSuccess: () => {
      toast.success('Bulk operation completed');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Bulk operation failed');
    },
  });
};

// === DISPUTE MANAGEMENT HOOKS ===

export const useDisputeQueue = (params?: { page?: number; per_page?: number; status?: string; priority?: string }) => {
  return useQuery({
    queryKey: ['admin', 'dispute-queue', params],
    queryFn: () => adminOpsService.getDisputeQueue(params),
  });
};

export const useAssignDispute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ disputeId, assignedTo }: { disputeId: number; assignedTo: number }) =>
      adminOpsService.assignDispute(disputeId, assignedTo),
    onSuccess: () => {
      toast.success('Dispute assigned');
      queryClient.invalidateQueries({ queryKey: ['admin', 'dispute-queue'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign dispute');
    },
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ disputeId, resolution, notes }: { disputeId: number; resolution: any; notes?: string }) =>
      adminOpsService.resolveDispute(disputeId, resolution, notes),
    onSuccess: () => {
      toast.success('Dispute resolved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'dispute-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to resolve dispute');
    },
  });
};
