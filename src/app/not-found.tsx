import Link from 'next/link';

function RoseIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="36" fill="#fff0f5" />
      <circle cx="36" cy="36" r="26" fill="#ffd6e4" />
      {/* petals */}
      <ellipse cx="36" cy="24" rx="5" ry="8" fill="#cf6f94" opacity="0.85" />
      <ellipse cx="36" cy="24" rx="5" ry="8" fill="#cf6f94" opacity="0.85" transform="rotate(60 36 36)" />
      <ellipse cx="36" cy="24" rx="5" ry="8" fill="#cf6f94" opacity="0.85" transform="rotate(120 36 36)" />
      <ellipse cx="36" cy="24" rx="5" ry="8" fill="#cf6f94" opacity="0.85" transform="rotate(180 36 36)" />
      <ellipse cx="36" cy="24" rx="5" ry="8" fill="#cf6f94" opacity="0.85" transform="rotate(240 36 36)" />
      <ellipse cx="36" cy="24" rx="5" ry="8" fill="#cf6f94" opacity="0.85" transform="rotate(300 36 36)" />
      {/* center */}
      <circle cx="36" cy="36" r="6" fill="#b5527a" />
      {/* stem */}
      <path d="M36 48v10" stroke="#8b9770" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 53q-4-2-4-6" stroke="#8b9770" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 1.5h1.8l1.2 6h7l1-4H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="12.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="12.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-background)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '3.5rem 3rem',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <RoseIcon />
        </div>

        <p style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '0.6rem',
        }}>
          404
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.9rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.85rem',
          lineHeight: 1.2,
        }}>
          Səhifə Tapılmadı
        </h1>

        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.65,
          marginBottom: '2.25rem',
        }}>
          Axtardığınız səhifə mövcud deyil və ya köçürülüb.
          Ana səhifəyə qayıdaraq davam edə bilərsiniz.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              padding: '0.85rem 2rem',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Ana Səhifəyə Qayıt
            <ArrowRightIcon />
          </Link>

          <Link
            href="/shop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              color: 'var(--color-text-muted)',
              fontSize: '0.88rem',
              textDecoration: 'none',
              padding: '0.6rem',
            }}
          >
            <ShopIcon />
            Məhsullara Bax
          </Link>
        </div>
      </div>
    </main>
  );
}
