import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@services/payment.service';
import { toast } from 'react-toastify';
import { PaymentCreateRequest, PaymentUpdateRequest, EscrowReleaseRequest } from '@types';

export const usePayments = (params?: { job_id?: number; status?: string; page?: number }) => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentService.getPayments(params),
  });
};

export const usePayment = (paymentId: number) => {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => paymentService.getPayment(paymentId),
    enabled: !!paymentId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentCreateRequest) => paymentService.createPayment(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['employerStats'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.job_id] });
      toast.success('Payment initiated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create payment');
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: PaymentUpdateRequest }) =>
      paymentService.updatePayment(paymentId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
      toast.success('Payment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update payment');
    },
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['paymentStats'],
    queryFn: () => paymentService.getStats(),
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: ({ jobId, amount }: { jobId: number; amount: number }) =>
      paymentService.createPaymentIntent(jobId, amount),
  });
};

export const useReleaseEscrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EscrowReleaseRequest) => paymentService.releaseEscrow(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['job', data.job_id] });
      toast.success('Payment released to worker successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to release payment');
    },
  });
};

export const useRequestRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) =>
      paymentService.requestRefund(paymentId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
      toast.success('Refund requested successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to request refund');
    },
  });
};