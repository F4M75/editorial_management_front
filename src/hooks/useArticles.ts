import { useEffect, useState, useCallback } from 'react';
import { articleService } from '@/services/article.service';
import type { Article, ArticleFilters, PaginatedResponse } from '@/types';

export const useArticles = (filters: ArticleFilters) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Article>['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await articleService.getAll(filters);
      setArticles(result.data);
      setMeta(result.meta);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void fetch(); }, [fetch]);

  return { articles, meta, isLoading, refresh: fetch };
};
