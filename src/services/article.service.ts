import api from './api';
import type { Article, ArticleFilters, ArticleStatus, PaginatedResponse } from '@/types';

export const articleService = {
  getAll: async (filters?: ArticleFilters): Promise<PaginatedResponse<Article>> => {
    const { data } = await api.get<PaginatedResponse<Article>>('/articles', { params: filters });
    return data;
  },

  getById: async (id: string): Promise<Article> => {
    const { data } = await api.get<Article>(`/articles/${id}`);
    return data;
  },

  create: async (payload: Partial<Article>): Promise<Article> => {
    const { data } = await api.post<Article>('/articles', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Article>): Promise<Article> => {
    const { data } = await api.patch<Article>(`/articles/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/articles/${id}`);
  },

  changeStatus: async (id: string, status: ArticleStatus): Promise<Article> => {
    const { data } = await api.patch<Article>(`/articles/${id}/status`, { status });
    return data;
  },

  notify: async (id: string, recipients: string[], subject: string) => {
    const { data } = await api.post(`/articles/${id}/notify`, { recipients, subject });
    return data;
  },

  import: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/import/articles', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
