import apiClient from './client';
import type {
  ApiResponse,
  IssueDetailResponse,
  IssueSummaryResponse,
  CommentResponse,
  HandlerDashboardSummary,
  IssueStatus,
} from '../types';
import type { PageResponse } from './issue';

export const getHandlerWorkload = async (): Promise<HandlerDashboardSummary> => {
  const response = await apiClient.get<ApiResponse<HandlerDashboardSummary>>('/handler/workload');
  return response.data.data;
};

export const getAssignedIssues = async (params: {
  status?: IssueStatus | '';
  search?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<IssueSummaryResponse>> => {
  const cleanParams: Record<string, string | number> = {};
  if (params.status) cleanParams.status = params.status;
  if (params.search) cleanParams.search = params.search;
  cleanParams.page = params.page ?? 0;
  cleanParams.size = params.size ?? 10;

  const response = await apiClient.get<ApiResponse<PageResponse<IssueSummaryResponse>>>('/handler/issues', {
    params: cleanParams,
  });
  return response.data.data;
};

export const getHandlerIssueDetail = async (id: number): Promise<IssueDetailResponse> => {
  const response = await apiClient.get<ApiResponse<IssueDetailResponse>>(`/handler/issues/${id}`);
  return response.data.data;
};

export const acknowledgeIssue = async (id: number): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/issues/${id}/acknowledge`);
  return response.data.data;
};

export const startWork = async (id: number): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/issues/${id}/start`);
  return response.data.data;
};

export const resolveIssue = async (
  id: number,
  notes: string,
  files?: File[]
): Promise<IssueDetailResponse> => {
  if (files && files.length > 0) {
    const formData = new FormData();
    const resolveBlob = new Blob([JSON.stringify({ notes })], {
      type: 'application/json',
    });
    formData.append('resolve', resolveBlob);
    for (const file of files) {
      formData.append('files', file);
    }
    const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/issues/${id}/resolve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } else {
    const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(
      `/issues/${id}/resolve`,
      { notes },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.data;
  }
};

export const confirmResolution = async (id: number): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/issues/${id}/confirm-resolution`);
  return response.data.data;
};

export const reopenIssue = async (id: number, reason: string): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>(`/issues/${id}/reopen`, { reason });
  return response.data.data;
};

export const addInternalNote = async (id: number, note: string): Promise<CommentResponse> => {
  const response = await apiClient.post<ApiResponse<CommentResponse>>(`/issues/${id}/internal-notes`, { note });
  return response.data.data;
};
