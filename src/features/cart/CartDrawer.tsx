'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { CalendarDots, ShoppingCart, WhatsappLogo } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/shared/store';
import { EASE, DURATION } from '@/lib/animation-tokens';
import { useLang } from '@/providers/LanguageProvider';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') ?? '';
const MONTHS_AZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avqust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

export function CartDrawer() {
  const drawerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [dateError, setDateError] = useState('');
  const { t } = useLang();

  const ui = useAppStore((s) => s.ui);
  const cartItems = useAppStore((s) => s.cartItems);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const setUI = useAppStore((s) => s.setUI);
  const totalCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const minDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  }, []);

  const whatsappMessage = useMemo(() => {
    if (!deliveryDate || cartItems.length === 0) {
      return '';
    }

    const [year, month, day] = deliveryDate.split('-');
    const monthLabel = MONTHS_AZ[Number(month) - 1];
    const formattedDate = monthLabel ? `${Number(day)} ${monthLabel} ${year}` : deliveryDate;

    const lines = cartItems.map(
      (item) =>
        `- ${item.product.name} x${item.quantity} — ${(item.product.price * item.quantity).toFixed(0)} ₼`
    );

    return [
      t('cart_whatsapp_greeting'),
      '',
      `${t('cart_whatsapp_date')} ${formattedDate}`,
      '',
      t('cart_whatsapp_items'),
      ...lines,
      '',
      `${t('cart_whatsapp_total')} ${totalAmount.toFixed(0)} ₼`,
    ].join('\n');
  }, [cartItems, deliveryDate, totalAmount]);

  const handleWhatsAppCheckout = () => {
    if (!deliveryDate) {
      setDateError(t('cart_date_warning'));
      return;
    }

    setDateError('');

    const encodedText = encodeURIComponent(whatsappMessage);
    const url = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
            onClick={() => {
              setDateError('');
              setUI({ isCartOpen: false });
            }}
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
            onClick={() => {
              setDateError('');
              setUI({ isCartOpen: false });
            }}
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
          <div
            style={{
              padding: '1rem 1rem 1.1rem',
              borderRadius: '18px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,242,246,0.82) 100%)',
              border: '1px solid rgba(207, 111, 148, 0.14)',
              marginBottom: '1.2rem',
            }}
          >
            <label
              htmlFor="delivery-date"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                marginBottom: '0.75rem',
              }}
            >
              <CalendarDots size={16} weight="duotone" style={{ color: 'var(--color-accent)' }} />
              {t('cart_date_label')}
            </label>

            <input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              min={minDate}
              onChange={(event) => {
                setDeliveryDate(event.target.value);
                setDateError('');
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                border: '1px solid rgba(139, 151, 112, 0.22)',
                background: 'rgba(255, 255, 255, 0.84)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />

            <p
              style={{
                margin: '0.65rem 0 0',
                fontSize: '0.78rem',
                color: dateError ? '#b24d68' : 'var(--color-text-soft)',
                lineHeight: 1.6,
              }}
            >
              {dateError || t('cart_date_hint')}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{t('cart_total')}</span>
            <span className="font-display" style={{ fontSize: '2rem', color: 'var(--color-text)', fontWeight: 600 }}>
              {totalAmount.toFixed(0)} ₼
            </span>
          </div>
          <Link
            href="/order"
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

          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: DURATION.instant }}
            onClick={handleWhatsAppCheckout}
            disabled={cartItems.length === 0}
            style={{
              width: '100%',
              padding: '1rem',
              background: cartItems.length === 0 ? 'rgba(139, 151, 112, 0.35)' : 'var(--color-accent-strong)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
            }}
            onMouseEnter={(e) => {
              if (cartItems.length > 0) {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (cartItems.length > 0) {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-strong)';
              }
            }}
          >
            <WhatsappLogo size={18} weight="fill" />
            {t('cart_order_whatsapp')}
          </motion.button>
        </div>
      </div>
    </>
  );
}
