'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Product } from '@/entities/product/types';

const toastStyle = {
  success: { background: '#f0faf4', color: '#1e6645', border: '1px solid #a8dfc0' },
  error:   { background: '#fff5f5', color: '#8b2e2e', border: '1px solid #f5b8b8' },
  info:    { background: '#f5f8ff', color: '#2b4a8b', border: '1px solid #b8ccf5' },
};

function notify(message: string, type: 'success' | 'error' | 'info') {
  toast(message, {
    style: { ...toastStyle[type], borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, padding: '0.65rem 1rem' },
    icon: type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ',
    duration: type === 'error' ? 4000 : 3000,
  });
}

interface Category {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  _count: { products: number };
}

const EMPTY = {
  slug: '',
  name: '',
  subtitle: '',
  stemNote: '',
  price: 0,
  imageUrl: '',
  category: '',
  categorySlug: '',
  isActive: true,
};

type FormState = typeof EMPTY;

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Icons ──────────────────────────────────────────────
function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 18V8M14 8l-4 4M14 8l4 4" stroke="var(--color-accent-strong)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 20h16" stroke="var(--color-accent-strong)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4h11M5 4V2.5h5V4M6 7v5M9 7v5M3 4l1 9h7l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M10.5 2.5l2 2L5 12H3v-2L10.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ pointerEvents: 'none' }}>
      <path d="M3 5l4 4 4-4" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────
export default function AdminProductsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [previewUrl, setPreviewUrl] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (showForm) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showForm, mounted]);

  // ── Queries ──
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: async () => (await api.get('/api/products?admin=1')).data,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get('/api/categories/all')).data,
  });

  // ── Mutations ──
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post<{ imageUrl: string }>('/api/products/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.imageUrl;
    },
    onSuccess: (imageUrl) => { setForm(f => ({ ...f, imageUrl })); notify('Şəkil yükləndi', 'success'); },
    onError: () => notify('Şəkil yüklənmədi', 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => api.post('/api/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); notify('Məhsul əlavə edildi', 'success'); resetForm(); },
    onError: () => notify('Məhsul əlavə edilmədi', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormState }) => api.put(`/api/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); notify('Məhsul yeniləndi', 'success'); resetForm(); },
    onError: () => notify('Yeniləmə uğursuz oldu', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean; softDeleted: boolean }>(`/api/products/${id}`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      if (res.data.softDeleted) notify('Məhsul deaktiv edildi (sifarişlərdə istifadə olunur)', 'info');
      else notify('Məhsul silindi', 'success');
    },
    onError: () => notify('Silmə uğursuz oldu', 'error'),
  });

  // ── Helpers ──
  const resetForm = () => {
    setForm({ ...EMPTY });
    setEditing(null);
    setShowForm(false);
    setPreviewUrl('');
    setSlugTouched(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      slug: p.slug, name: p.name,
      subtitle: p.subtitle ?? '', stemNote: p.stemNote ?? '',
      price: p.price, imageUrl: p.imageUrl,
      category: p.category, categorySlug: p.categorySlug ?? '',
      isActive: p.isActive ?? true,
    });
    setPreviewUrl(p.imageUrl);
    setSlugTouched(true);
    setShowForm(true);
  };

  const setCategory = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    if (!cat) { setForm(f => ({ ...f, category: '', categorySlug: '' })); return; }
    setForm(f => ({ ...f, category: cat.name, categorySlug: cat.slug }));
  };

  const setName = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    uploadMutation.mutate(file);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Ad mütləqdir'); return; }
    if (!form.slug.trim()) { toast.error('Slug mütləqdir'); return; }
    if (!form.categorySlug) { toast.error('Kateqoriya seçin'); return; }
    if (form.price <= 0) { toast.error('Qiymət 0-dan böyük olmalıdır'); return; }
    if (!form.imageUrl) { toast.error('Şəkil yükləyin'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600 }}>Məhsullar</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>
          <PlusIcon /> Yeni Məhsul
        </button>
      </div>

      {/* Modal — rendered into body via portal so layout stacking context can't clip it */}
      {showForm && mounted && createPortal(
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
          <div
            style={modalBox}
            onClick={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text)' }}>
              {editing ? 'Məhsulu Düzəlt' : 'Yeni Məhsul'}
            </h2>

            {/* Name → auto-slug */}
            <label style={labelStyle}>Məhsul adı *</label>
            <input
              placeholder="Məs: Blushing Peony Buketi"
              value={form.name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Slug (URL) *</label>
            <input
              placeholder="blushing-peony-buketi"
              value={form.slug}
              onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }}
              style={inputStyle}
            />

            {/* Category select */}
            <label style={labelStyle}>Kateqoriya *</label>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <select
                value={form.categorySlug}
                onChange={e => setCategory(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, appearance: 'none', paddingRight: '2.2rem', cursor: 'pointer' }}
              >
                <option value="">— Kateqoriya seçin —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>
                <ChevronIcon />
              </span>
            </div>

            {/* Price */}
            <label style={labelStyle}>Qiymət (₼) *</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              placeholder="0"
              value={form.price || ''}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              style={inputStyle}
            />

            {/* Subtitle */}
            <label style={labelStyle}>Alt başlıq</label>
            <input
              placeholder="Məs: 25 ədəd çəhrayı gül"
              value={form.subtitle}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              style={inputStyle}
            />

            {/* StemNote */}
            <label style={labelStyle}>Çatdırılma qeydi</label>
            <input
              placeholder="Məs: Eyni gün çatdırılır"
              value={form.stemNote}
              onChange={e => setForm(f => ({ ...f, stemNote: e.target.value }))}
              style={inputStyle}
            />

            {/* isActive toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem', cursor: 'pointer' }}>
              <div
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                style={{
                  width: 40, height: 22, borderRadius: 99,
                  background: form.isActive ? 'var(--color-accent-strong)' : '#d0ccd1',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: form.isActive ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                {form.isActive ? 'Aktiv' : 'Deaktiv'}
              </span>
            </label>

            {/* Image upload zone */}
            <label style={labelStyle}>Məhsul şəkli *</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${isUploading ? 'var(--color-accent)' : form.imageUrl ? 'rgba(139,151,112,0.5)' : 'rgba(139,151,112,0.3)'}`,
                borderRadius: 12,
                padding: previewUrl ? '0.5rem' : '1.5rem',
                cursor: 'pointer',
                background: isUploading ? 'rgba(207,111,148,0.04)' : 'rgba(139,151,112,0.04)',
                marginBottom: '1rem',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: '0.4rem' }}>
                    {isUploading ? 'Yüklənir…' : 'Dəyişmək üçün klik et'}
                  </span>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {isUploading ? 'Yüklənir…' : 'Şəkil seçin (max 5 MB)'}
                  </span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileChange(e.target.files?.[0])}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSubmit}
                disabled={isSaving || isUploading}
                style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: (isSaving || isUploading) ? 0.6 : 1 }}
              >
                {isSaving ? 'Saxlanılır…' : editing ? 'Yenilə' : 'Əlavə et'}
              </button>
              <button onClick={resetForm} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>
                Ləğv et
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Grid */}
      {loadingProducts ? (
        <p style={{ color: 'var(--color-text-soft)', padding: '2rem 0' }}>Yüklənir…</p>
      ) : products.length === 0 ? (
        <p style={{ color: 'var(--color-text-soft)', padding: '2rem 0' }}>Hələ məhsul yoxdur.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {products.map(p => (
            <div key={p.id} style={{ ...cardStyle, opacity: p.isActive === false ? 0.6 : 1 }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '14px 14px 0 0', display: 'block' }}
                />
                {p.isActive === false && (
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, letterSpacing: '0.05em',
                  }}>
                    Deaktiv
                  </span>
                )}
              </div>
              <div style={{ padding: '0.9rem 1rem 1rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  {p.category}
                </p>
                <p style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{p.name}</p>
                {p.subtitle && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{p.subtitle}</p>
                )}
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-accent-strong)', marginBottom: '0.85rem' }}>
                  {p.price} ₼
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(p)} style={{ ...btnSecondary, flex: 1, padding: '0.5rem 0', justifyContent: 'center', gap: '0.35rem' }}>
                    <EditIcon /> Düzəlt
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`"${p.name}" silinsin?`)) deleteMutation.mutate(p.id); }}
                    disabled={deleteMutation.isPending}
                    style={{ ...btnDanger, flex: 1, padding: '0.5rem 0', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <TrashIcon /> Sil
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

// ── Styles ─────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '0.3rem', letterSpacing: '0.03em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '0.78rem 1rem',
  borderRadius: 10, border: '1px solid var(--color-border)',
  fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)',
  marginBottom: '0.75rem', background: '#fafafa', color: 'var(--color-text)',
};
const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.72rem 1.4rem', borderRadius: 10, border: 'none',
  background: 'var(--color-accent-strong)', color: '#fff',
  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '0.65rem 1rem', borderRadius: 10,
  border: '1px solid var(--color-border)', background: '#fff',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)',
};
const btnDanger: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '0.65rem 1rem', borderRadius: 10, border: 'none',
  background: 'rgba(178,77,104,0.1)', color: '#b24d68',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
};
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16,
  border: '1px solid var(--color-border)',
  overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  transition: 'opacity 0.2s',
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 9999,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
};
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '2rem',
  width: '100%', maxWidth: 500,
  maxHeight: '760px',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  boxShadow: '0 12px 60px rgba(0,0,0,0.2)',
  position: 'relative',
};
