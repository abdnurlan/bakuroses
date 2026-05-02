'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/products', label: '🌸 Məhsullar' },
  { href: '/admin/categories', label: '🗂️ Kateqoriyalar' },
  { href: '/admin/orders', label: '🛒 Sifarişlər' },
  { href: '/admin/zones', label: '🗺️ Zonalar' },
  { href: '/admin/promo-codes', label: '🎟️ Promokodlar' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get<{ authed: boolean }>('/api/admin/me')
      .then((res) => {
        if (alive) setAuthed(res.data.authed);
      })
      .catch(() => {
        if (alive) setAuthed(false);
      });
    return () => { alive = false; };
  }, []);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/api/admin/login', { password });
      setAuthed(true);
      setPassword('');
    } catch {
      setError('Yanlış şifrə');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await api.post('/api/admin/logout').catch(() => undefined);
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-background)', color: 'var(--color-text-soft)',
      }}>
        Yüklənir...
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-background)',
      }}>
        <div style={{
          width: 340, padding: '2.5rem', borderRadius: 20,
          background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          border: '1px solid var(--color-border)',
        }}>
          <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Baku Roses idarəetmə paneli
          </p>
          <input
            type="password"
            placeholder="Şifrə"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem',
              borderRadius: 12, border: '1px solid var(--color-border)',
              fontSize: '0.95rem', outline: 'none', marginBottom: '0.75rem',
              fontFamily: 'var(--font-body)',
            }}
          />
          {error && <p style={{ color: '#b24d68', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
              background: 'var(--color-accent-strong)', color: '#fff',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Yoxlanılır...' : 'Daxil ol'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
          <span className="font-display" style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-text)' }}>
            🌸 Admin
          </span>
        </div>
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            prefetch
            scroll={false}
            style={{
              display: 'block', padding: '0.65rem 0.85rem', borderRadius: 10,
              fontSize: '0.875rem', fontWeight: pathname === n.href ? 700 : 400,
              color: pathname === n.href ? 'var(--color-accent-strong)' : 'var(--color-text-muted)',
              background: pathname === n.href ? 'rgba(139,151,112,0.1)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            {n.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', display: 'grid', gap: '0.65rem' }}>
          <Link
            href="/az"
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              padding: '0.65rem 0.85rem', borderRadius: 10,
              border: '1px solid rgba(139,151,112,0.28)',
              background: 'rgba(139,151,112,0.08)',
              color: 'var(--color-accent-strong)', textAlign: 'center',
              fontSize: '0.82rem', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Ana səhifəyə keç
          </Link>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '0.6rem', borderRadius: 10, border: '1px solid var(--color-border)',
              background: 'transparent', fontSize: '0.8rem', color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            Çıxış
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
