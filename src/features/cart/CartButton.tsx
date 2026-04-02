'use client';

import { ShoppingBagOpen } from '@phosphor-icons/react';
import { useAppStore } from '@/shared/store';
import { cn } from '@/shared/lib/cn';

export function CartButton({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const cartItems = useAppStore((s) => s.cartItems);
  const setUI = useAppStore((s) => s.setUI);
  const count = cartItems.reduce((n, i) => n + i.quantity, 0);

  return (
    <button
      type="button"
      onClick={() => {
        setUI({ isCartOpen: true });
        onClick?.();
      }}
      className={cn('site-nav-action', className)}
      style={{
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        transition: 'color 0.2s',
        padding: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
    >
      <span className="site-nav-action-inner">
        <span className="site-nav-action-icon">
          <ShoppingBagOpen size={16} weight="duotone" />
        </span>
        <span>Səbət</span>
      </span>
      {count > 0 && (
        <span className="site-cart-badge">
          {count}
        </span>
      )}
    </button>
  );
}
