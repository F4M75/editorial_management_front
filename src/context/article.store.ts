import { create } from 'zustand';
import type { Article, ArticleFilters, PaginatedResponse } from '@/types';
import { articleService } from '@/services/article.service';

interface ArticleState {
  articles: Article[];
  meta: PaginatedResponse<Article>['meta'] | null;
  filters: ArticleFilters;
  isLoading: boolean;
  error: string | null;
  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  setFilters: (filters: ArticleFilters) => void;
  deleteArticle: (id: string) => Promise<void>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  meta: null,
  filters: { page: 1, limit: 10 },
  isLoading: false,
  error: null,

  fetchArticles: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const merged = { ...get().filters, ...filters };
      const result = await articleService.getAll(merged);
      set({ articles: result.data, meta: result.meta, filters: merged });
    } catch {
      set({ error: 'Erreur lors du chargement des articles' });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  deleteArticle: async (id) => {
    await articleService.delete(id);
    set((state) => ({ articles: state.articles.filter((a) => a.id !== id) }));
  },
}));
