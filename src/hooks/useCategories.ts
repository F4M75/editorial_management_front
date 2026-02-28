import { useEffect, useState } from 'react';
import { categoryService } from '@/services/category.service';
import type { Category } from '@/types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  return { categories };
};
