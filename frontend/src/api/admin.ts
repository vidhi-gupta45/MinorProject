import apiClient from './client';
import type {
  ApiResponse,
  AdminStatsDto,
  AdminUserDto,
  CreateUserRequest,
  UpdateUserRequest,
  CategoryAdminDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  SlaPolicyDto,
  UpdateSlaPolicyRequest,
  AdminAuditLogDto,
  UserRole,
} from '../types';
import type { PageResponse } from './issue';

export interface UserFilterParams {
  role?: UserRole | '';
  departmentId?: number | '';
  active?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export interface AuditLogFilterParams {
  eventType?: string;
  issueId?: number;
  actorId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export const getAdminStats = async (): Promise<AdminStatsDto> => {
  const response = await apiClient.get<ApiResponse<AdminStatsDto>>('/admin/stats');
  return response.data.data;
};

export const getUsers = async (params: UserFilterParams): Promise<PageResponse<AdminUserDto>> => {
  const cleanParams: Record<string, string | number | boolean> = {};
  if (params.role) cleanParams.role = params.role;
  if (params.departmentId) cleanParams.departmentId = params.departmentId;
  if (params.active !== undefined) cleanParams.active = params.active;
  if (params.search) cleanParams.search = params.search;
  cleanParams.page = params.page ?? 0;
  cleanParams.size = params.size ?? 15;

  const response = await apiClient.get<ApiResponse<PageResponse<AdminUserDto>>>('/admin/users', {
    params: cleanParams,
  });
  return response.data.data;
};

export const createUser = async (request: CreateUserRequest): Promise<AdminUserDto> => {
  const response = await apiClient.post<ApiResponse<AdminUserDto>>('/admin/users', request);
  return response.data.data;
};

export const updateUser = async (id: number, request: UpdateUserRequest): Promise<AdminUserDto> => {
  const response = await apiClient.put<ApiResponse<AdminUserDto>>(`/admin/users/${id}`, request);
  return response.data.data;
};

export const resetUserPassword = async (id: number, newPassword: string): Promise<void> => {
  await apiClient.put<ApiResponse<void>>(`/admin/users/${id}/password`, { newPassword });
};

export const getAllCategories = async (): Promise<CategoryAdminDto[]> => {
  const response = await apiClient.get<ApiResponse<CategoryAdminDto[]>>('/admin/categories');
  return response.data.data;
};

export const createCategory = async (request: CreateCategoryRequest): Promise<CategoryAdminDto> => {
  const response = await apiClient.post<ApiResponse<CategoryAdminDto>>('/admin/categories', request);
  return response.data.data;
};

export const updateCategory = async (id: number, request: UpdateCategoryRequest): Promise<CategoryAdminDto> => {
  const response = await apiClient.put<ApiResponse<CategoryAdminDto>>(`/admin/categories/${id}`, request);
  return response.data.data;
};

export const getAllSlaPolicies = async (): Promise<SlaPolicyDto[]> => {
  const response = await apiClient.get<ApiResponse<SlaPolicyDto[]>>('/admin/sla-policies');
  return response.data.data;
};

export const updateSlaPolicy = async (id: number, request: UpdateSlaPolicyRequest): Promise<SlaPolicyDto> => {
  const response = await apiClient.put<ApiResponse<SlaPolicyDto>>(`/admin/sla-policies/${id}`, request);
  return response.data.data;
};

export const getAuditLogs = async (params: AuditLogFilterParams): Promise<PageResponse<AdminAuditLogDto>> => {
  const cleanParams: Record<string, string | number> = {};
  if (params.eventType) cleanParams.eventType = params.eventType;
  if (params.issueId) cleanParams.issueId = params.issueId;
  if (params.actorId) cleanParams.actorId = params.actorId;
  if (params.startDate) cleanParams.startDate = params.startDate;
  if (params.endDate) cleanParams.endDate = params.endDate;
  cleanParams.page = params.page ?? 0;
  cleanParams.size = params.size ?? 20;

  const response = await apiClient.get<ApiResponse<PageResponse<AdminAuditLogDto>>>('/admin/audit-logs', {
    params: cleanParams,
  });
  return response.data.data;
};
