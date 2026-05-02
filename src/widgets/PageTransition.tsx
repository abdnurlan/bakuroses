'use client';

import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

// Matches the last segment(s) of the locale-prefixed path e.g. /az/shop → /shop
function getOverlayColor(pathname: string): string {
  const bare = pathname.replace(/^\/(az|en|ru)/, '') || '/';
  if (bare.startsWith('/shop')) return '#d1f5dd';
  if (bare.startsWith('/product')) return '#fff8f5';
  return '#ffc2d1';
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef<string | null>(null);
  const pathname    = usePathname();
  const isAdmin     = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;

    const overlay = overlayRef.current;
    // Skip the very first mount — no wipe on initial page load
    if (!overlay || prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current === pathname) return;
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
