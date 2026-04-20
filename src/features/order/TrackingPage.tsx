'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '@/api/orders';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { StatusStepper } from './StatusStepper';
import { DeliveryMap } from './DeliveryMap';
import { useLang } from '@/providers/LanguageProvider';

interface TrackingPageProps {
  orderId: string;
}

export function TrackingPage({ orderId }: TrackingPageProps) {
  const { status, courierLocation } = useOrderTracking(orderId);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: 30_000,
  });

  const { t } = useLang();
  const currentStatus = status ?? order?.status ?? null;
  const isOnTheWay = currentStatus === 'ON_THE_WAY';

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', fontSize: '0.875rem' }}>{t('track_loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#b24d68', fontSize: '0.875rem' }}>{t('track_not_found')}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        {t('track_title')}
      </p>

      <h1
        className="font-display"
        style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}
      >
        #{order.code}
      </h1>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-soft)', marginBottom: '1.5rem' }}>
        {order.customerName} · {order.customerPhone}
      </p>

      <StatusStepper current={currentStatus} />

      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 12,
          background: 'rgba(207,111,148,0.06)',
          border: '1px solid rgba(207,111,148,0.12)',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          {t('track_details')}
        </p>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.4rem 0',
              borderBottom: '1px solid rgba(207,111,148,0.1)',
              fontSize: '0.9rem',
            }}
          >
            <span>{item.product.name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toFixed(0)} ₼</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontWeight: 700, fontSize: '1rem' }}>
          <span>{t('track_total')}</span>
          <span style={{ color: 'var(--color-accent-strong)' }}>{order.total.toFixed(0)} ₼</span>
        </div>
      </div>

      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderRadius: 12,
          background: 'rgba(139,151,112,0.06)',
          border: '1px solid rgba(139,151,112,0.14)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-soft)',
        }}
      >
        📍 {order.address}
        {order.note && <> · <em>{order.note}</em></>}
      </div>

      {isOnTheWay && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            {t('track_live')}
          </p>
          <DeliveryMap
            destination={[order.lat, order.lng]}
            courierLocation={courierLocation}
          />
        </div>
      )}
    </div>
  );
}
