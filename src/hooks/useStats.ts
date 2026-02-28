import { useEffect, useState } from 'react';
import { statsService } from '@/services/stats.service';
import type { Stats } from '@/types';

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statsService
      .get()
      .then(setStats)
      .catch(() => setError('Erreur lors du chargement des statistiques'))
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading, error };
};
