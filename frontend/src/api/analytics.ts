import apiClient from './client';
import type { ApiResponse, AnalyticsSummaryDto, IssueStatus } from '../types';

export interface ExportIssuesFilterParams {
  status?: IssueStatus | '';
  startDate?: string;
  endDate?: string;
  departmentId?: number;
}

export const getDepartmentAnalytics = async (): Promise<AnalyticsSummaryDto> => {
  const response = await apiClient.get<ApiResponse<AnalyticsSummaryDto>>('/analytics/department');
  return response.data.data;
};

export const getInstitutionalAnalytics = async (): Promise<AnalyticsSummaryDto> => {
  const response = await apiClient.get<ApiResponse<AnalyticsSummaryDto>>('/analytics/institution');
  return response.data.data;
};

export const exportIssuesCsv = async (params?: ExportIssuesFilterParams): Promise<void> => {
  const cleanParams: Record<string, string | number> = {};
  if (params?.status) cleanParams.status = params.status;
  if (params?.startDate) cleanParams.startDate = params.startDate;
  if (params?.endDate) cleanParams.endDate = params.endDate;
  if (params?.departmentId) cleanParams.departmentId = params.departmentId;

  const response = await apiClient.get('/reports/issues/export', {
    params: cleanParams,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  let filename = `campuscare-issues-${new Date().toISOString().split('T')[0]}.csv`;
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
