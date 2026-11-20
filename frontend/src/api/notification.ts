import apiClient from './client';
import type { ApiResponse, NotificationItem } from '../types';
import type { PageResponse } from './issue';

export const getNotifications = async (params?: {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}): Promise<PageResponse<NotificationItem>> => {
  const cleanParams: Record<string, string | number | boolean> = {};
  if (params?.unreadOnly !== undefined) cleanParams.unreadOnly = params.unreadOnly;
  cleanParams.page = params?.page ?? 0;
  cleanParams.size = params?.size ?? 15;

  const response = await apiClient.get<ApiResponse<PageResponse<NotificationItem>>>('/notifications', {
    params: cleanParams,
  });
  return response.data.data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<number>>('/notifications/unread-count');
  return response.data.data;
};

export const markNotificationAsRead = async (id: number): Promise<NotificationItem> => {
  const response = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
  return response.data.data;
};

export const markAllNotificationsAsRead = async (): Promise<number> => {
  const response = await apiClient.post<ApiResponse<number>>('/notifications/mark-all-read');
  return response.data.data;
};
