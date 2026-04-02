'use client';

import { useEffect } from 'react';
import { getLenis, destroyLenis } from '@/shared/lib/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = getLenis();
    const syncScrollTrigger = () => ScrollTrigger.update();
    const rafCallback = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', syncScrollTrigger);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(rafCallback);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
