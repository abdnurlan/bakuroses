import { api } from '@/lib/api';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  name: string;
  phone: string;
  deliveryFor: 'self' | 'gift';
  recipientName?: string;
  recipientPhone?: string;
  address: string;
  lat: number;
  lng: number;
  note?: string;
  scheduledDate?: string;
  items: OrderItem[];
  paymentType: 'payriff';
  zoneId: string;
  promoCode?: string;
}

export interface OrderResponse {
  orderId: string;
  successUrl?: string;
  paymentUrl?: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryFor?: 'self' | 'gift';
  recipientName?: string | null;
  recipientPhone?: string | null;
  address: string;
  lat: number;
  lng: number;
  note?: string;
  scheduledDate?: string | null;
  total: number;
  paymentType: string;
  status: string;
  zoneId: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { id: string; name: string; imageUrl: string; price: number };
  }[];
  delivery?: { id: string; currentLat: number | null; currentLng: number | null; heading: number | null } | null;
  createdAt: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
  const res = await api.post<OrderResponse>('/api/orders', payload);
  return res.data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await api.get<Order>(`/api/orders/${id}`);
  return res.data;
}

export async function fetchOrderStatus(id: string): Promise<{ id: string; status: string }> {
  const res = await api.get(`/api/orders/${id}/status`);
  return res.data;
}
