'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowDown, Sparkle } from '@phosphor-icons/react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  // Show text after a short delay regardless of video state
  useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 180);
    return () => clearTimeout(t);
  }, []);

  // Optimal video load strategy — no buffering freeze
  const initVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Prevent layout-triggered repaints during decode
    video.style.willChange = 'opacity';

    const onCanPlay = () => {
      setVideoReady(true);
      // Detach after first fire
      video.removeEventListener('canplaythrough', onCanPlay);
    };

    video.addEventListener('canplaythrough', onCanPlay);

    // If already ready (cached)
    if (video.readyState >= 4) {
      setVideoReady(true);
    }
  }, []);

  useEffect(() => {
    initVideo();
  }, [initVideo]);

  // Pause video when hero is off-screen to save resources
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 },
    );

    obs.observe(video);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={shellRef} className="hero-video-shell">
      {/* Gradient backdrop shown while video loads */}
      <div className="hero-video-backdrop" />

      {/* Video — muted + playsInline required for autoplay on iOS */}
      <video
        ref={videoRef}
        className={`hero-video-media${videoReady ? ' is-ready' : ''}`}
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
      />

      {/* Gradient overlay */}
      <div className="hero-video-overlay" />

      {/* Text copy — centered */}
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
        .hero-btn:hover {
          transform: translateY(-2px);
        }

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
          .hero-video-actions {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-video-stats {
            gap: 1.5rem;
          }
          .hero-scroll-hint {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
