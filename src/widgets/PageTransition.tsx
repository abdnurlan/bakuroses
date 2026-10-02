'use client';

import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

    for (const running of overlay.getAnimations()) running.cancel();
    // WAAPI runs on the compositor: the wipe stays smooth while the new page hydrates
    overlay.animate(
      [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
      { duration: 700, easing: 'cubic-bezier(0.76, 0, 0.24, 1)' },
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
