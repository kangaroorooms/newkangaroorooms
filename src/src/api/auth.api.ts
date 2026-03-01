import axiosInstance from './axios';
import { ApiResponse, AuthResponse, RegisterInput, LoginInput, User } from '../types/api.types';
export const authApi = {
  // Register new user
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },
  // Login user
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  }
};