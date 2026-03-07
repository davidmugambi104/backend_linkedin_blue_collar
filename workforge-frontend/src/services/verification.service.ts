import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

export interface VerificationDocument {
  id: number;
  user_id: number;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
}

export interface VerificationStatus {
  is_verified: boolean;
  phone_verified: boolean;
  documents_verified: boolean;
}

export interface SendCodeRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

class VerificationService {
  async sendCode(data: SendCodeRequest): Promise<{ success: boolean; message: string }> {
    return axiosClient.post(ENDPOINTS.VERIFICATION.SEND_CODE, data);
  }

  async verifyCode(data: VerifyCodeRequest): Promise<{ success: boolean; message: string }> {
    return axiosClient.post(ENDPOINTS.VERIFICATION.VERIFY_CODE, data);
  }

  async verifyPhone(data: VerifyCodeRequest): Promise<{ success: boolean; message: string }> {
    return axiosClient.post(ENDPOINTS.VERIFICATION.VERIFY_PHONE, data);
  }

  async resendCode(phone: string): Promise<{ success: boolean; message: string }> {
    return axiosClient.post(ENDPOINTS.VERIFICATION.RESEND_CODE, { phone });
  }

  async getStatus(): Promise<VerificationStatus> {
    return axiosClient.get(ENDPOINTS.VERIFICATION.STATUS);
  }

  async uploadDocument(file: File, documentType: string): Promise<VerificationDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    return axiosClient.post(ENDPOINTS.VERIFICATION.DOCUMENT_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async uploadDocumentAlt(file: File, documentType: string): Promise<VerificationDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    return axiosClient.post(ENDPOINTS.VERIFICATION.DOCUMENTS_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getMyDocuments(): Promise<VerificationDocument[]> {
    return axiosClient.get(ENDPOINTS.VERIFICATION.MY_DOCUMENTS);
  }

  async getDocument(documentId: number): Promise<VerificationDocument> {
    return axiosClient.get(ENDPOINTS.VERIFICATION.DOCUMENT(documentId));
  }

  async getAdminQueue(): Promise<VerificationDocument[]> {
    return axiosClient.get(ENDPOINTS.VERIFICATION.ADMIN_QUEUE);
  }

  async adminReview(
    documentId: number,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<VerificationDocument> {
    return axiosClient.put(ENDPOINTS.VERIFICATION.ADMIN_REVIEW(documentId), { status, notes });
  }
}

export const verificationService = new VerificationService();
