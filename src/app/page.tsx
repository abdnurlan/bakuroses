'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeroCanvasScrub } from '@/features/hero/HeroCanvasScrub';
import { AboutStudio } from '@/features/shop/AboutStudio';
import { ProductGrid } from '@/features/shop/ProductGrid';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { RevealOnScroll } from '@/shared/ui/RevealOnScroll';
import { Testimonials } from '@/features/shop/Testimonials';
import { useLang } from '@/providers/LanguageProvider';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const CTA_STATS = [
  { value: '24/7', labelKey: 'cta_stat_delivery' },
  { value: '2020', labelKey: 'cta_stat_since' },
  { value: '100%', labelKey: 'cta_stat_fresh' },
] as const;

export default function HomePage() {
  const { t } = useLang();

  return (
    <main>
      <HeroCanvasScrub />

      <AboutStudio />

      <section id="collection" className="section-shell collection-shell">
        <RevealOnScroll variant="fade" style={{ marginBottom: '4rem' }}>
          <div className="section-heading">
            <p className="section-kicker">{t('collection_kicker')}</p>
            <AnimatedTitleReveal as="h2" className="section-title" text={t('collection_title')} />
            <p className="section-copy">{t('collection_copy')}</p>
          </div>
        </RevealOnScroll>
        <ProductGrid />
      </section>

      <Testimonials />

      {/* ── Final CTA ── */}
      <section className="final-cta-shell">
        <div className="final-cta-inner">
          <motion.div
            className="final-cta-glow"
            animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.75, 0.55] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />

          <motion.div
            className="final-cta-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.05 }}
          >
            <motion.p className="final-cta-kicker" variants={fadeUp}>
              {t('cta_kicker')}
            </motion.p>

            <motion.h2 className="final-cta-title" variants={fadeUp}>
              {t('cta_title').split('\n').map((line, i) => (
                <span key={i} style={{ display: 'block' }}>{line}</span>
              ))}
            </motion.h2>

            <motion.p className="final-cta-copy" variants={fadeUp}>
              {t('cta_copy')}
            </motion.p>

            <motion.div className="final-cta-actions" variants={fadeUp}>
              <Link href="/shop" className="final-cta-btn-primary">
                {t('cta_btn_collection')}
              </Link>
              <a
                href="https://wa.me/994XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="final-cta-btn-ghost"
              >
                {t('cta_btn_whatsapp')}
              </a>
            </motion.div>

            <motion.div className="final-cta-stats" variants={fadeUp}>
              {CTA_STATS.map(({ value, labelKey }) => (
                <div key={labelKey} className="final-cta-stat">
                  <span className="final-cta-stat-value">{value}</span>
                  <span className="final-cta-stat-label">{t(labelKey)}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="final-cta-petal final-cta-petal-1"
            animate={{ rotate: [0, 8, -4, 0], y: [0, -10, 5, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <motion.div
            className="final-cta-petal final-cta-petal-2"
            animate={{ rotate: [0, -6, 10, 0], y: [0, 12, -6, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            aria-hidden="true"
          />
          <motion.div
            className="final-cta-petal final-cta-petal-3"
            animate={{ rotate: [0, 12, -8, 0], y: [0, -8, 12, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            aria-hidden="true"
          />
        </div>
      </section>

      <footer className="site-footer">
        <span className="site-footer-mark">Baku Roses</span>
        <span className="site-footer-copy">
          © {new Date().getFullYear()} · {t('footer_rights')}
        </span>
      </footer>
    </main>
  );
}
