/**
 * Axios API client with interceptors for JWT auth,  error handling, and token refresh
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ENV } from '@config/env';
import { authStore } from '@store/auth.store';

// Simple toast notification fallback
const toast = {
  error: (msg: string) => console.error('[Toast]', msg),
  success: (msg: string) => console.log('[Toast]', msg),
};

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    onSuccess: (token: string) => void;
    onFailure: (error: AxiosError) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: ENV.VITE_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = authStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401, retry with refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue request while token is refreshing
            return new Promise((onSuccess, onFailure) => {
              this.failedQueue.push({ onSuccess, onFailure });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = authStore.getState().refreshToken;
            if (!refreshToken) {
              authStore.getState().logout();
              window.location.href = '/auth/login';
              return Promise.reject(error);
            }

            const response = await this.client.post('/auth/refresh', { refresh_token: refreshToken });
            const { access_token, refresh_token } = response.data;

            authStore.getState().setAccessToken(access_token);
            authStore.getState().setRefreshToken(refresh_token);

            // Retry all failed requests
            this.failedQueue.forEach((prom) => prom.onSuccess(access_token));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((prom) => prom.onFailure(refreshError as AxiosError));
            this.failedQueue = [];

            authStore.getState().logout();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors with toast
        if (error.response?.status !== 401) {
          const message =
            (error.response?.data as any)?.message ||
            (error.response?.data as any)?.error ||
            error.message ||
            'An error occurred';
          toast.error(message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * File upload (multipart/form-data)
   */
  async uploadFile<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get raw axios instance for advanced usage
   */
  getRawClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
