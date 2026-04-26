'use client';

export default function ComingSoonPage() {
  return (
    <main className="cs-root">
      {/* Animated petal blobs */}
      <div className="cs-blob cs-blob--1" aria-hidden="true" />
      <div className="cs-blob cs-blob--2" aria-hidden="true" />
      <div className="cs-blob cs-blob--3" aria-hidden="true" />

      {/* Floating petals */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className="cs-petal" style={{ '--i': i } as React.CSSProperties} aria-hidden="true" />
      ))}

      <div className="cs-content">
        {/* Logo mark */}
        <div className="cs-logo-mark" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C24 4 10 13 10 24a14 14 0 0028 0C38 13 24 4 24 4z" fill="url(#pg1)" />
            <path d="M24 10C24 10 14 17 14 24a10 10 0 0020 0C34 17 24 10 24 10z" fill="url(#pg2)" />
            <circle cx="24" cy="24" r="4" fill="#fff" opacity="0.9" />
            <defs>
              <radialGradient id="pg1" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f9c8db" />
                <stop offset="100%" stopColor="#d4607a" />
              </radialGradient>
              <radialGradient id="pg2" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fde0ea" />
                <stop offset="100%" stopColor="#c0506e" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <p className="cs-kicker">Baku Roses · Gül Evi</p>

        <h1 className="cs-title">
          Yeni üzlə<br />
          <em>tezliklə</em>
        </h1>

        <p className="cs-sub">
          Daha gözəl bir təcrübə üçün<br />
          saytımızı yeniləyirik.
        </p>

        <div className="cs-divider" aria-hidden="true">
          <span /><span className="cs-divider-dot" /><span />
        </div>

        <p className="cs-tagline">
          Bakının ən təzə gülləri sizi gözləyir.
        </p>
      </div>

      <style>{`
        .cs-root {
          position: relative;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #faf4f7;
          overflow: hidden;
          font-family: var(--font-body, 'Inter', sans-serif);
          padding: 2rem;
        }

        /* ── Blobs ── */
        .cs-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
          pointer-events: none;
        }
        .cs-blob--1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #f7c5d8 0%, #f0a0bc 100%);
          top: -160px; left: -140px;
          animation: blobDrift1 14s ease-in-out infinite alternate;
        }
        .cs-blob--2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #e8d5f0 0%, #d4b8e8 100%);
          bottom: -100px; right: -80px;
          animation: blobDrift2 18s ease-in-out infinite alternate;
        }
        .cs-blob--3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #fde8d0 0%, #f8c8a8 100%);
          top: 40%; left: 60%;
          animation: blobDrift3 22s ease-in-out infinite alternate;
        }

        @keyframes blobDrift1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(60px, 80px) scale(1.08); }
        }
        @keyframes blobDrift2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-50px, -60px) scale(1.1); }
        }
        @keyframes blobDrift3 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-80px, 40px) scale(0.92); }
        }

        /* ── Petals ── */
        .cs-petal {
          position: absolute;
          width: 10px;
          height: 14px;
          border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%;
          background: linear-gradient(145deg, #f7c0d4, #e8879e);
          opacity: 0;
          pointer-events: none;
          left: calc(8% + var(--i) * 7%);
          animation: petalFall calc(6s + var(--i) * 0.7s) ease-in calc(var(--i) * 0.9s) infinite;
          transform-origin: center;
        }
        .cs-petal:nth-child(even) {
          background: linear-gradient(145deg, #f0d0e8, #d890c0);
          width: 8px; height: 12px;
        }

        @keyframes petalFall {
          0%   { opacity: 0; transform: translateY(-40px) rotate(0deg); }
          10%  { opacity: 0.7; }
          80%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(100dvh) rotate(calc(var(--i) * 30deg + 180deg)); }
        }

        /* ── Content ── */
        .cs-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0;
        }

        .cs-logo-mark {
          margin-bottom: 1.4rem;
          animation: logoFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 8px 24px rgba(200, 80, 110, 0.25));
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        .cs-kicker {
          margin: 0 0 1rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #c07090;
        }

        .cs-title {
          margin: 0 0 1.25rem;
          font-family: var(--font-display, 'Georgia', serif);
          font-size: clamp(3rem, 10vw, 5.5rem);
          font-weight: 600;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #2a1520;
        }
        .cs-title em {
          font-style: italic;
          color: #c0506e;
        }

        .cs-sub {
          margin: 0 0 1.75rem;
          font-size: clamp(0.95rem, 2vw, 1.05rem);
          color: #7a5060;
          line-height: 1.75;
          max-width: 340px;
        }

        .cs-divider {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          width: 180px;
        }
        .cs-divider span:not(.cs-divider-dot) {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e0b0c0, transparent);
        }
        .cs-divider-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #d4849c;
          flex: 0 0 auto;
        }

        .cs-tagline {
          margin: 0;
          font-size: 0.82rem;
          color: #b08898;
          letter-spacing: 0.06em;
        }
      `}</style>
    </main>
  );
}
