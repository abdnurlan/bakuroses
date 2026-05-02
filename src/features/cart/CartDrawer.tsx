'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ShoppingCart } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/shared/store';
import { EASE, DURATION } from '@/lib/animation-tokens';
import { useLang } from '@/providers/LanguageProvider';
import { useLocalePath } from '@/hooks/useLocalePath';


export function CartDrawer() {
  const drawerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const lp = useLocalePath();

  const ui = useAppStore((s) => s.ui);
  const cartItems = useAppStore((s) => s.cartItems);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const setUI = useAppStore((s) => s.setUI);
  const totalCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  useGSAP(
    () => {
      if (ui.isCartOpen) {
        gsap.to(drawerRef.current, {
          x: 0,
          duration: DURATION.slow,
          ease: 'power4.out',
          delay: 0.05,
        });

        if (itemsRef.current) {
          const items = itemsRef.current.querySelectorAll<HTMLElement>('[data-cart-item]');
          gsap.fromTo(
            items,
            { opacity: 0, x: 16 },
            {
              opacity: 1,
              x: 0,
              duration: DURATION.fast,
              stagger: 0.06,
              delay: DURATION.slow * 0.6,
              ease: 'power2.out',
            }
          );
        }
      } else {
        gsap.to(drawerRef.current, {
          x: '100%',
          duration: DURATION.normal,
          ease: 'power3.in',
        });
      }
    },
    { scope: drawerRef, dependencies: [ui.isCartOpen] }
  );

  return (
    <>
      <AnimatePresence>
        {ui.isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.normal }}
            onClick={() => setUI({ isCartOpen: false })}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-cart-overlay)',
              backgroundColor: 'rgba(44,44,44,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          />
        )}
      </AnimatePresence>

      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '100%',
          maxWidth: '420px',
          zIndex: 'var(--z-cart-drawer)',
          backgroundColor: 'var(--color-background)',
          boxShadow: '-12px 0 48px rgba(54,44,36,0.12)',
          transform: 'translateX(100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.75rem 2rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2
            className="font-display"
            style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1 }}
          >
            {t('cart_title')}
            {cartItems.length > 0 && (
              <span style={{ fontSize: '1rem', marginLeft: '0.5rem', color: 'var(--color-text-soft)' }}>
                ({totalCount})
              </span>
            )}
          </h2>
          <button
            onClick={() => setUI({ isCartOpen: false })}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent-strong)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            {t('cart_close')}
          </button>
        </div>

        <div ref={itemsRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
          {cartItems.length === 0 ? (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-soft)',
                marginTop: '4rem',
                textAlign: 'center',
                letterSpacing: '0.08em',
              }}
            >
              {t('cart_empty')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.product.id}
                    data-cart-item
                    layout
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: DURATION.fast, ease: EASE.snappy }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p
                        className="font-display"
                        style={{ fontSize: '1.1rem', color: 'var(--color-text)', fontWeight: 500 }}
                      >
                        {item.product.name}
                      </p>
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--color-text-muted)',
                          marginTop: '0.2rem',
                        }}
                      >
                        Say {item.quantity} · {(item.product.price * item.quantity).toFixed(0)} ₼
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.68rem',
                        color: 'var(--color-text-soft)',
                        letterSpacing: '0.12em',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent-strong)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-soft)'; }}
                    >
                      {t('cart_delete')}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{t('cart_total')}</span>
            <span className="font-display" style={{ fontSize: '2rem', color: 'var(--color-text)', fontWeight: 600 }}>
              {totalAmount.toFixed(0)} ₼
            </span>
          </div>
          <Link
            href={lp('/order')}
            onClick={() => setUI({ isCartOpen: false })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              width: '100%',
              padding: '0.85rem',
              marginBottom: '0.6rem',
              background: 'rgba(139, 151, 112, 0.12)',
              color: 'var(--color-text)',
              border: '1px solid rgba(139, 151, 112, 0.28)',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.2s',
              boxSizing: 'border-box',
            }}
          >
            <ShoppingCart size={16} weight="duotone" />
            {t('cart_order_online')}
          </Link>

        </div>
      </div>
    </>
  );
}
