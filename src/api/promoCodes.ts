import { api } from '@/lib/api';
import type { OrderItem } from './orders';

export interface PromoValidateResult {
  valid: boolean;
  promoCodeId: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export async function validatePromoCode(code: string, items: OrderItem[]): Promise<PromoValidateResult> {
  const res = await api.post<PromoValidateResult>('/api/promo-codes/validate', { code, items });
  return res.data;
}

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const res = await api.get<PromoCode[]>('/api/promo-codes');
  return res.data;
}

export async function createPromoCode(data: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>): Promise<PromoCode> {
  const res = await api.post<PromoCode>('/api/promo-codes', data);
  return res.data;
}

export async function updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
  const res = await api.put<PromoCode>(`/api/promo-codes/${id}`, data);
  return res.data;
}

export async function deletePromoCode(id: string): Promise<void> {
  await api.delete(`/api/promo-codes/${id}`);
}
