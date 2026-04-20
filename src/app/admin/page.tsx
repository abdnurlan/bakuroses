'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DashboardData {
  totalOrders: number;
  activeDeliveries: number;
  totalRevenue: number;
  recentOrders: {
    id: string; code: string; customerName: string; customerPhone: string;
    total: number; status: string; paymentType: string; createdAt: string;
    zone: { name: string };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PREPARING: '#8b5cf6',
  ON_THE_WAY: '#f97316',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Ödəniş gözlənilir',
  CONFIRMED: 'Təsdiqləndi',
  PREPARING: 'Hazırlanır',
  ON_THE_WAY: 'Yolda',
  DELIVERED: 'Çatdırıldı',
  CANCELLED: 'Ləğv edildi',
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/admin/dashboard', {
        headers: { 'x-admin-token': sessionStorage.getItem('admin_authed') === 'true' ? (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin123') : '' },
      });
      return res.data;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) return <p style={{ color: 'var(--color-text-soft)' }}>Yüklənir…</p>;

  const stats = [
    { label: 'Ümumi Sifariş', value: data?.totalOrders ?? 0, icon: '🛒' },
    { label: 'Aktiv Çatdırılma', value: data?.activeDeliveries ?? 0, icon: '🛵' },
    { label: 'Ümumi Gəlir', value: `${(data?.totalRevenue ?? 0).toFixed(0)} ₼`, icon: '💰' },
  ];

  return (
    <div>
      <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Dashboard
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 16, padding: '1.5rem',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Son Sifarişlər</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['Kod', 'Müştəri', 'Telefon', 'Zona', 'Məbləğ', 'Status', 'Tarix'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.recentOrders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>#{order.code}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{order.customerName}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{order.customerPhone}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.zone.name}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{order.total.toFixed(0)} ₼</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: 20,
                    background: `${STATUS_COLORS[order.status]}22`,
                    color: STATUS_COLORS[order.status],
                  }}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {new Date(order.createdAt).toLocaleDateString('az-AZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
