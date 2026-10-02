'use client';

import { useEffect } from 'react';
import 'lenis/dist/lenis.css';
import { createLenis, destroyLenis } from '@/shared/lib/lenis';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    createLenis();
    return () => destroyLenis();
  }, []);

  return <>{children}</>;
}
