'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  type PromoCode,
} from '@/api/promoCodes';

const EMPTY_FORM = {
  code: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: 10,
  minOrderAmount: '',
  maxUses: '',
  isActive: true,
  expiresAt: '',
};

export default function AdminPromoCodesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: promos = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ['admin-promo-codes'],
    queryFn: fetchPromoCodes,
  });

  const createMut = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Promokod yaradıldı');
      resetForm();
    },
    onError: (e: { response?: { data?: { error?: string } } }) =>
      toast.error(e?.response?.data?.error ?? 'Xəta baş verdi'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromoCode> }) =>
      updatePromoCode(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Yeniləndi');
      resetForm();
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const deleteMut = useMutation({
    mutationFn: deletePromoCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Silindi');
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (promo: PromoCode) => {
    setEditing(promo);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount !== null ? String(promo.minOrderAmount) : '',
      maxUses: promo.maxUses !== null ? String(promo.maxUses) : '',
      isActive: promo.isActive,
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.code.trim()) { toast.error('Kod daxil edin'); return; }
    if (!form.discountValue || form.discountValue <= 0) { toast.error('Endirim dəyərini daxil edin'); return; }
    if (form.discountType === 'percent' && form.discountValue > 100) { toast.error('Faiz 100-dən çox ola bilməz'); return; }

    const payload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload as Parameters<typeof createPromoCode>[0]);
    }
  };

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600 }}>Promokodlar</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={btnPrimary}
        >
          + Yeni promokod
        </button>
      </div>

      {showForm && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editing ? 'Promokodu düzəlt' : 'Yeni promokod'}
            </h2>

            <label style={labelStyle}>Kod</label>
            <input
              placeholder="ROSE20"
              value={form.code}
              disabled={!!editing}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              style={{ ...inputStyle, opacity: editing ? 0.6 : 1 }}
            />

            <label style={labelStyle}>Endirim növü</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {(['percent', 'fixed'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, discountType: t }))}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.85rem',
                    background: form.discountType === t ? 'var(--color-accent-strong)' : '#f0f0f0',
                    color: form.discountType === t ? '#fff' : 'var(--color-text)',
                  }}
                >
                  {t === 'percent' ? '% Faiz' : '₼ Sabit məbləğ'}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Endirim dəyəri {form.discountType === 'percent' ? '(%)' : '(₼)'}</label>
            <input
              type="number"
              min={1}
              max={form.discountType === 'percent' ? 100 : undefined}
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
              style={inputStyle}
            />

            <label style={labelStyle}>Minimum sifariş məbləği (₼, ixtiyari)</label>
            <input
              type="number"
              min={0}
              placeholder="məs. 50"
              value={form.minOrderAmount}
              onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
              style={inputStyle}
            />

            <label style={labelStyle}>Maksimum istifadə sayı (ixtiyari)</label>
            <input
              type="number"
              min={1}
              placeholder="məs. 100"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              style={inputStyle}
            />

            <label style={labelStyle}>Bitmə tarixi (ixtiyari)</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              style={inputStyle}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="isActive" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Aktiv</label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSubmit} disabled={isBusy} style={btnPrimary}>
                {isBusy ? 'Saxlanılır…' : editing ? 'Yenilə' : 'Yarat'}
              </button>
              <button onClick={resetForm} style={btnSecondary}>Ləğv et</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)' }}>Yüklənir…</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Kod', 'Növ', 'Dəyər', 'Min. məbləğ', 'Limit / İstifadə', 'Bitmə tarixi', 'Status', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ ...tdStyle, fontWeight: 700, letterSpacing: '0.06em' }}>{p.code}</td>
                  <td style={tdStyle}>{p.discountType === 'percent' ? 'Faiz' : 'Sabit'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    {p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue} ₼`}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                    {p.minOrderAmount !== null ? `${p.minOrderAmount} ₼` : '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                    {p.maxUses !== null ? `${p.usedCount} / ${p.maxUses}` : `${p.usedCount} / ∞`}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('az-AZ') : '—'}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                      borderRadius: 20,
                      background: p.isActive ? '#22c55e22' : '#ef444422',
                      color: p.isActive ? '#16a34a' : '#dc2626',
                    }}>
                      {p.isActive ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEdit(p)} style={btnSmall}>Düzəlt</button>
                    <button
                      onClick={() => { if (confirm('Silinsin?')) deleteMut.mutate(p.id); }}
                      style={{ ...btnSmall, color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Promokod yoxdur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem',
  borderRadius: 10, border: '1px solid var(--color-border)',
  fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem',
  fontFamily: 'var(--font-body)', background: '#fff',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--color-text-muted)', marginBottom: '0.3rem',
};
const btnPrimary: React.CSSProperties = {
  padding: '0.75rem 1.5rem', borderRadius: 12, border: 'none',
  background: 'var(--color-accent-strong)', color: '#fff',
  fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '0.75rem 1.25rem', borderRadius: 12,
  border: '1px solid var(--color-border)', background: '#fff',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  color: 'var(--color-text)',
};
const btnSmall: React.CSSProperties = {
  padding: '0.35rem 0.75rem', borderRadius: 8,
  border: '1px solid var(--color-border)', background: '#fff',
  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
  color: 'var(--color-text)',
};
const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem',
  fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em',
  textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem', fontSize: '0.875rem' };
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '2rem', width: '100%',
  maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
  boxShadow: '0 12px 60px rgba(0,0,0,0.15)',
};
