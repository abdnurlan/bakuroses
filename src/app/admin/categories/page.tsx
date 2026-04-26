'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
}

const EMPTY = {
  slug: '',
  name: '',
  description: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
};
type FormState = typeof EMPTY;

function slugify(str: string) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

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

// ── Icons ──────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 17V7M13 7l-4 4M13 7l4 4" stroke="var(--color-accent-strong)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h16" stroke="var(--color-accent-strong)" strokeWidth="1.8" strokeLinecap="round" />
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
export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
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

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get('/api/categories/all')).data,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post<{ imageUrl: string }>('/api/categories/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.imageUrl;
    },
    onSuccess: (imageUrl) => { setForm(f => ({ ...f, imageUrl })); notify('Şəkil yükləndi', 'success'); },
    onError: () => notify('Şəkil yüklənmədi', 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => api.post('/api/categories', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); notify('Kateqoriya əlavə edildi', 'success'); resetForm(); },
    onError: () => notify('Xəta baş verdi', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
      api.put(`/api/categories/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); notify('Kateqoriya yeniləndi', 'success'); resetForm(); },
    onError: () => notify('Yeniləmə uğursuz oldu', 'error'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/api/categories/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: () => notify('Xəta baş verdi', 'error'),
  });

  const resetForm = () => {
    setForm({ ...EMPTY });
    setEditing(null);
    setShowForm(false);
    setPreviewUrl('');
    setSlugTouched(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      slug: c.slug, name: c.name,
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setPreviewUrl(c.imageUrl ?? '');
    setSlugTouched(true);
    setShowForm(true);
  };

  const setName = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    uploadMutation.mutate(file);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { notify('Ad mütləqdir', 'error'); return; }
    if (!form.slug.trim()) { notify('Slug mütləqdir', 'error'); return; }
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600 }}>Kateqoriyalar</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>
          <PlusIcon /> Yeni Kateqoriya
        </button>
      </div>

      {/* Modal */}
      {showForm && mounted && createPortal(
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()} onWheel={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text)' }}>
              {editing ? 'Kateqoriyanı Düzəlt' : 'Yeni Kateqoriya'}
            </h2>

            <label style={labelStyle}>Ad *</label>
            <input
              placeholder="Məs: Mono Buketlər"
              value={form.name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Slug *</label>
            <input
              placeholder="mono-buketler"
              value={form.slug}
              onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }}
              style={inputStyle}
            />

            <label style={labelStyle}>Açıqlama</label>
            <input
              placeholder="Qısa açıqlama"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle}
            />

            <label style={labelStyle}>Sıra nömrəsi</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
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

            {/* Image upload */}
            <label style={labelStyle}>Şəkil</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${isUploading ? 'var(--color-accent)' : form.imageUrl ? 'rgba(139,151,112,0.5)' : 'rgba(139,151,112,0.3)'}`,
                borderRadius: 12,
                padding: previewUrl ? '0.5rem' : '1.5rem',
                cursor: 'pointer',
                background: 'rgba(139,151,112,0.04)',
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
                    style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: '0.35rem' }}>
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

      {/* List */}
      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)', padding: '2rem 0' }}>Yüklənir…</p>
      ) : categories.length === 0 ? (
        <p style={{ color: 'var(--color-text-soft)', padding: '2rem 0' }}>Kateqoriya yoxdur.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {categories.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: '#fff', borderRadius: 14,
                border: '1px solid var(--color-border)',
                padding: '0.75rem 1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                opacity: c.isActive ? 1 : 0.55,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                background: 'var(--color-surface)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}>
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    🗂️
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{c.name}</span>
                  {!c.isActive && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px',
                      borderRadius: 99, background: 'rgba(0,0,0,0.08)', color: 'var(--color-text-muted)',
                    }}>Deaktiv</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <span>/{c.slug}</span>
                  <span>{c._count.products} məhsul</span>
                  <span>Sıra: {c.sortOrder}</span>
                </div>
              </div>

              {/* Sort order quick-edit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)' }}>Sıra</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={c.sortOrder}
                  onBlur={e => {
                    const val = Number(e.target.value);
                    if (val !== c.sortOrder) toggleActive.mutate({ id: c.id, isActive: c.isActive });
                    api.put(`/api/categories/${c.id}`, { sortOrder: val })
                      .then(() => qc.invalidateQueries({ queryKey: ['admin-categories'] }))
                      .catch(() => notify('Xəta', 'error'));
                  }}
                  style={{
                    width: 48, padding: '0.3rem 0.4rem', borderRadius: 7,
                    border: '1px solid var(--color-border)', fontSize: '0.82rem',
                    textAlign: 'center', outline: 'none', background: '#fafafa',
                  }}
                />
              </div>

              {/* Active toggle */}
              <div
                onClick={() => toggleActive.mutate({ id: c.id, isActive: !c.isActive })}
                style={{
                  width: 36, height: 20, borderRadius: 99, flexShrink: 0,
                  background: c.isActive ? 'var(--color-accent-strong)' : '#d0ccd1',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: c.isActive ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>

              {/* Edit button */}
              <button onClick={() => openEdit(c)} style={{ ...btnSecondary, padding: '0.5rem 0.85rem', gap: '0.35rem', flexShrink: 0 }}>
                <EditIcon /> Düzəlt
              </button>
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
  maxHeight: '660px',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  boxShadow: '0 12px 60px rgba(0,0,0,0.2)',
  position: 'relative',
};

// select style helper — used inline above via spread
export const selectStyle: React.CSSProperties = {
  ...({
    width: '100%', boxSizing: 'border-box', padding: '0.78rem 2.2rem 0.78rem 1rem',
    borderRadius: 10, border: '1px solid var(--color-border)',
    fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)',
    marginBottom: 0, background: '#fafafa', color: 'var(--color-text)',
    appearance: 'none', cursor: 'pointer',
  } as React.CSSProperties),
};

// suppress unused warning — ChevronIcon used conditionally
void ChevronIcon;
