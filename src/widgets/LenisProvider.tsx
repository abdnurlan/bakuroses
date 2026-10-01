'use client';

import { useEffect } from 'react';
import { getLenis, destroyLenis } from '@/shared/lib/lenis';
import { gsap } from 'gsap';
import { ensureScrollTrigger } from '@/shared/lib/scrollTrigger';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ScrollTrigger = ensureScrollTrigger();
    const lenis = getLenis();
    const syncScrollTrigger = () => ScrollTrigger.update();
    const rafCallback = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', syncScrollTrigger);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    // No refresh() here: registering already enabled ScrollTrigger, and each
    // trigger refreshes itself on creation. Calling it during mount only buys
    // an extra forced layout while hydration is still finishing.

    return () => {
      lenis.off('scroll', syncScrollTrigger);
      gsap.ticker.remove(rafCallback);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
