import { api } from '@/lib/api';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>('/api/categories');
  return res.data;
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'default';
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.minPrice != null) query.set('minPrice', String(params.minPrice));
  if (params?.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
  if (params?.sort && params.sort !== 'default') query.set('sort', params.sort);
  const qs = query.toString();
  const res = await api.get<import('@/entities/product/types').Product[]>(
    `/api/products${qs ? `?${qs}` : ''}`
  );
  return res.data;
}
