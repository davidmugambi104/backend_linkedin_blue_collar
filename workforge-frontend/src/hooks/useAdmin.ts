import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { toast } from 'react-toastify';

// Platform Stats
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getPlatformStats(),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// User Management
export const useAdminUsers = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params),
  });
};

export const useUserDetails = (userId: number) => {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminService.getUserDetails(userId),
    enabled: !!userId,
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      adminService.banUser(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      toast.success('User banned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to ban user');
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => adminService.unbanUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      toast.success('User unbanned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unban user');
    },
  });
};

// Job Moderation
export const useModerationQueue = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'moderation', params],
    queryFn: () => adminService.getModerationQueue(params),
  });
};

export const useModerateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, action }: { jobId: number; action: any }) =>
      adminService.moderateJob(jobId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      toast.success('Job moderated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to moderate job');
    },
  });
};

// Verification Queue
export const useVerificationQueue = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'verifications', params],
    queryFn: () => adminService.getVerificationQueue(params),
  });
};

export const useReviewVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ verificationId, data }: { verificationId: number; data: any }) =>
      adminService.reviewVerification(verificationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      toast.success('Verification reviewed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to review verification');
    },
  });
};

// Disputes
export const useDisputes = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: () => adminService.getDisputes(params),
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ disputeId, data }: { disputeId: number; data: any }) =>
      adminService.resolveDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      toast.success('Dispute resolved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to resolve dispute');
    },
  });
};

// Settings
export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getPlatformSettings(),
  });
};

// Support Tickets
export const useSupportTickets = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'support', params],
    queryFn: () => adminService.getSupportTickets(params),
  });
};

export const useTicketDetails = (ticketId: number) => {
  return useQuery({
    queryKey: ['admin', 'support', ticketId],
    queryFn: () => adminService.getTicketDetails(ticketId),
    enabled: !!ticketId,
  });
};

export const useRespondToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: number; message: string }) =>
      adminService.respondToTicket(ticketId, message),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', ticketId] });
      toast.success('Response sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send response');
    },
  });
};

// Audit Log
export const useAuditLog = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'audit-log', params],
    queryFn: () => adminService.getAuditLog(params),
  });
};