import { useEffect, useState } from 'react';
import { networkService } from '@/services/network.service';
import type { Network } from '@/types';

export const useNetworks = () => {
  const [networks, setNetworks] = useState<Network[]>([]);

  useEffect(() => {
    networkService.getAll().then(setNetworks).catch(() => {});
  }, []);

  return { networks };
};
