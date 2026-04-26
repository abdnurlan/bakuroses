'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CaretDown, CreditCard, Money, ShoppingBagOpen, SpinnerGap, Tag } from '@phosphor-icons/react';
import { MapPicker } from './MapPicker';
import { checkCoverage, type Zone } from '@/api/zones';
import { createOrder, type OrderItem } from '@/api/orders';
import { validatePromoCode, type PromoValidateResult } from '@/api/promoCodes';
import { useAppStore } from '@/shared/store';

export function OrderForm() {
  const router = useRouter();
  const cartItems = useAppStore((s) => s.cartItems);
  const clearCart = useAppStore((s) => s.removeFromCart);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    lat: null as number | null,
    lng: null as number | null,
    paymentType: 'cash' as 'cash' | 'epoint',
  });
  const [zone, setZone] = useState<Zone | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoResult, setPromoResult] = useState<PromoValidateResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [stagedPin, setStagedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (mapModalOpen) {
      const y = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, y);
      };
    }
  }, [mapModalOpen, mounted]);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        cartItems.forEach((item) => clearCart(item.product.id));
        router.push(`/success?order_id=${data.orderId}`);
      }
    },
    onError: () => {
      toast.error('Sifariş zamanı xəta baş verdi. Yenidən cəhd edin.');
    },
  });

  const cartSubtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const items: OrderItem[] = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));
    if (items.length === 0) return;
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoInput.trim(), items);
      setPromoResult(result);
      toast.success(`Endirim tətbiq edildi: -${result.discountAmount.toFixed(2)} ₼`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Promokod etibarsızdır';
      toast.error(msg);
      setPromoResult(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleMapPin = async (lat: number, lng: number) => {
    setForm((f) => ({ ...f, lat, lng }));
    setStagedPin(null);
    setCoverageLoading(true);
    try {
      const result = await checkCoverage(lat, lng);
      if (result.covered && result.zone) {
        setZone(result.zone);
      } else {
        setZone(null);
        toast.error('Bu ünvana çatdırılma mövcud deyil.');
      }
    } catch {
      toast.error('Zona yoxlaması uğursuz oldu.');
    } finally {
      setCoverageLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!zone) {
      toast.error('Xəritədən çatdırılma ünvanı seçin.');
      return;
    }
    if (!form.name.trim()) { toast.error('Ad daxil edin.'); return; }
    if (!form.phone.trim()) { toast.error('Telefon nömrəsi daxil edin.'); return; }
    if (!form.address.trim()) { toast.error('Ünvan detallarını daxil edin.'); return; }

    const items: OrderItem[] = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      toast.error('Səbətiniz boşdur. Əvvəlcə məhsul seçin.');
      return;
    }

    mutation.mutate({
      name: form.name,
      phone: form.phone,
      address: form.address,
      lat: form.lat!,
      lng: form.lng!,
      note: form.note || undefined,
      items,
      paymentType: form.paymentType,
      zoneId: zone.id,
      promoCode: promoResult ? promoInput.trim() : undefined,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(139, 151, 112, 0.22)',
    background: 'rgba(255,255,255,0.84)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: '0.75rem',
  };

  return (
    <div className="order-layout">
      <section
        className="order-form-panel"
        aria-labelledby="order-title"
        data-lenis-prevent
        style={{ position: 'relative' }}
      >
        <div className="order-form-inner">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <p className="order-kicker" style={{ marginBottom: 0 }}>Online sifariş</p>
            <button
              onClick={() => router.back()}
              aria-label="Geri qayıt"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid var(--color-border)',
                background: 'rgba(255,255,255,0.8)',
                cursor: 'pointer', flexShrink: 0,
                color: 'var(--color-text-muted)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <h1 id="order-title" className="font-display order-title">
            Sifariş ver
          </h1>

          <p className="order-copy">
            Məlumatları doldurun və xəritədə çatdırılma nöqtəsini seçin.
          </p>

          {/* ── Mobile map thumbnail — only on small screens ── */}
          <div className="order-mobile-map-trigger">
            <button
              type="button"
              onClick={() => setMapModalOpen(true)}
              className="order-mobile-map-btn"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75c0 4.22 5.25 9.75 5.25 9.75s5.25-5.53 5.25-9.75C14.25 3.85 11.9 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="9" cy="6.75" r="1.75" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              {zone ? `${zone.name} seçildi — dəyişdir` : 'Xəritədən ünvan seç'}
            </button>
            {zone && (
              <span className="order-mobile-zone-badge">
                {zone.deliveryFee.toFixed(0)} ₼ çatdırılma
              </span>
            )}
          </div>

          {/* ── Mobile map fullscreen modal ── */}
          {mounted && mapModalOpen && createPortal(
            <div className="order-map-modal-overlay">
              <div className="order-map-modal">
                <div className="order-map-modal-header">
                  <span>Çatdırılma ünvanını seç</span>
                  <button
                    onClick={() => { setMapModalOpen(false); setStagedPin(null); }}
                    className="order-map-modal-close"
                    aria-label="Bağla"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="order-map-modal-body">
                  <MapPicker
                    className="order-map-modal-map"
                    onPin={handleMapPin}
                    confirmMode
                    onStage={(lat, lng) => setStagedPin({ lat, lng })}
                  />
                </div>

                <div className="order-map-modal-footer">
                  <p className="order-map-modal-hint">
                    {stagedPin ? 'Pin seçildi — aşağıdan təsdiqləyin' : 'Xəritəyə toxunub ünvan seçin'}
                  </p>
                  <button
                    className="order-map-modal-confirm"
                    disabled={!stagedPin}
                    onClick={() => {
                      if (stagedPin) {
                        handleMapPin(stagedPin.lat, stagedPin.lng);
                        setMapModalOpen(false);
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9.5l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Ünvanı təsdiqlə
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          <div className="order-map-status">
            {coverageLoading && <span>Zona yoxlanılır...</span>}
            {!coverageLoading && zone && (
              <span>
                {zone.name} - çatdırılma mövcuddur · {zone.deliveryFee.toFixed(0)} ₼
              </span>
            )}
            {!coverageLoading && !zone && <span>Xəritədən çatdırılma ünvanı seçilməyib</span>}
          </div>

          <input
            placeholder="Adınız"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Telefon (+994XXXXXXXXX)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Ünvan detalları (bina, mərtəbə, mənzil)"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            style={inputStyle}
          />
          <textarea
            placeholder="Çatdırılma qeydi (ixtiyari)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          {cartItems.length > 0 && (
            <div
              style={{
                margin: '1rem 0',
                padding: '1rem',
                borderRadius: 12,
                background: 'rgba(207,111,148,0.06)',
                border: '1px solid rgba(207,111,148,0.14)',
              }}
            >
              <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.6rem' }}>
                Seçilmiş məhsullar
              </p>
              {cartItems.map((item) => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(207,111,148,0.1)' }}>
                  <span>{item.product.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{(item.product.price * item.quantity).toFixed(0)} ₼</span>
                </div>
              ))}

              {/* Promo trigger — always visible, outside the collapsible box */}
              <button
                type="button"
                className="order-promo-trigger"
                aria-expanded={promoExpanded}
                aria-controls="order-promo-fields"
                onClick={() => setPromoExpanded((open) => !open)}
              >
                <span className="order-promo-trigger-icon">
                  <Tag size={16} weight="duotone" />
                </span>
                <span>{promoResult ? `Promokod tətbiq edildi: ${promoInput}` : 'Promokod istifadə etmək istəyirəm'}</span>
                <CaretDown size={15} weight="bold" className="order-promo-caret" data-open={promoExpanded ? 'true' : undefined} />
              </button>

              {/* Collapsible promo box — animates height so layout never jumps */}
              <AnimatePresence initial={false}>
                {promoExpanded && (
                  <motion.div
                    id="order-promo-fields"
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: '0.6rem' }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.26, ease: [0.33, 1, 0.68, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="order-promo order-promo-fields">
                      <div className="order-promo-row">
                        <input
                          placeholder="Promokod"
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            if (promoResult) setPromoResult(null);
                          }}
                          className="order-promo-input"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoInput.trim()}
                          className="order-promo-apply"
                        >
                          {promoLoading ? 'Yoxlanır' : 'Tətbiq et'}
                        </button>
                      </div>

                      {promoResult && (
                        <div className="order-promo-success">
                          Endirim: -{promoResult.discountAmount.toFixed(2)} ₼
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontWeight: 700, fontSize: '1rem' }}>
                <span>Cəmi</span>
                <span style={{ color: 'var(--color-accent-strong)' }}>
                  {promoResult ? promoResult.finalTotal.toFixed(2) : cartSubtotal.toFixed(0)} ₼
                </span>
              </div>
            </div>
          )}

          {cartItems.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: '#b24d68', marginBottom: '1rem' }}>
              Səbətiniz boşdur — əvvəlcə kolleksiyadan məhsul seçin.
            </p>
          )}

          <div className="order-payment-options">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, paymentType: 'cash' }))}
              className="order-payment-option"
              data-active={form.paymentType === 'cash' ? 'true' : undefined}
            >
              <span className="order-payment-icon"><Money size={20} weight="duotone" /></span>
              <span>Nağd ödəniş</span>
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, paymentType: 'epoint' }))}
              className="order-payment-option"
              data-active={form.paymentType === 'epoint' ? 'true' : undefined}
            >
              <span className="order-payment-icon"><CreditCard size={20} weight="duotone" /></span>
              <span>Online ödəniş</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || cartItems.length === 0}
            className="order-submit-btn"
            data-disabled={mutation.isPending || cartItems.length === 0 ? 'true' : undefined}
          >
            {mutation.isPending ? (
              <>
                <SpinnerGap size={19} weight="bold" style={{ animation: 'spin 0.9s linear infinite' }} />
                Sifariş verilir…
              </>
            ) : (
              <>
                <ShoppingBagOpen size={20} weight="duotone" />
                Sifariş ver
                <ArrowRight size={17} weight="bold" className="order-submit-arrow" />
              </>
            )}
          </button>
        </div>
      </section>

      <section className="order-map-panel" aria-label="Çatdırılma ünvanı xəritəsi">
        <MapPicker className="order-map" onPin={handleMapPin} />
      </section>
    </div>
  );
}
