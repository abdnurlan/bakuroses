import { api } from '@/lib/api';

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

export async function validatePromoCode(code: string, cartTotal: number): Promise<PromoValidateResult> {
  const res = await api.post<PromoValidateResult>('/api/promo-codes/validate', { code, cartTotal });
  return res.data;
}

const adminHeaders = () => ({ 'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin123' });

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const res = await api.get<PromoCode[]>('/api/promo-codes', { headers: adminHeaders() });
  return res.data;
}

export async function createPromoCode(data: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>): Promise<PromoCode> {
  const res = await api.post<PromoCode>('/api/promo-codes', data, { headers: adminHeaders() });
  return res.data;
}

export async function updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
  const res = await api.put<PromoCode>(`/api/promo-codes/${id}`, data, { headers: adminHeaders() });
  return res.data;
}

export async function deletePromoCode(id: string): Promise<void> {
  await api.delete(`/api/promo-codes/${id}`, { headers: adminHeaders() });
}
