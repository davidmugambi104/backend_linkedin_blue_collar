export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  ESCROW = 'escrow',
  RELEASED = 'released',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CRYPTO = 'crypto',
}

export enum PaymentType {
  JOB_PAYMENT = 'job_payment',
  PLATFORM_FEE = 'platform_fee',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  BONUS = 'bonus',
}

export interface Payment {
  id: number;
  job_id: number;
  employer_id: number;
  worker_id: number;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  transaction_id?: string;
  stripe_payment_intent_id?: string;
  stripe_transfer_id?: string;
  paid_at?: string;
  refunded_at?: string;
  refund_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations
  job?: any;
  worker?: any;
  employer?: any;
  invoice?: PaymentInvoice;
  disputes?: PaymentDispute[];
}

export interface PaymentInvoice {
  id: number;
  payment_id: number;
  invoice_number: string;
  invoice_url: string;
  pdf_url?: string;
  created_at: string;
}

export interface PaymentDispute {
  id: number;
  payment_id: number;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreateRequest {
  job_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_type?: PaymentType;
  metadata?: Record<string, any>;
}

export interface PaymentUpdateRequest {
  status?: PaymentStatus;
  transaction_id?: string;
  paid_at?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  total_payments: number;
  total_amount_paid: number;
  total_platform_fees: number;
  total_net_amount: number;
  payments_by_status: Record<PaymentStatus, number>;
  payments_by_method: Record<PaymentMethod, number>;
  recent_payments_last_30_days: number;
  average_payment_amount: number;
  pending_payments: number;
  disputed_payments: number;
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  status: string;
}

export interface EscrowReleaseRequest {
  payment_id: number;
  job_id: number;
  worker_id: number;
  employer_id: number;
  release_amount: number;
  notes?: string;
}