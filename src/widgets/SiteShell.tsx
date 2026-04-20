'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { FloatingCartButton } from '@/features/cart/FloatingCartButton';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && (
        <>
          <Navbar />
          <CartDrawer />
          <FloatingCartButton />
        </>
      )}
      {children}
    </>
  );
}
