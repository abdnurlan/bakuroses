'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Sparkle } from '@phosphor-icons/react';

const TOTAL_FRAMES = 120;
const SCROLL_HEIGHT = '600vh'; // scrollable distance to play all frames

function frameUrl(n: number) {
  return `/hero-frames/frame-${String(n).padStart(4, '0')}.webp`;
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [textVisible, setTextVisible] = useState(false);

  // Preload all frames
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = frameUrl(i);
      img.onload = () => {
        loaded++;
        // Draw first frame as soon as it's ready
        if (i === 1) drawFrame(0);
        if (loaded === TOTAL_FRAMES) {
          // All frames ready
        }
      };
      imgs.push(img);
    }

    imagesRef.current = imgs;
    setTimeout(() => setTextVisible(true), 200);
  }, []);

  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const onScroll = () => {
      const rect = shell.getBoundingClientRect();
      const shellHeight = shell.offsetHeight;
      const viewH = window.innerHeight;

      // How far we've scrolled into the sticky section
      const scrolled = -rect.top;
      const maxScroll = shellHeight - viewH;
      const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);

      const frameIndex = Math.round(progress * (TOTAL_FRAMES - 1));

      if (frameIndex !== currentFrameRef.current) {
        currentFrameRef.current = frameIndex;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial draw
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Redraw on resize
  useEffect(() => {
    const onResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div ref={shellRef} style={{ height: SCROLL_HEIGHT, position: 'relative' }}>
      {/* Sticky viewport */}
      <section className="hero-video-shell" style={{ position: 'sticky', top: 0 }}>
        {/* Frame canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* Gradient overlay */}
        <div className="hero-video-overlay" />

        {/* Text copy */}
        <div
          className="hero-video-copy"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <p className="hero-video-kicker">
            <Sparkle size={11} weight="fill" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4em' }} />
            Bakı&apos;nın ən təzə gülləri
          </p>

          <h1 className="hero-video-title">
            Hər duyğu
            <br />
            <em style={{ fontStyle: 'italic', color: 'rgba(255,182,193,0.92)' }}>bir güldə</em>
            <br />
            yaşayır.
          </h1>

          <p className="hero-video-subtitle">
            Sevgi, sevinc, kədər — hər mərasim üçün əl ilə seçilmiş, təzə gül dəstələri.
            <br />
            Bakı daxili çatdırılma ilə eyni gün sizin qapınızda.
          </p>

          <div className="hero-video-actions">
            <a href="/shop" className="hero-btn hero-btn--primary">
              Kataloqa bax
            </a>
            <a href="/shop" className="hero-btn hero-btn--outline">
              Alboma bax
            </a>
          </div>

          <div className="hero-video-stats">
            {[
              { num: '500+', label: 'Məmnun müştəri' },
              { num: '50+', label: 'Gül növü' },
              { num: '24h', label: 'Çatdırılma' },
            ].map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat__num font-display">{s.num}</span>
                <span className="hero-stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-hint" aria-hidden="true">
          <span className="hero-scroll-hint__text">Aşağı</span>
          <ArrowDown size={14} className="hero-scroll-hint__arrow" />
        </div>

        <style>{`
          .hero-video-actions {
            display: flex;
            gap: 0.875rem;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 0.5rem;
          }

          .hero-btn {
            display: inline-block;
            padding: 0.875rem 2rem;
            border-radius: 2px;
            font-size: 0.88rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-decoration: none;
            transition: background 0.18s, border-color 0.18s, transform 0.15s;
          }
          .hero-btn:hover { transform: translateY(-2px); }

          .hero-btn--primary {
            background: #e11d48;
            color: #fff;
            border: 1.5px solid #e11d48;
          }
          .hero-btn--primary:hover {
            background: #be123c;
            border-color: #be123c;
          }

          .hero-btn--outline {
            background: rgba(255,255,255,0.08);
            color: rgba(253,251,247,0.92);
            border: 1.5px solid rgba(255,255,255,0.32);
            backdrop-filter: blur(8px);
          }
          .hero-btn--outline:hover {
            background: rgba(255,255,255,0.14);
            border-color: rgba(255,255,255,0.55);
          }

          .hero-video-stats {
            display: flex;
            gap: 2.5rem;
            margin-top: 0.5rem;
          }

          .hero-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.2rem;
          }

          .hero-stat__num {
            font-size: 1.9rem;
            font-weight: 600;
            line-height: 1;
            color: rgba(255,182,193,0.9);
          }

          .hero-stat__label {
            font-size: 0.72rem;
            color: rgba(253,251,247,0.6);
            font-weight: 500;
            letter-spacing: 0.04em;
            text-align: center;
          }

          .hero-scroll-hint {
            position: absolute;
            bottom: 2rem;
            right: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.45rem;
            color: rgba(255,255,255,0.45);
            z-index: 25;
          }

          .hero-scroll-hint__text {
            font-size: 0.62rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            writing-mode: vertical-rl;
          }

          .hero-scroll-hint__arrow {
            animation: hero-bounce 2.2s ease-in-out infinite;
          }

          @keyframes hero-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(7px); }
          }

          @media (max-width: 767px) {
            .hero-video-actions { flex-direction: column; align-items: flex-start; }
            .hero-video-stats { gap: 1.5rem; }
            .hero-scroll-hint { display: none; }
          }
        `}</style>
      </section>
    </div>
  );
}
