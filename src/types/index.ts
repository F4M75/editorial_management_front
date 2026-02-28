export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  networkId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Network {
  id: string;
  name: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  networkId: string;
  network: Network;
  categories: { category: Category }[];
  status: ArticleStatus;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFilters {
  status?: ArticleStatus;
  featured?: boolean;
  networkId?: string;
  categoryId?: string;
  author?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EmailNotification {
  id: string;
  articleId: string;
  article: { id: string; title: string };
  recipients: string[];
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
