'use client';

import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

const OVERLAY_COLORS: Record<string, string> = {
  '/':      '#ffc2d1',
  '/shop':  '#d1f5dd',
};

function getOverlayColor(pathname: string): string {
  if (pathname.startsWith('/product')) return '#fff8f5';
  return OVERLAY_COLORS[pathname] ?? '#ffc2d1';
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef<string | null>(null);
  const pathname    = usePathname();
  const isAdmin     = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;

    const overlay = overlayRef.current;
    if (!overlay || prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    overlay.style.backgroundColor = getOverlayColor(pathname);

    gsap.killTweensOf(overlay);
    gsap.fromTo(
      overlay,
      { scaleX: 1, transformOrigin: 'left center' },
      { scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'power3.inOut' }
    );
  }, [pathname]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-page-transition)',
          backgroundColor: getOverlayColor(pathname),
          pointerEvents: 'none',
          transform: 'scaleX(0)',
          transformOrigin: 'left center',
        }}
      />
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}
