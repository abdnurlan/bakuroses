import { api } from '@/lib/api';
import type { Product } from '@/entities/product/types';

export async function fetchProducts(): Promise<Product[]> {
  const res = await api.get<Product[]>('/api/products');
  return res.data;
}
