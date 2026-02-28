import api from './api';
import type { EmailNotification, PaginatedResponse } from '@/types';

export const notificationService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<EmailNotification>> => {
    const { data } = await api.get<PaginatedResponse<EmailNotification>>('/notifications', {
      params: { page, limit },
    });
    return data;
  },
};
