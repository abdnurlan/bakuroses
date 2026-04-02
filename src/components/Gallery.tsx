'use client';

import { useState } from 'react';
import { X, ArrowLeft, ArrowRight } from '@phosphor-icons/react';

const photos = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=400&q=75',
    title: 'Çəhrayı Pion',
    desc: 'Yaz sevincininin simvolu',
    span: 'row-span-2',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&q=75',
    title: 'Ağ Qızılgül',
    desc: 'Saflığın ifadəsi',
    span: '',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1490750967868-88df5691cc1a?w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1490750967868-88df5691cc1a?w=400&q=75',
    title: 'Çəhrayı Dəstə',
    desc: 'Romantik kompozisiya',
    span: '',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=400&q=75',
    title: 'Qırmızı Qızılgül',
    desc: 'Klassik sevgi simvolu',
    span: 'row-span-2',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1444930694458-01babf71870c?w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1444930694458-01babf71870c?w=400&q=75',
    title: 'Sarı Lalə',
    desc: 'Yeni başlanğıcın müjdəçisi',
    span: '',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400&q=75',
    title: 'Lirik Kompozisiya',
    desc: 'Qarışıq gül aranjmanı',
    span: '',
  },
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () => {
    if (lightbox === null) return;
    setLightbox((lightbox - 1 + photos.length) % photos.length);
  };
  const next = () => {
    if (lightbox === null) return;
    setLightbox((lightbox + 1) % photos.length);
  };

  return (
    <section
      id="albom"
      style={{
        padding: '7rem 0',
        background: '#fafaf9',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'end',
            marginBottom: '3.5rem',
            gap: '1rem',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#e11d48',
                marginBottom: '0.75rem',
              }}
            >
              Gül Albomu
            </p>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                fontWeight: 600,
                color: '#18181b',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Hər bir gül
              <br />
              <em style={{ color: '#e11d48', fontStyle: 'italic' }}>bir hekayədir.</em>
            </h2>
          </div>

          <p
            style={{
              maxWidth: '32ch',
              fontSize: '0.9rem',
              color: '#71717a',
              lineHeight: 1.7,
              textAlign: 'right',
            }}
            className="hidden md:block"
          >
            Canlı şəkilləri böyüdərək hər gülü yaxından kəşf edin.
          </p>
        </div>

        {/* Masonry-style grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '220px',
            gap: '12px',
          }}
          className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        >
          {photos.map((p, i) => (
            <div
              key={p.id}
              onClick={() => setLightbox(i)}
              style={{
                gridRow: p.span === 'row-span-2' ? 'span 2' : 'span 1',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                borderRadius: '4px',
                background: '#e4e4e7',
              }}
            >
              <img
                src={p.thumb}
                alt={p.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                  display: 'block',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.transform = 'scale(1.06)');
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.transform = 'scale(1)');
                }}
              />
              {/* Caption overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '1.25rem',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  const img = e.currentTarget.previousElementSibling as HTMLImageElement;
                  if (img) img.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0';
                  const img = e.currentTarget.previousElementSibling as HTMLImageElement;
                  if (img) img.style.transform = 'scale(1)';
                }}
              >
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{p.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'background 0.2s',
            }}
          >
            <X size={20} weight="bold" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute',
              left: '1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <ArrowLeft size={20} weight="bold" />
          </button>

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <img
              src={photos[lightbox].src}
              alt={photos[lightbox].title}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '4px',
                display: 'block',
              }}
            />
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{photos[lightbox].title}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {lightbox + 1} / {photos.length}
              </div>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <ArrowRight size={20} weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
