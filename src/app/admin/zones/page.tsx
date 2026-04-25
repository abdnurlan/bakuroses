'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Zone } from '@/api/zones';

const ADMIN_TOKEN = () => process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin123';
const headers = () => ({ 'x-admin-token': ADMIN_TOKEN() });

// Store location: 9RRV+H3 Baku, Azerbaijan
const STORE_LAT = 40.4093;
const STORE_LNG = 49.8671;

const EMPTY = {
  name: '',
  centerLat: STORE_LAT,
  centerLng: STORE_LNG,
  radiusKm: 3,
  deliveryFee: 5,
  color: '#cf6f94',
  isActive: true,
};

interface ZoneWithFee extends Zone {
  deliveryFee: number;
}

export default function AdminZonesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ZoneWithFee | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data: zones = [], isLoading } = useQuery<ZoneWithFee[]>({
    queryKey: ['admin-zones'],
    queryFn: async () => {
      const res = await api.get('/api/zones/all', { headers: headers() });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY) => api.post('/api/zones', data, { headers: headers() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-zones'] }); toast.success('Zona əlavə edildi'); resetForm(); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY }) =>
      api.put(`/api/zones/${id}`, data, { headers: headers() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-zones'] }); toast.success('Zona yeniləndi'); resetForm(); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/zones/${id}`, { headers: headers() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-zones'] }); toast.success('Silindi'); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const resetForm = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(false); };

  const openEdit = (z: ZoneWithFee) => {
    setEditing(z);
    setForm({
      name: z.name,
      centerLat: z.centerLat,
      centerLng: z.centerLng,
      radiusKm: z.radiusKm,
      deliveryFee: z.deliveryFee,
      color: z.color ?? '#cf6f94',
      isActive: z.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Ad mütləqdir'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600 }}>Çatdırılma Zonaları</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Mağaza: 9RRV+H3 Baku ({STORE_LAT}, {STORE_LNG}) · Hazırda {zones.length} zona var, aktiv zonalar radius sırasına görə işləyir
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>
          + Yeni zona
        </button>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
        marginBottom: '1.5rem', marginTop: '0.75rem',
      }}>
        {zones.map(z => (
          <div key={z.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
            background: `${z.color ?? '#cf6f94'}22`, border: `1px solid ${z.color ?? '#cf6f94'}55`, color: 'var(--color-text)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.color ?? '#cf6f94', display: 'inline-block' }} />
            {z.name} → {z.deliveryFee} ₼
          </div>
        ))}
        {zones.length === 0 && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Hələ zona əlavə edilməyib.
          </span>
        )}
      </div>

      {showForm && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editing ? 'Zonanı Düzəlt' : 'Yeni Zona'}
            </h2>

            <label style={labelStyle}>
              Ad *
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                placeholder="məs. 0–3 km"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={labelStyle}>
                Mərkəz Latitude
                <input type="number" step="any" value={form.centerLat}
                  onChange={e => setForm(f => ({ ...f, centerLat: parseFloat(e.target.value) || 0 }))}
                  style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Mərkəz Longitude
                <input type="number" step="any" value={form.centerLng}
                  onChange={e => setForm(f => ({ ...f, centerLng: parseFloat(e.target.value) || 0 }))}
                  style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={labelStyle}>
                Radius (km)
                <input type="number" step="0.5" min={0.5} value={form.radiusKm}
                  onChange={e => setForm(f => ({ ...f, radiusKm: parseFloat(e.target.value) || 0 }))}
                  style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Çatdırılma haqqı (₼)
                <input type="number" step="0.5" min={0} value={form.deliveryFee}
                  onChange={e => setForm(f => ({ ...f, deliveryFee: parseFloat(e.target.value) || 0 }))}
                  style={inputStyle} />
              </label>
            </div>

            <label style={labelStyle}>
              Rəng
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.3rem' }}>
                <input type="color" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 48, height: 36, borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{form.color}</span>
              </div>
            </label>

            <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span style={{ fontSize: '0.9rem' }}>Aktiv</span>
            </label>

            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '1rem' }}>
              💡 Mağaza koordinatları: {STORE_LAT}, {STORE_LNG}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={btnPrimary}
              >
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
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['', 'Ad', 'Radius', 'Çatdırılma haqqı', 'Mərkəz', 'Status', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 0.5rem 0.75rem 1rem', width: 24 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: z.color ?? '#cf6f94' }} />
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{z.name}</td>
                  <td style={tdStyle}>{z.radiusKm} km</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-accent-strong)', fontSize: '1rem' }}>
                    {z.deliveryFee} ₼
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {z.centerLat.toFixed(4)}, {z.centerLng.toFixed(4)}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 20,
                      background: z.isActive ? '#dcfce7' : '#fee2e2',
                      color: z.isActive ? '#16a34a' : '#dc2626',
                    }}>
                      {z.isActive ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEdit(z)} style={btnSmall}>Düzəlt</button>
                    <button
                      onClick={() => { if (confirm(`"${z.name}" silinsin?`)) deleteMutation.mutate(z.id); }}
                      style={{ ...btnSmall, color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Zona yoxdur. Yuxarıdakı <strong>Yeni zona</strong> düyməsi ilə zonalarını əlavə et.
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

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.65rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' };
const inputStyle: React.CSSProperties = { padding: '0.8rem 1rem', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)', background: '#fafafa', width: '100%', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '0.7rem 1.5rem', borderRadius: 10, border: 'none', background: 'var(--color-accent-strong)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { padding: '0.7rem 1.25rem', borderRadius: 10, border: '1px solid var(--color-border)', background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' };
const btnSmall: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' };
const thStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem', fontSize: '0.875rem' };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 };
const modalBox: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 12px 60px rgba(0,0,0,0.15)' };
