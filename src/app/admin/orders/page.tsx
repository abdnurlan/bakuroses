'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_FLOW: Record<string, { value: string; label: string }[]> = {
  PENDING_PAYMENT: [],
  CONFIRMED: [
    { value: 'PREPARING', label: '👨‍🍳 Hazırlanır' },
    { value: 'CANCELLED', label: '❌ Ləğv et' },
  ],
  PREPARING: [
    { value: 'ON_THE_WAY', label: '🚗 Yoldadır' },
    { value: 'CANCELLED', label: '❌ Ləğv et' },
  ],
  ON_THE_WAY: [
    { value: 'DELIVERED', label: '📦 Çatdırıldı' },
  ],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_FILTER_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: '⏳ Ödəniş gözlənilir' },
  { value: 'CONFIRMED', label: '✅ Təsdiqləndi' },
  { value: 'PREPARING', label: '👨‍🍳 Hazırlanır' },
  { value: 'ON_THE_WAY', label: '🚗 Yoldadır' },
  { value: 'DELIVERED', label: '📦 Çatdırıldı' },
  { value: 'CANCELLED', label: '❌ Ləğv edildi' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: '#f59e0b',
  CONFIRMED: '#22c55e',
  PREPARING: '#3b82f6',
  ON_THE_WAY: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

interface Order {
  id: string; code: string; customerName: string; customerPhone: string;
  address: string; total: number; discountAmount: number; status: string; paymentType: string;
  createdAt: string; note?: string; scheduledDate?: string | null;
  zone: { name: string };
  promoCode?: { code: string } | null;
  items: { quantity: number; price: number; product: { name: string; imageUrl: string } }[];
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/api/orders?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 20_000,
  });
  const orders = data?.orders ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status yeniləndi');
      setSelected(null);
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600 }}>Sifarişlər</h1>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: '0.875rem', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Bütün statuslar</option>
          {STATUS_FILTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {selected && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              #{selected.code} — {selected.customerName}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>📞 {selected.customerPhone}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>📍 {selected.address}</p>
            {selected.scheduledDate && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                📅 Çatdırılma tarixi: <strong>{new Date(selected.scheduledDate).toLocaleDateString('az-AZ')}</strong>
              </p>
            )}
            {selected.note && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>💬 {selected.note}</p>}

            <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem' }}>
              {selected.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', fontSize: '0.875rem', padding: '0.55rem 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid var(--color-border)',
                        background: '#fff',
                        flex: '0 0 auto',
                      }}
                    />
                    <span style={{ minWidth: 0 }}>{item.product.name} × {item.quantity}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(0)} ₼</span>
                </div>
              ))}
              {selected.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: '#16a34a' }}>
                  <span>Endirim {selected.promoCode ? `(${selected.promoCode.code})` : ''}</span>
                  <span>-{selected.discountAmount.toFixed(2)} ₼</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontWeight: 700 }}>
                <span>Cəmi</span><span style={{ color: 'var(--color-accent-strong)' }}>{selected.total.toFixed(2)} ₼</span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Statusu dəyiş
            </p>
            {selected.status === 'PENDING_PAYMENT' && (
              <p style={{ fontSize: '0.82rem', color: '#f59e0b', marginBottom: '1rem' }}>
                ⏳ Ödəniş təsdiqlənməsi gözlənilir — avtomatik keçəcək
              </p>
            )}
            {(STATUS_FLOW[selected.status] ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {(STATUS_FLOW[selected.status] ?? []).map(s => (
                  <button
                    key={s.value}
                    onClick={() => statusMutation.mutate({ id: selected.id, status: s.value })}
                    disabled={statusMutation.isPending}
                    style={{
                      padding: '0.5rem 0.9rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: s.value === 'CANCELLED' ? '#fee2e2' : 'var(--color-accent-strong)',
                      color: s.value === 'CANCELLED' ? '#ef4444' : '#fff',
                      opacity: statusMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {(STATUS_FLOW[selected.status] ?? []).length === 0 && selected.status !== 'PENDING_PAYMENT' && (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Bu status üçün növbəti addım yoxdur.
              </p>
            )}

            <button onClick={() => setSelected(null)} style={btnSecondary}>Bağla</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)' }}>Yüklənir…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Kod', 'Müştəri', 'Telefon', 'Zona', 'Məbləğ', 'Ödəniş', 'Status', 'Tarix', 'Çatdırılma', ''].map((h, index, headers) => (
                  <th
                    key={`${h || 'actions'}-${index}`}
                    style={{ padding: '0.75rem 1rem', textAlign: index === headers.length - 1 ? 'right' : 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>#{order.code}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{order.customerName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{order.customerPhone}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.zone.name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{order.total.toFixed(0)} ₼</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Online
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: 20,
                      background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status],
                      whiteSpace: 'nowrap',
                    }}>
                      {STATUS_FILTER_OPTIONS.find(s => s.value === order.status)?.label ?? order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(order.createdAt).toLocaleDateString('az-AZ')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {order.scheduledDate ? (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                        📅 {new Date(order.scheduledDate).toLocaleDateString('az-AZ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setSelected(order)} style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                      Detallar
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sifariş yoxdur</td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Səhifə {page} / {totalPages} · Cəmi {data?.total ?? 0}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={btnSecondary}>Əvvəlki</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={btnSecondary}>Növbəti</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: '0.7rem 1.25rem', borderRadius: 10, border: '1px solid var(--color-border)',
  background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '2rem', width: '100%',
  maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 60px rgba(0,0,0,0.15)',
};
