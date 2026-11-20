import apiClient from './client';
import type {
  ApiResponse,
  CategoryDto,
  IssueDetailResponse,
  IssueSummaryResponse,
  CommentResponse,
  StudentDashboardSummary,
  IssueStatus,
} from '../types';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getCategories = async (): Promise<CategoryDto[]> => {
  const response = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
  return response.data.data;
};

export const createIssue = async (formData: FormData): Promise<IssueDetailResponse> => {
  const response = await apiClient.post<ApiResponse<IssueDetailResponse>>('/issues', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const getMyIssues = async (params: {
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

  const response = await apiClient.get<ApiResponse<PageResponse<IssueSummaryResponse>>>('/issues/my', {
    params: cleanParams,
  });
  return response.data.data;
};

export const getStudentIssueDetail = async (id: number): Promise<IssueDetailResponse> => {
  const response = await apiClient.get<ApiResponse<IssueDetailResponse>>(`/issues/${id}`);
  return response.data.data;
};

export const addStudentComment = async (issueId: number, body: string): Promise<CommentResponse> => {
  const response = await apiClient.post<ApiResponse<CommentResponse>>(`/issues/${issueId}/comments`, { body });
  return response.data.data;
};

export const getStudentDashboardSummary = async (): Promise<StudentDashboardSummary> => {
  const response = await apiClient.get<ApiResponse<StudentDashboardSummary>>('/issues/student/dashboard');
  return response.data.data;
};
