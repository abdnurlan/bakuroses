'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { SimpleNav } from './SimpleNav';
import { PremiumCursor } from './PremiumCursor';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { FloatingCartButton } from '@/features/cart/FloatingCartButton';

const SIMPLE_NAV_PATHS = ['/shop', '/order', '/track'];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isSimple = SIMPLE_NAV_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <>
      {!isAdmin && (
        <>
          {isSimple ? <SimpleNav /> : <Navbar />}
          <PremiumCursor />
          <CartDrawer />
          <FloatingCartButton />
        </>
      )}
      {children}
    </>
  );
}
