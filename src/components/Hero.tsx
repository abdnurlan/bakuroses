'use client';

import { useEffect, useRef } from 'react';
import { ArrowDown, Sparkle } from '@phosphor-icons/react';

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
      }}
      className="grid-cols-1 md:grid-cols-[1fr_1fr]"
    >
      {/* Left — text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '7rem 4rem 4rem 2rem',
          paddingLeft: 'max(2rem, calc((100vw - 1400px)/2 + 2rem))',
          background: '#fafaf9',
        }}
        className="order-2 md:order-1 !pt-28 md:!pt-0"
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '2px',
            padding: '0.3rem 0.8rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#e11d48',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
            width: 'fit-content',
          }}
          style-animate="fadein"
        >
          <Sparkle size={12} weight="fill" />
          Bakı&apos;nın ən təzə gülləri
        </div>

        <h1
          ref={titleRef}
          className="font-display"
          style={{
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#18181b',
            marginBottom: '1.5rem',
          }}
        >
          Hər duyğu
          <br />
          <em style={{ color: '#e11d48', fontStyle: 'italic' }}>bir güldə</em>
          <br />
          yaşayır.
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: '#71717a',
            lineHeight: 1.7,
            maxWidth: '42ch',
            marginBottom: '2.5rem',
          }}
        >
          Sevgi, sevinc, kədər — hər mərasim üçün əl ilə seçilmiş, təzə gül dəstələri.
          Bakı daxili çatdırılma ilə eyni gün sizin qapınızda.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href="#kataloq"
            style={{
              background: '#e11d48',
              color: '#fff',
              padding: '0.875rem 2rem',
              borderRadius: '2px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.03em',
              transition: 'background 0.2s, transform 0.15s',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#be123c';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#e11d48';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Kataloqa bax
          </a>
          <a
            href="#albom"
            style={{
              background: 'transparent',
              color: '#18181b',
              padding: '0.875rem 2rem',
              borderRadius: '2px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.03em',
              border: '1.5px solid #e4e4e7',
              transition: 'border-color 0.2s, transform 0.15s',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#e11d48';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e4e7';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Alboma bax
          </a>
        </div>

        <div
          style={{
            marginTop: '4rem',
            display: 'flex',
            gap: '2rem',
          }}
        >
          {[
            { num: '500+', label: 'Məmnun müştəri' },
            { num: '50+', label: 'Gül növü' },
            { num: '24h', label: 'Çatdırılma' },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="font-display"
                style={{
                  fontSize: '2rem',
                  fontWeight: 600,
                  color: '#e11d48',
                  lineHeight: 1,
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#a1a1aa',
                  marginTop: '0.25rem',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — image mosaic */}
      <div
        style={{
          position: 'relative',
          background: '#18181b',
          overflow: 'hidden',
          minHeight: '60vw',
        }}
        className="order-1 md:order-2 min-h-[50vw] md:min-h-0"
      >
        {/* Main image */}
        <img
          src="https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=900&q=80"
          alt="Qırmızı güllər"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        {/* Floating badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '2rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            borderRadius: '4px',
            padding: '1rem 1.5rem',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.08em', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Bu həftənin seçimi
          </div>
          <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 500 }}>
            Qırmızı Qızılgül
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.15rem' }}>
            Klassik sevgi simvolu
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            right: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
            }}
          >
            Aşağı
          </div>
          <ArrowDown
            size={14}
            style={{
              animation: 'bounce 2s infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @media (max-width: 767px) {
          section > div:first-child { grid-column: 1; }
          section > div:last-child { grid-column: 1; }
        }
      `}</style>
    </section>
  );
}
