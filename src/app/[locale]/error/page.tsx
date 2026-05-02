'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useLocalePath } from '@/hooks/useLocalePath';

function XIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#fff5f5" />
      <circle cx="32" cy="32" r="24" fill="#ffd6d6" />
      <path
        d="M23 23l18 18M41 23L23 41"
        stroke="#c0392b"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 7L7.5 1.5 13.5 7v6.5h-4V10h-4v3.5h-4V7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorContent() {
  const lp = useLocalePath();
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-background)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '3.5rem 3rem',
        maxWidth: 460,
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <XIcon />
        </div>

        <p style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#c0392b',
          marginBottom: '0.6rem',
        }}>
          Ödəniş Uğursuz
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.9rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.85rem',
          lineHeight: 1.2,
        }}>
          Ödəniş Tamamlanmadı
        </h1>

        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.65,
          marginBottom: '2.25rem',
        }}>
          Ödəniş zamanı xəta baş verdi. Yenidən cəhd edə bilərsiniz.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Link
            href={lp('/order')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              padding: '0.85rem 2rem',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            <RefreshIcon />
            Yenidən Sifariş Ver
          </Link>

          <Link
            href={lp('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              color: 'var(--color-text-muted)',
              fontSize: '0.88rem',
              textDecoration: 'none',
              padding: '0.6rem',
            }}
          >
            <HomeIcon />
            Ana Səhifəyə Qayıt
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
