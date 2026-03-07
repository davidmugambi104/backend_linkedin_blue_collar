import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'worker' | 'employer' | 'admin';
  is_verified: boolean;
  created_at: string;
}

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

class UserService {
  async getMe(): Promise<User> {
    return axiosClient.get(ENDPOINTS.USERS.ME);
  }

  async updateMe(data: UserUpdateRequest): Promise<User> {
    return axiosClient.put(ENDPOINTS.USERS.UPDATE, data);
  }

  async updateUser(userId: number, data: UserUpdateRequest): Promise<User> {
    return axiosClient.put(ENDPOINTS.USERS.UPDATE_BY_ID(userId), data);
  }

  async deleteUser(userId: number): Promise<void> {
    return axiosClient.delete(ENDPOINTS.USERS.DELETE(userId));
  }

  async changePassword(data: PasswordChangeRequest): Promise<void> {
    return axiosClient.post(ENDPOINTS.USERS.CHANGE_PASSWORD, data);
  }
}

export const userService = new UserService();
