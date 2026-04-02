'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, DURATION } from '@/lib/animation-tokens';

// Color per route
const OVERLAY_COLORS: Record<string, string> = {
  '/':         '#ffc2d1',
  '/shop':     '#d1f5dd',
};

function getOverlayColor(pathname: string): string {
  if (pathname.startsWith('/product')) return '#fff8f5';
  return OVERLAY_COLORS[pathname] ?? '#ffc2d1';
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname   = usePathname();

  // GSAP curtain — plays on every route change
  useGSAP(
    () => {
      const overlay = overlayRef.current;
      if (!overlay) return;

      const tl = gsap.timeline();
      tl.fromTo(
        overlay,
        { scaleX: 1, transformOrigin: 'left center' },
        {
          scaleX:   0,
          duration: DURATION.slow,
          ease:     'power3.inOut',
        }
      );
      return () => { tl.kill(); };
    },
    { scope: overlayRef, dependencies: [pathname] }
  );

  return (
    <>
      {/* GSAP overlay curtain */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-page-transition)',
          backgroundColor: getOverlayColor(pathname),
          pointerEvents: 'none',
          transformOrigin: 'left center',
        }}
      />

      {/* Framer Motion page content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ position: 'relative', minHeight: '100vh' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
