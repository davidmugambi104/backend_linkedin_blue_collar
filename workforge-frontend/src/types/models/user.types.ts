export enum UserRole {
  WORKER = 'worker',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified?: boolean;
  profile?: {
    id?: number;
    full_name?: string;
    company_name?: string;
    profile_picture?: string;
    logo?: string;
    role?: string;
    is_online?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface UserRegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserRegisterResponse {
  message: string;
  user: User;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
}

export interface TokenRefreshResponse {
  access_token: string;
}