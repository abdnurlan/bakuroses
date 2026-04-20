'use client';

import { useAppStore } from '@/shared/store';
import { useLang } from '@/providers/LanguageProvider';
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
  const { t } = useLang();
  const count = cartItems.reduce((n, i) => n + i.quantity, 0);

  return (
    <button
      type="button"
      onClick={() => {
        setUI({ isCartOpen: true });
        onClick?.();
      }}
      className={cn('cart-btn', className)}
    >
      <span>{t('nav_cart')}</span>
      {count > 0 && (
        <span className="site-cart-badge">{count}</span>
      )}
    </button>
  );
}
