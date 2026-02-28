import api from './api';
import type { Network } from '@/types';

export const networkService = {
  getAll: async (): Promise<Network[]> => {
    const { data } = await api.get<Network[]>('/networks');
    return data;
  },
};
