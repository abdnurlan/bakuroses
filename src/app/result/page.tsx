'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ClockIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#fffbf0" />
      <circle cx="32" cy="32" r="24" fill="#fdefc8" />
      <circle cx="32" cy="32" r="10" stroke="#c8960a" strokeWidth="2.5" />
      <path d="M32 26v6l4 2.5" stroke="#c8960a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#f0faf4" />
      <circle cx="32" cy="32" r="24" fill="#d6f5e3" />
      <path
        d="M20 33l8 8 16-16"
        stroke="#3a9c6a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function ResultContent() {
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const isSuccess = status === '1' || status === 'success';

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
          {isSuccess ? <CheckIcon /> : <ClockIcon />}
        </div>

        <p style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isSuccess ? '#3a9c6a' : '#c8960a',
          marginBottom: '0.6rem',
        }}>
          {isSuccess ? 'Ödəniş Uğurlu' : 'Yoxlanılır'}
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.9rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.85rem',
          lineHeight: 1.2,
        }}>
          {isSuccess ? 'Ödəniş Təsdiqləndi' : 'Nəticə Gözlənilir'}
        </h1>

        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.65,
          marginBottom: '2.25rem',
        }}>
          {isSuccess
            ? 'Ödənişiniz qəbul edildi. Sifarişiniz hazırlanmağa başlayacaq.'
            : 'Ödəniş nəticəsi yoxlanılır. Bir neçə dəqiqə gözləyin.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Link
            href="/"
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

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
