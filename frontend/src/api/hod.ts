import apiClient from './client';
import type {
  ApiResponse,
  HodDashboardSummary,
  IssueSummaryResponse,
  IssueDetailResponse,
  RoutingRuleDto,
  User,
  IssueStatus,
} from '../types';
import type { PageResponse } from './issue';

export const getDepartmentSummary = async (): Promise<HodDashboardSummary> => {
  const response = await apiClient.get<ApiResponse<HodDashboardSummary>>('/hod/summary');
  return response.data.data;
};

export const getDepartmentIssues = async (params: {
  status?: IssueStatus | '';
  categoryId?: number | '';
  handlerId?: number | '';
  overdueOnly?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<IssueSummaryResponse>> => {
  const cleanParams: Record<string, string | number | boolean> = {};
  if (params.status) cleanParams.status = params.status;
  if (params.categoryId) cleanParams.categoryId = params.categoryId;
  if (params.handlerId) cleanParams.handlerId = params.handlerId;
  if (params.overdueOnly) cleanParams.overdueOnly = params.overdueOnly;
  if (params.search) cleanParams.search = params.search;
  cleanParams.page = params.page ?? 0;
  cleanParams.size = params.size ?? 10;

  const response = await apiClient.get<ApiResponse<PageResponse<IssueSummaryResponse>>>('/hod/issues', {
    params: cleanParams,
  });
  return response.data.data;
};

export const reassignIssue = async (
  issueId: number,
  newAssigneeId: number,
  reason: string
): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/hod/issues/${issueId}/reassign`, {
    newAssigneeId,
    reason,
  });
  return response.data.data;
};

export const rejectIssue = async (
  issueId: number,
  reason: string
): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/hod/issues/${issueId}/reject`, {
    reason,
  });
  return response.data.data;
};

export const getDepartmentRoutingRules = async (): Promise<RoutingRuleDto[]> => {
  const response = await apiClient.get<ApiResponse<RoutingRuleDto[]>>('/hod/routing-rules');
  return response.data.data;
};

export const updateRoutingRule = async (
  ruleId: number,
  assigneeId: number
): Promise<RoutingRuleDto> => {
  const response = await apiClient.put<ApiResponse<RoutingRuleDto>>(
    `/hod/routing-rules/${ruleId}?assigneeId=${assigneeId}`
  );
  return response.data.data;
};

export const getDepartmentHandlers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/hod/handlers');
  return response.data.data;
};
