import { api } from '@/lib/api';

export interface Zone {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  deliveryFee: number;
  color: string | null;
  isActive: boolean;
}

export async function fetchZones(): Promise<Zone[]> {
  const res = await api.get<Zone[]>('/api/zones');
  return res.data;
}

export async function checkCoverage(
  lat: number,
  lng: number
): Promise<{ covered: boolean; zone: Zone | null }> {
  const res = await api.post('/api/zones/check-coverage', { lat, lng });
  return res.data;
}
