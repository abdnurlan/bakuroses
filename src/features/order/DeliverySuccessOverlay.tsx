'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

function SuccessCarVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const holdFinalFrame = () => {
      if (video.duration && video.currentTime >= video.duration - 0.18) {
        video.pause();
      }
    };

    video.play().catch(() => undefined);
    video.addEventListener('timeupdate', holdFinalFrame);

    return () => {
      video.removeEventListener('timeupdate', holdFinalFrame);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'relative',
        width: 'min(92vw, 860px)',
        aspectRatio: '16 / 9',
        borderRadius: 28,
        overflow: 'hidden',
        background: '#f5eef2',
        boxShadow: '0 32px 80px rgba(49,41,44,0.22)',
      }}
    >
      <video
        ref={videoRef}
        src="/uploads/videos/success-car.mp4"
        aria-label="Baku Roses çatdırılma maşını"
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,248,251,0) 58%, rgba(255,248,251,0.16))',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}

export function DeliverySuccessOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,248,251,0.97)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '58%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 1rem 1.75rem',
        }}
      >
        <SuccessCarVideo />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1], delay: 0.6 }}
        style={{ textAlign: 'center', padding: '1.25rem 2rem 0' }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            margin: '0 0 0.6rem',
          }}
        >
          Sifarişiniz qəbul edildi
        </p>
        <p
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.4rem)',
            fontWeight: 600,
            color: 'var(--color-text)',
            lineHeight: 1.15,
            margin: '0 0 0.75rem',
            fontFamily: 'var(--font-display, serif)',
          }}
        >
          Yolda olacaq!
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Sifarişiniz hazırlanır, tezliklə çatdırılacaq.
        </p>
      </motion.div>
    </div>
  );
}
