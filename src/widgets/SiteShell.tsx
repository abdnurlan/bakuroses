'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { PremiumCursor } from './PremiumCursor';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { FloatingCartButton } from '@/features/cart/FloatingCartButton';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const showNavbar = pathname === '/v2' || pathname.startsWith('/v2/');

  return (
    <>
      {showNavbar && <Navbar />}
      {!isAdmin && (
        <>
          <PremiumCursor />
          <CartDrawer />
          <FloatingCartButton />
        </>
      )}
      {children}
    </>
  );
}
