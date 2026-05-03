'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Ödəniş Olundu',
  CANCELLED: 'Ləğv edildi',
  DELIVERED: 'Çatdırıldı',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: '#f0fdf4', text: '#16a34a' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626' },
  DELIVERED: { bg: '#eff6ff', text: '#2563eb' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Bütün sifarişlər' },
  { value: 'CONFIRMED', label: 'Ödəniş Olundu' },
  { value: 'DELIVERED', label: 'Çatdırıldı' },
  { value: 'CANCELLED', label: 'Ləğv edildi' },
];

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

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.5 7.5L6 11L12.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 4.5L7.5 2L13 4.5V10.5L7.5 13L2 10.5V4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7.5 2V13M2 4.5L7.5 7L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      // Never show PENDING_PAYMENT in admin
      if (filterStatus) {
        params.set('status', filterStatus);
      } else {
        params.set('excludeStatus', 'PENDING_PAYMENT');
      }
      const res = await api.get(`/api/orders?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 15_000,
  });
  const orders = data?.orders ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/orders/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status yeniləndi');
      // keep modal open with updated status
      setSelected(prev => prev ? { ...prev, status: vars.status } : null);
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600 }}>Sifarişlər</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {STATUS_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterStatus(opt.value); setPage(1); }}
              style={{
                padding: '0.5rem 1rem', borderRadius: 20, border: '1px solid var(--color-border)',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: filterStatus === opt.value ? 'var(--color-text)' : '#fff',
                color: filterStatus === opt.value ? '#fff' : 'var(--color-text)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div style={modalBox}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  Sifariş #{selected.code}
                </p>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selected.customerName}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {STATUS_COLORS[selected.status] && (
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: 20,
                    background: STATUS_COLORS[selected.status].bg,
                    color: STATUS_COLORS[selected.status].text,
                  }}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </span>
                )}
                <button
                  onClick={() => setSelected(null)}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
                >
                  <IconX />
                </button>
              </div>
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={infoCard}>
                <p style={infoLabel}>Telefon</p>
                <p style={infoValue}>{selected.customerPhone}</p>
              </div>
              <div style={infoCard}>
                <p style={infoLabel}>Zona</p>
                <p style={infoValue}>{selected.zone?.name ?? '—'}</p>
              </div>
              <div style={{ ...infoCard, gridColumn: '1 / -1' }}>
                <p style={infoLabel}>Ünvan</p>
                <p style={infoValue}>{selected.address}</p>
              </div>
              {selected.scheduledDate && (
                <div style={{ ...infoCard, gridColumn: '1 / -1' }}>
                  <p style={infoLabel}>Çatdırılma tarixi</p>
                  <p style={{ ...infoValue, color: '#7c3aed', fontWeight: 600 }}>
                    {new Date(selected.scheduledDate).toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              )}
              {selected.note && (
                <div style={{ ...infoCard, gridColumn: '1 / -1' }}>
                  <p style={infoLabel}>Qeyd</p>
                  <p style={infoValue}>{selected.note}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              {selected.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', padding: '0.75rem 1rem', borderBottom: i < selected.items.length - 1 ? '1px solid var(--color-border)' : 'none', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.1rem' }}>{item.product.name}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>× {item.quantity}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, flexShrink: 0 }}>{(item.price * item.quantity).toFixed(0)} ₼</p>
                </div>
              ))}
              <div style={{ padding: '0.75rem 1rem', background: '#fafafa', borderTop: '1px solid var(--color-border)' }}>
                {selected.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16a34a', marginBottom: '0.4rem' }}>
                    <span>Endirim {selected.promoCode ? `(${selected.promoCode.code})` : ''}</span>
                    <span>−{selected.discountAmount.toFixed(2)} ₼</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>Cəmi</span>
                  <span style={{ color: 'var(--color-accent-strong)' }}>{selected.total.toFixed(2)} ₼</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selected.status === 'CONFIRMED' && (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => statusMutation.mutate({ id: selected.id, status: 'DELIVERED' })}
                  disabled={statusMutation.isPending}
                  style={actionBtn.primary}
                >
                  <IconBox />
                  Çatdırıldı
                </button>
                <button
                  onClick={() => statusMutation.mutate({ id: selected.id, status: 'CANCELLED' })}
                  disabled={statusMutation.isPending}
                  style={actionBtn.danger}
                >
                  <IconX />
                  Ləğv et
                </button>
              </div>
            )}
            {selected.status === 'DELIVERED' && (
              <p style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>Sifariş çatdırılıb.</p>
            )}
            {selected.status === 'CANCELLED' && (
              <p style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>Sifariş ləğv edilib.</p>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Yüklənir…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Kod', 'Müştəri', 'Telefon', 'Zona', 'Məbləğ', 'Status', 'Tarix', 'Çatdırılma', ''].map((h, i, arr) => (
                  <th key={`${h}-${i}`} style={{ padding: '0.75rem 1rem', textAlign: i === arr.length - 1 ? 'right' : 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}>#{order.code}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{order.customerName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{order.customerPhone}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.zone?.name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 700 }}>{order.total.toFixed(0)} ₼</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {STATUS_COLORS[order.status] ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: 20,
                        background: STATUS_COLORS[order.status].bg,
                        color: STATUS_COLORS[order.status].text,
                        whiteSpace: 'nowrap',
                      }}>
                        {order.status === 'CONFIRMED' && <IconCheck />}
                        {order.status === 'DELIVERED' && <IconBox />}
                        {order.status === 'CANCELLED' && <IconX />}
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(order.createdAt).toLocaleDateString('az-AZ')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {order.scheduledDate ? (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                        {new Date(order.scheduledDate).toLocaleDateString('az-AZ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelected(order)}
                      style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Detallar
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sifariş yoxdur</td></tr>
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

const infoCard: React.CSSProperties = {
  background: '#fafafa', borderRadius: 10, padding: '0.6rem 0.85rem',
  border: '1px solid var(--color-border)',
};
const infoLabel: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.2rem',
};
const infoValue: React.CSSProperties = {
  fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)',
};
const actionBtn = {
  primary: {
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.65rem 1.1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600,
    background: '#1d1d1f', color: '#fff', flex: 1, justifyContent: 'center',
  } as React.CSSProperties,
  danger: {
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.65rem 1.1rem', borderRadius: 10, border: '1px solid #fecaca', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600,
    background: '#fef2f2', color: '#dc2626', flex: 1, justifyContent: 'center',
  } as React.CSSProperties,
};
const btnSecondary: React.CSSProperties = {
  padding: '0.7rem 1.25rem', borderRadius: 10, border: '1px solid var(--color-border)',
  background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  backdropFilter: 'blur(2px)',
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '1.75rem', width: '100%',
  maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};
