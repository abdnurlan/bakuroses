'use client';

import { useEffect, useState } from 'react';
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
  deliveryFor?: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
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

// Node's az-AZ ICU data renders months as "M08", so format them by hand
const AZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];

function azDate(value: string | Date) {
  const d = new Date(value);
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function azDateTime(value: string | Date) {
  const d = new Date(value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

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

function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12.5 9.9v1.9a1.3 1.3 0 0 1-1.4 1.3 12.8 12.8 0 0 1-5.6-2 12.6 12.6 0 0 1-3.9-3.9 12.8 12.8 0 0 1-2-5.6A1.3 1.3 0 0 1 .9 0h1.9a1.3 1.3 0 0 1 1.3 1.1c.1.7.2 1.3.5 1.9a1.3 1.3 0 0 1-.3 1.4l-.8.8a10.4 10.4 0 0 0 3.9 3.9l.8-.8a1.3 1.3 0 0 1 1.4-.3c.6.2 1.2.4 1.9.5a1.3 1.3 0 0 1 1.1 1.4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11.7 7v5.8H2.3V7M13 4.1H1v2.9h12V4.1ZM7 12.8V4.1M7 4.1H4.4a1.5 1.5 0 1 1 0-2.9C6.4 1.2 7 4.1 7 4.1ZM7 4.1h2.6a1.5 1.5 0 1 0 0-2.9C7.6 1.2 7 4.1 7 4.1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconZoom() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10.5 10.5 14 14M7 5.2v3.6M5.2 7h3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

/** Name + tappable phone. `tone` switches between the buyer and recipient cards. */
function PersonCard({ role, name, phone, tone }: {
  role: string; name: string; phone?: string | null; tone: 'buyer' | 'recipient';
}) {
  const accent = tone === 'recipient' ? '#7c3aed' : 'var(--color-text)';
  return (
    <div style={{
      background: tone === 'recipient' ? '#faf7ff' : '#fafafa',
      border: `1px solid ${tone === 'recipient' ? '#e9deff' : 'var(--color-border)'}`,
      borderRadius: 12, padding: '0.8rem 0.9rem',
    }}>
      <p style={{ ...infoLabel, color: accent, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {tone === 'recipient' && <IconGift />}
        {role}
      </p>
      <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: phone ? '0.4rem' : 0 }}>
        {name || '—'}
      </p>
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.85rem', fontWeight: 600, color: accent,
            textDecoration: 'none', direction: 'ltr',
          }}
        >
          <IconPhone />
          {phone}
        </a>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Esc closes the zoom first, then the detail modal
  useEffect(() => {
    if (!selected && !zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (zoomed) setZoomed(null);
      else setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, zoomed]);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/api/orders?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 15_000,
  });
  const orders = data?.orders ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  // Older orders predate the deliveryFor column, so fall back to the recipient fields
  const isGift = selected?.deliveryFor === 'gift'
    || Boolean(selected?.recipientName || selected?.recipientPhone);

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
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>#{selected.code}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {azDateTime(selected.createdAt)}
                  {isGift && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#7c3aed', fontWeight: 700 }}>
                      <IconGift />
                      Hədiyyə
                    </span>
                  )}
                </p>
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

            {/* Who ordered / who receives */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isGift ? '1fr 1fr' : '1fr',
              gap: '0.6rem', marginBottom: '0.6rem',
            }}>
              <PersonCard
                role={isGift ? 'Sifarişçi' : 'Müştəri'}
                name={selected.customerName}
                phone={selected.customerPhone}
                tone="buyer"
              />
              {isGift && (
                <PersonCard
                  role="Alıcı"
                  name={selected.recipientName ?? ''}
                  phone={selected.recipientPhone}
                  tone="recipient"
                />
              )}
            </div>

            {/* Delivery details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={infoCard}>
                <p style={infoLabel}>Zona</p>
                <p style={infoValue}>{selected.zone?.name ?? '—'}</p>
              </div>
              <div style={infoCard}>
                <p style={infoLabel}>Çatdırılma tarixi</p>
                <p style={{ ...infoValue, color: selected.scheduledDate ? '#7c3aed' : undefined, fontWeight: selected.scheduledDate ? 600 : 500 }}>
                  {selected.scheduledDate ? azDate(selected.scheduledDate) : '—'}
                </p>
              </div>
              <div style={{ ...infoCard, gridColumn: '1 / -1' }}>
                <p style={infoLabel}>Ünvan</p>
                <p style={infoValue}>{selected.address}</p>
              </div>
              {selected.note && (
                <div style={{ ...infoCard, gridColumn: '1 / -1', background: '#fffdf5', borderColor: '#f3e6c0' }}>
                  <p style={infoLabel}>Qeyd</p>
                  <p style={{ ...infoValue, fontStyle: 'italic' }}>{selected.note}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: '1.25rem' }}>
              {selected.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', padding: '0.85rem 1rem', borderBottom: i < selected.items.length - 1 ? '1px solid var(--color-border)' : 'none', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => setZoomed({ src: item.product.imageUrl, alt: item.product.name })}
                      title="Böyütmək üçün klikləyin"
                      style={thumbButton}
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <span style={thumbZoomBadge}><IconZoom /></span>
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.15rem' }}>{item.product.name}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {item.quantity} × {item.price.toFixed(0)} ₼
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}>{(item.price * item.quantity).toFixed(0)} ₼</p>
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

      {/* Full-size image */}
      {zoomed && (
        <div style={zoomOverlay} onClick={() => setZoomed(null)}>
          <button onClick={() => setZoomed(null)} style={zoomCloseBtn} aria-label="Bağla">
            <IconX />
          </button>
          <img
            src={zoomed.src}
            alt={zoomed.alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(92vw, 900px)', maxHeight: '82vh',
              objectFit: 'contain', borderRadius: 12,
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          />
          <p style={{ marginTop: '1rem', color: '#fff', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', maxWidth: '90vw' }}>
            {zoomed.alt}
          </p>
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
  maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};
const thumbButton: React.CSSProperties = {
  position: 'relative', width: 132, height: 132, flexShrink: 0,
  borderRadius: 14, overflow: 'hidden', padding: 0,
  border: '1px solid var(--color-border)', background: '#fff',
  cursor: 'zoom-in', display: 'block',
};
const thumbZoomBadge: React.CSSProperties = {
  position: 'absolute', right: 6, bottom: 6,
  width: 28, height: 28, borderRadius: 8,
  background: 'rgba(0,0,0,0.55)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const zoomOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  zIndex: 300, cursor: 'zoom-out', padding: '2rem',
};
const zoomCloseBtn: React.CSSProperties = {
  position: 'absolute', top: 20, right: 20,
  width: 40, height: 40, borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)',
  color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
