'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        cartItems.forEach((item) => clearCart(item.product.id));
        router.push(`/track/${data.orderId}`);
      }
    },
    onError: () => {
      toast.error('Sifariş zamanı xəta baş verdi. Yenidən cəhd edin.');
    },
  });

  const cartSubtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoInput.trim(), cartSubtotal);
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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 1rem' }}>
      <h2
        className="font-display"
        style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text)' }}
      >
        Sifariş ver
      </h2>

      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.06em' }}>
        Çatdırılma ünvanınızı xəritədən seçin
      </p>

      <MapPicker onPin={handleMapPin} />

      {coverageLoading && (
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginTop: '0.5rem' }}>
          Zona yoxlanılır…
        </p>
      )}

      {zone && (
        <p style={{ fontSize: '0.82rem', color: '#8b9770', marginTop: '0.5rem', fontWeight: 600 }}>
          ✅ {zone.name} — çatdırılma mövcuddur
        </p>
      )}

      {zone && (
        <div style={{ marginTop: '1.5rem' }}>
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

              {/* Promo code input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                <input
                  placeholder="Promokod"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    if (promoResult) setPromoResult(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: 10,
                    border: `1px solid ${promoResult ? 'rgba(139,151,112,0.6)' : 'rgba(139,151,112,0.22)'}`,
                    background: 'rgba(255,255,255,0.9)',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 10,
                    border: 'none',
                    background: promoLoading || !promoInput.trim() ? 'rgba(139,151,112,0.3)' : 'rgba(139,151,112,0.85)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    cursor: promoLoading || !promoInput.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {promoLoading ? '…' : 'Tətbiq et'}
                </button>
              </div>

              {promoResult && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#8b9770', fontWeight: 600 }}>
                  ✅ Endirim: -{promoResult.discountAmount.toFixed(2)} ₼
                </div>
              )}

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

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setForm((f) => ({ ...f, paymentType: 'cash' }))}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: 12,
                border: `2px solid ${form.paymentType === 'cash' ? 'var(--color-accent-strong)' : 'rgba(139,151,112,0.22)'}`,
                background: form.paymentType === 'cash' ? 'rgba(207,111,148,0.08)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                transition: 'all 0.2s',
              }}
            >
              💵 Nağd ödəniş
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, paymentType: 'epoint' }))}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: 12,
                border: `2px solid ${form.paymentType === 'epoint' ? 'var(--color-accent-strong)' : 'rgba(139,151,112,0.22)'}`,
                background: form.paymentType === 'epoint' ? 'rgba(207,111,148,0.08)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                transition: 'all 0.2s',
              }}
            >
              💳 Online ödəniş (Epoint)
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || cartItems.length === 0}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 12,
              border: 'none',
              background: mutation.isPending || cartItems.length === 0
                ? 'rgba(139,151,112,0.35)'
                : 'var(--color-accent-strong)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: mutation.isPending || cartItems.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {mutation.isPending ? 'Sifariş verilir…' : 'Sifariş ver'}
          </button>
        </div>
      )}
    </div>
  );
}
