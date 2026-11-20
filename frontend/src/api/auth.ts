import apiClient from './client';
import type { ApiResponse, User, Department } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  departmentId: number;
  phoneNumber?: string;
}

export interface AuthResponseData {
  accessToken: string;
  tokenType: string;
  user: User;
}

export const login = async (payload: LoginPayload): Promise<AuthResponseData> => {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
  return response.data.data;
};

export const register = async (payload: RegisterPayload): Promise<AuthResponseData> => {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
  return response.data.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
};

export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get<ApiResponse<Department[]>>('/departments');
  return response.data.data;
};
