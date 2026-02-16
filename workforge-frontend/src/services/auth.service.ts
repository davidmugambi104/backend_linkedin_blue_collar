import { apiClient } from '@lib/api-client';
import { ENDPOINTS } from '@config/endpoints';
import {
  User,
  UserLoginRequest,
  UserLoginResponse,
  UserRegisterRequest,
  UserRegisterResponse,
  TokenRefreshResponse,
} from '@types';

class AuthService {
  async login(data: UserLoginRequest): Promise<UserLoginResponse> {
    return apiClient.post<UserLoginResponse>(ENDPOINTS.AUTH.LOGIN, data);
  }

  async register(data: UserRegisterRequest): Promise<UserRegisterResponse> {
    return apiClient.post<UserRegisterResponse>(ENDPOINTS.AUTH.REGISTER, data);
  }

  async logout(): Promise<void> {
    return apiClient.post(ENDPOINTS.AUTH.LOGOUT, {});
  }

  async refreshToken(): Promise<TokenRefreshResponse> {
    return apiClient.post<TokenRefreshResponse>(ENDPOINTS.AUTH.REFRESH, {});
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(ENDPOINTS.USERS.ME);
  }

  async toggleUserActivation(userId: number, isActive: boolean): Promise<{ message: string; user: User }> {
    return apiClient.put(ENDPOINTS.USERS.ADMIN_USERS_ACTIVATE(userId), { is_active: isActive });
  }
}

export const authService = new AuthService();