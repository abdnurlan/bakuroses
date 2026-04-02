'use client';

import { useEffect, useState } from 'react';
import { ShoppingBagOpen } from '@phosphor-icons/react';
import { useAppStore } from '@/shared/store';

export function FloatingCartButton() {
  const [visible, setVisible] = useState(false);
  const cartItems = useAppStore((s) => s.cartItems);
  const ui = useAppStore((s) => s.ui);
  const setUI = useAppStore((s) => s.setUI);
  const count = cartItems.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    const updateVisibility = () => {
      const threshold = window.innerWidth <= 768 ? 180 : 520;
      setVisible(window.scrollY > threshold);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={count > 0 ? `Səbət, ${count} məhsul` : 'Səbəti aç'}
      className={`floating-cart-trigger${visible && !ui.isCartOpen ? ' is-visible' : ''}`}
      onClick={() => setUI({ isCartOpen: true })}
    >
      <ShoppingBagOpen size={22} weight="fill" />
      {count > 0 ? <span className="floating-cart-badge">{count}</span> : null}
    </button>
  );
}
