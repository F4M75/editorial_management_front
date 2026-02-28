import api from './api';
import type { Stats } from '@/types';

export const statsService = {
  get: async (): Promise<Stats> => {
    const { data } = await api.get<Stats>('/stats');
    return data;
  },
};
