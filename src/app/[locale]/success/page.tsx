'use client';

import Script from 'next/script';
import Link from 'next/link';
import { House } from '@phosphor-icons/react';
import { DeliverySuccessOverlay } from '@/features/order/DeliverySuccessOverlay';
import { useLocalePath } from '@/hooks/useLocalePath';

export default function SuccessPage() {
  const lp = useLocalePath();
  return (
    <>
      <Script id="ga-conversion" strategy="afterInteractive">
        {`gtag('event', 'conversion', {'send_to': 'AW-11557624631/vpItCMGo2ZwaELe2jYcr'});`}
      </Script>
    <main
      className="order-success-page"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        background: 'var(--color-background)',
      }}
    >
      <DeliverySuccessOverlay />

      <Link
        href={lp('/')}
        className="order-success-home"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'max(2rem, env(safe-area-inset-bottom))',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: 48,
          padding: '0.85rem 1.25rem',
          borderRadius: 999,
          border: '1px solid rgba(207, 111, 148, 0.22)',
          background: 'rgba(255, 255, 255, 0.9)',
          color: 'var(--color-accent)',
          fontSize: '0.9rem',
          fontWeight: 750,
          textDecoration: 'none',
          boxShadow: '0 14px 34px rgba(162, 121, 139, 0.16)',
          transform: 'translateX(-50%)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <House size={18} weight="duotone" />
        Ana səhifəyə qayıt
      </Link>
    </main>
    </>
  );
}
