'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/products', label: '🌸 Məhsullar' },
  { href: '/admin/orders', label: '🛒 Sifarişlər' },
  { href: '/admin/zones', label: '🗺️ Zonalar' },
  { href: '/admin/promo-codes', label: '🎟️ Promokodlar' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === 'true') {
      setAuthed(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin123')) {
      sessionStorage.setItem('admin_authed', 'true');
      setAuthed(true);
    } else {
      setError('Yanlış şifrə');
    }
  };

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
            style={{
              width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
              background: 'var(--color-accent-strong)', color: '#fff',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Daxil ol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f6f6' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid var(--color-border)',
        padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 10,
      }}>
        <div style={{ marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
          <span className="font-display" style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-text)' }}>
            🌸 Admin
          </span>
        </div>
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
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
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }}
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
      <main style={{ marginLeft: 220, flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
