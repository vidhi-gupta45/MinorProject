import apiClient from './client';
import type { ApiResponse, HealthResponse } from '../types';

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<ApiResponse<HealthResponse>>('/health');
  return response.data.data;
};
