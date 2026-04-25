'use client';

import Link from 'next/link';
import { CaretLeft } from '@phosphor-icons/react';
import { CartButton } from '@/features/cart/CartButton';

export function SimpleNav({ backHref = '/' }: { backHref?: string }) {
  return (
    <nav className="simple-nav">
      <Link href={backHref} className="simple-nav__back">
        <CaretLeft size={15} weight="bold" />
        <img src="/logo.avif" alt="Baku Roses" width={34} height={34} className="simple-nav__logo" />
        <span className="simple-nav__brand">Baku Roses</span>
      </Link>
      <CartButton className="bk-navbar__cta" />
    </nav>
  );
}
