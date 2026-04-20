'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Product } from '@/entities/product/types';

const ADMIN_TOKEN = () => process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin123';
const headers = () => ({ 'x-admin-token': ADMIN_TOKEN() });

const EMPTY: Omit<Product, 'id' | 'aiPrompt'> = {
  slug: '', name: '', subtitle: '', stemNote: '',
  price: 0, imageUrl: '', category: '',
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/api/products', { headers: headers() });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY) => api.post('/api/products', data, { headers: headers() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Məhsul əlavə edildi'); resetForm(); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY }) =>
      api.put(`/api/products/${id}`, data, { headers: headers() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Yeniləndi'); resetForm(); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`, { headers: headers() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Silindi'); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const resetForm = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(false); };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ slug: p.slug, name: p.name, subtitle: p.subtitle ?? '', stemNote: p.stemNote ?? '', price: p.price, imageUrl: p.imageUrl, category: p.category });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim() || !form.imageUrl.trim() || form.price <= 0) {
      toast.error('Ad, slug, şəkil URL və qiymət mütləqdir'); return;
    }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const inp = (field: keyof typeof EMPTY, placeholder: string, type = 'text') => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[field] as string}
      onChange={e => setForm(f => ({ ...f, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
      style={inputStyle}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600 }}>Məhsullar</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>
          + Yeni Məhsul
        </button>
      </div>

      {showForm && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editing ? 'Məhsulu Düzəlt' : 'Yeni Məhsul'}
            </h2>
            {inp('name', 'Məhsul adı *')}
            {inp('slug', 'Slug (url-friendly: blushing-peony) *')}
            {inp('category', 'Kateqoriya (Buket, Qutu...) *')}
            {inp('price', 'Qiymət (₼) *', 'number')}
            {inp('imageUrl', 'Şəkil URL *')}
            {inp('subtitle', 'Alt başlıq')}
            {inp('stemNote', 'Qeyd (çatdırılma məlumatı)')}
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" onError={e => (e.currentTarget.style.display='none')}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: '0.75rem' }} />
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} style={btnPrimary}>
                {editing ? 'Yenilə' : 'Əlavə et'}
              </button>
              <button onClick={resetForm} style={btnSecondary}>Ləğv et</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)' }}>Yüklənir…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {products.map(p => (
            <div key={p.id} style={cardStyle}>
              <img src={p.imageUrl} alt={p.name}
                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
              <div style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {p.category}
                </p>
                <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{p.name}</p>
                {p.subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{p.subtitle}</p>}
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-accent-strong)', marginBottom: '0.75rem' }}>{p.price} ₼</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(p)} style={{ ...btnSecondary, flex: 1, padding: '0.5rem' }}>Düzəlt</button>
                  <button
                    onClick={() => { if (confirm(`"${p.name}" silinsin?`)) deleteMutation.mutate(p.id); }}
                    style={{ ...btnDanger, flex: 1, padding: '0.5rem' }}>
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: 10,
  border: '1px solid var(--color-border)', fontSize: '0.9rem', outline: 'none',
  fontFamily: 'var(--font-body)', marginBottom: '0.65rem', background: '#fafafa',
};
const btnPrimary: React.CSSProperties = {
  padding: '0.7rem 1.5rem', borderRadius: 10, border: 'none',
  background: 'var(--color-accent-strong)', color: '#fff',
  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '0.7rem 1.25rem', borderRadius: 10,
  border: '1px solid var(--color-border)', background: '#fff',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)',
};
const btnDanger: React.CSSProperties = {
  padding: '0.7rem 1.25rem', borderRadius: 10, border: 'none',
  background: 'rgba(178,77,104,0.1)', color: '#b24d68',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
};
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)',
  overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '2rem',
  width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 12px 60px rgba(0,0,0,0.15)',
};
