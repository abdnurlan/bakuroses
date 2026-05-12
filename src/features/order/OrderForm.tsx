'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CaretDown, CreditCard, ShoppingBagOpen, SpinnerGap, Tag } from '@phosphor-icons/react';
import { MapPicker } from './MapPicker';
import { checkCoverage, type Zone } from '@/api/zones';
import { createOrder, type OrderItem } from '@/api/orders';
import { validatePromoCode, type PromoValidateResult } from '@/api/promoCodes';
import { useAppStore } from '@/shared/store';
import { useLang } from '@/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';

type FormField = 'name' | 'phone' | 'recipientName' | 'recipientPhone' | 'address' | 'map' | 'cart' | 'scheduledDate';
type DeliveryFor = 'self' | 'gift';

export function OrderForm() {
  const router = useRouter();
  const { t, locale } = useLang();
  const cartItems = useAppStore((s) => s.cartItems);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    deliveryFor: 'self' as DeliveryFor,
    recipientName: '',
    recipientPhone: '',
    address: '',
    note: '',
    scheduledDate: '',
    lat: null as number | null,
    lng: null as number | null,
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
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});

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
        toast.error(t('order_err_general'));
      }
    },
    onError: () => {
      toast.error(t('order_err_general'));
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
    setErrors((prev) => ({ ...prev, map: undefined }));
    setStagedPin(null);
    setCoverageLoading(true);
    try {
      const result = await checkCoverage(lat, lng);
      if (result.covered && result.zone) {
        setZone(result.zone);
      } else {
        setZone(null);
        setErrors((prev) => ({ ...prev, map: t('order_err_no_delivery') }));
        toast.error(t('order_err_no_delivery'));
      }
    } catch {
      setErrors((prev) => ({ ...prev, map: t('order_err_zone_fail') }));
      toast.error(t('order_err_zone_fail'));
    } finally {
      setCoverageLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string | DeliveryFor) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<FormField, string>> = {};
    if (!zone) nextErrors.map = t('order_err_no_map');
    if (!form.name.trim()) nextErrors.name = t('order_err_no_name');
    if (!form.phone.trim()) nextErrors.phone = t('order_err_no_phone');
    if (form.deliveryFor === 'gift') {
      if (!form.recipientName.trim()) nextErrors.recipientName = t('order_err_no_recipient_name');
      if (!form.recipientPhone.trim()) nextErrors.recipientPhone = t('order_err_no_recipient_phone');
    }
    if (!form.address.trim()) nextErrors.address = t('order_err_no_address');
    if (!form.scheduledDate) nextErrors.scheduledDate = t('order_err_no_scheduled_date');
    if (cartItems.length === 0) nextErrors.cart = t('order_err_empty_cart');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (!zone) return;

    const items: OrderItem[] = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    mutation.mutate({
      name: form.name,
      phone: form.phone,
      deliveryFor: form.deliveryFor,
      recipientName: form.deliveryFor === 'gift' ? form.recipientName : undefined,
      recipientPhone: form.deliveryFor === 'gift' ? form.recipientPhone : undefined,
      address: form.address,
      lat: form.lat!,
      lng: form.lng!,
      note: form.note || undefined,
      scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : undefined,
      items,
      paymentType: 'payriff',
      zoneId: zone.id,
      promoCode: promoResult ? promoInput.trim() : undefined,
      locale,
    });
  };

  const getInputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: hasError ? '1px solid rgba(178, 77, 104, 0.74)' : '1px solid rgba(139, 151, 112, 0.22)',
    background: 'rgba(255,255,255,0.84)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: hasError ? '0.3rem' : '0.75rem',
  });

  const fieldError = (field: FormField) => errors[field] ? (
    <p className="order-field-error">{errors[field]}</p>
  ) : null;

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
            <p className="order-kicker" style={{ marginBottom: 0 }}>{t('order_kicker')}</p>
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
          <h1 id="order-title" className="font-display order-title">{t('order_title')}</h1>

          <p className="order-copy">
            {t('order_copy')}
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
              {zone ? t('order_map_selected').replace('{zone}', zone.name) : t('order_map_select')}
            </button>
            {zone && (
              <span className="order-mobile-zone-badge">
                {zone.deliveryFee.toFixed(0)} ₼ {t('order_delivery_fee')}
              </span>
            )}
          </div>

          {/* ── Mobile map fullscreen modal ── */}
          {mounted && mapModalOpen && createPortal(
            <div className="order-map-modal-overlay">
              <div className="order-map-modal">
                <div className="order-map-modal-header">
                  <span>{t('order_map_modal_title')}</span>
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
                    {stagedPin ? t('order_map_pin_selected') : t('order_map_tap_hint')}
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
                    {t('order_map_confirm')}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          <div className="order-map-status">
            {coverageLoading && <span>{t('order_zone_checking')}</span>}
            {!coverageLoading && zone && (
              <span>
                {t('order_zone_available').replace('{zone}', zone.name).replace('{fee}', zone.deliveryFee.toFixed(0))}
              </span>
            )}
            {!coverageLoading && !zone && <span>{t('order_no_map_selected')}</span>}
          </div>
          {fieldError('map')}

          <input
            placeholder={t('order_name_placeholder')}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            style={getInputStyle(!!errors.name)}
            aria-invalid={!!errors.name}
          />
          {fieldError('name')}
          <input
            placeholder={t('order_phone_placeholder')}
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            style={getInputStyle(!!errors.phone)}
            aria-invalid={!!errors.phone}
          />
          {fieldError('phone')}

          <div className="order-delivery-recipient">
            <p className="order-section-label">{t('order_delivery_for_label')}</p>
            <div className="order-choice-row" role="radiogroup" aria-label={t('order_delivery_for_label')}>
              {(['self', 'gift'] as DeliveryFor[]).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className="order-choice-btn"
                  data-active={form.deliveryFor === choice ? 'true' : undefined}
                  onClick={() => {
                    updateField('deliveryFor', choice);
                    if (choice === 'self') {
                      setErrors((prev) => ({ ...prev, recipientName: undefined, recipientPhone: undefined }));
                    }
                  }}
                  role="radio"
                  aria-checked={form.deliveryFor === choice}
                >
                  {choice === 'self' ? t('order_delivery_self') : t('order_delivery_gift')}
                </button>
              ))}
            </div>
          </div>

          {form.deliveryFor === 'gift' && (
            <div className="order-recipient-fields">
              <input
                placeholder={t('order_recipient_name_placeholder')}
                value={form.recipientName}
                onChange={(e) => updateField('recipientName', e.target.value)}
                style={getInputStyle(!!errors.recipientName)}
                aria-invalid={!!errors.recipientName}
              />
              {fieldError('recipientName')}
              <input
                placeholder={t('order_recipient_phone_placeholder')}
                value={form.recipientPhone}
                onChange={(e) => updateField('recipientPhone', e.target.value)}
                style={getInputStyle(!!errors.recipientPhone)}
                aria-invalid={!!errors.recipientPhone}
              />
              {fieldError('recipientPhone')}
            </div>
          )}

          <input
            placeholder={t('order_address_placeholder')}
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            style={getInputStyle(!!errors.address)}
            aria-invalid={!!errors.address}
          />
          {fieldError('address')}
          <textarea
            placeholder={t('order_note_placeholder')}
            value={form.note}
            onChange={(e) => updateField('note', e.target.value)}
            rows={3}
            style={{ ...getInputStyle(), resize: 'vertical' }}
          />

          {/* ── Scheduled delivery date ── */}
          <div style={{ marginBottom: errors.scheduledDate ? '0.3rem' : '0.75rem' }}>
            <p className="order-section-label" style={{ marginBottom: '0.45rem' }}>
              {t('order_scheduled_date_label')}
            </p>
            <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
              {[
                { label: t('order_scheduled_date_today'), offset: 0 },
                { label: t('order_scheduled_date_tomorrow'), offset: 1 },
              ].map(({ label, offset }) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const val = d.toISOString().slice(0, 10);
                return (
                  <button
                    key={offset}
                    type="button"
                    className="order-choice-btn"
                    data-active={form.scheduledDate === val ? 'true' : undefined}
                    onClick={() => {
                      updateField('scheduledDate', val);
                      setErrors((prev) => ({ ...prev, scheduledDate: undefined }));
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    {label}
                  </button>
                );
              })}
              {form.scheduledDate && (
                <button
                  type="button"
                  className="order-choice-btn"
                  onClick={() => updateField('scheduledDate', '')}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', color: 'var(--color-text-muted)' }}
                >
                  {t('order_scheduled_date_clear')}
                </button>
              )}
            </div>
            <input
              type="date"
              value={form.scheduledDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                updateField('scheduledDate', e.target.value);
                setErrors((prev) => ({ ...prev, scheduledDate: undefined }));
              }}
              style={getInputStyle(!!errors.scheduledDate)}
              aria-invalid={!!errors.scheduledDate}
            />
          </div>
          {fieldError('scheduledDate')}

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
                {t('order_items_label')}
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
                  <span>{t('order_total')}</span>
                <span style={{ color: 'var(--color-accent-strong)' }}>
                  {promoResult ? promoResult.finalTotal.toFixed(2) : cartSubtotal.toFixed(0)} ₼
                </span>
              </div>
            </div>
          )}

          {cartItems.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: '#b24d68', marginBottom: '1rem' }}>
              {errors.cart ?? t('order_cart_empty')}
            </p>
          )}

          <div className="order-payment-options">
            <div className="order-payment-option" data-active="true" style={{ pointerEvents: 'none' }}>
              <span className="order-payment-icon"><CreditCard size={20} weight="duotone" /></span>
              <span>{t('order_pay_online')}</span>
            </div>
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
                {t('order_submitting')}
              </>
            ) : (
              <>
                <ShoppingBagOpen size={20} weight="duotone" />
                {t('order_title')}
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
