import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';
import { 
  Payment, 
  PaymentCreateRequest, 
  PaymentUpdateRequest,
  PaymentStats,
  PaymentIntent,
  EscrowReleaseRequest,
  PaymentDispute
} from '@types';

class PaymentService {
  // Payment CRUD
  async createPayment(data: PaymentCreateRequest): Promise<Payment> {
    return axiosClient.post<Payment>(ENDPOINTS.PAYMENTS.CREATE, data);
  }

  async getPayments(params?: { 
    job_id?: number; 
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payments: Payment[]; total: number; pages: number }> {
    return axiosClient.get(ENDPOINTS.PAYMENTS.LIST, { params });
  }

  async getPayment(paymentId: number): Promise<Payment> {
    return axiosClient.get<Payment>(ENDPOINTS.PAYMENTS.DETAIL(paymentId));
  }

  async updatePayment(paymentId: number, data: PaymentUpdateRequest): Promise<Payment> {
    return axiosClient.put<Payment>(ENDPOINTS.PAYMENTS.DETAIL(paymentId), data);
  }

  // Stripe Integration
  async createPaymentIntent(jobId: number, amount: number): Promise<PaymentIntent> {
    return axiosClient.post<PaymentIntent>('/payments/create-intent', { jobId, amount });
  }

  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    return axiosClient.post<Payment>('/payments/confirm', { paymentIntentId });
  }

  // Escrow
  async releaseEscrow(data: EscrowReleaseRequest): Promise<Payment> {
    return axiosClient.post<Payment>('/payments/escrow/release', data);
  }

  async holdEscrow(paymentId: number): Promise<Payment> {
    return axiosClient.post<Payment>(`/payments/escrow/${paymentId}/hold`);
  }

  // Disputes
  async createDispute(paymentId: number, reason: string): Promise<PaymentDispute> {
    return axiosClient.post<PaymentDispute>(`/payments/${paymentId}/disputes`, { reason });
  }

  async resolveDispute(paymentId: number, disputeId: number, resolution: string): Promise<PaymentDispute> {
    return axiosClient.post<PaymentDispute>(
      `/payments/${paymentId}/disputes/${disputeId}/resolve`,
      { resolution }
    );
  }

  // Invoices
  async downloadInvoice(paymentId: number): Promise<Blob> {
    return axiosClient.get(`/payments/${paymentId}/invoice`, {
      responseType: 'blob',
    }) as Promise<Blob>;
  }

  // Stats
  async getStats(): Promise<PaymentStats> {
    return axiosClient.get<PaymentStats>(ENDPOINTS.PAYMENTS.LIST + '/stats');
  }

  async getEmployerPayments(employerId: number): Promise<Payment[]> {
    return axiosClient.get<Payment[]>(`/employers/${employerId}/payments`);
  }

  async getWorkerPayments(workerId: number): Promise<Payment[]> {
    return axiosClient.get<Payment[]>(`/workers/${workerId}/payments`);
  }

  // Refunds
  async requestRefund(paymentId: number, reason: string): Promise<Payment> {
    return axiosClient.post<Payment>(ENDPOINTS.PAYMENTS.REFUND(paymentId), { reason });
  }

  async processRefund(paymentId: number): Promise<Payment> {
    return axiosClient.post<Payment>(`/payments/${paymentId}/process-refund`);
  }
}

export const paymentService = new PaymentService();