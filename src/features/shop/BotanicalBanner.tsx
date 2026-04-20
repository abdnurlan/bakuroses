'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { EASE, DURATION } from '@/lib/animation-tokens';
import { useLang } from '@/providers/LanguageProvider';

// Static — no API calls
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1490750967868-88df5691cc1a?w=1600&q=85';

export function BotanicalBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const { t } = useLang();

  return (
    <section
      ref={sectionRef}
      style={{
        width: 'min(var(--content-max), calc(100vw - 3rem))',
        height: '72vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
        margin: '0 auto',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <motion.div
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: DURATION.dramatic, ease: EASE.dramatic }}
      >
        <motion.div style={{ position: 'absolute', inset: '-10%', y: imageY }}>
          <Image
            src={BANNER_IMAGE}
            alt="Botanical"
            fill
            quality={90}
            style={{ objectFit: 'cover' }}
            sizes="100vw"
          />
        </motion.div>
      </motion.div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(34,29,26,0.04) 10%, rgba(34,29,26,0.12) 62%, rgba(34,29,26,0.34) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION.normal, delay: 0.55, ease: EASE.smooth }}
        className="botanical-banner-overlay"
      >
        <div className="botanical-banner-copy">
          <p
            className="botanical-banner-pill"
          >
            {t('banner_kicker')}
          </p>

          <h2
            className="font-display botanical-banner-title"
          >
            {t('banner_title').split('\n')[0]}
            <br />
            {t('banner_title').split('\n')[1]}
          </h2>

          <p
            className="botanical-banner-text"
          >
            {t('banner_copy')}
          </p>
        </div>

        <div className="botanical-banner-note">
          <p
            className="botanical-banner-note-kicker"
          >
            {t('banner_season')}
          </p>
          <p
            className="font-display botanical-banner-note-title"
          >
            {t('banner_flowers').split('\n')[0]}
            <br />
            {t('banner_flowers').split('\n')[1]}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
