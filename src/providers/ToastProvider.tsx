'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          borderRadius: '12px',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        },
      }}
    />
  );
}
