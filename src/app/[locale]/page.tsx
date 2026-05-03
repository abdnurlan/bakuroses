'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeroCanvasScrub } from '@/features/hero/HeroCanvasScrub';
import { AboutStudio } from '@/features/shop/AboutStudio';
import { AtelierShowcase } from '@/features/shop/AtelierShowcase';
import { ProductGrid } from '@/features/shop/ProductGrid';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { RevealOnScroll } from '@/shared/ui/RevealOnScroll';
import { Testimonials } from '@/features/shop/Testimonials';
import { SiteFooter } from '@/features/shop/SiteFooter';
import { useLang } from '@/providers/LanguageProvider';
import { useLocalePath } from '@/hooks/useLocalePath';
import { CategorySection } from '@/features/shop/CategorySection';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const CTA_STATS = [
  { value: '08:00–24:00', labelKey: 'cta_stat_delivery' },
  { value: '2020', labelKey: 'cta_stat_since' },
  { value: '100%', labelKey: 'cta_stat_fresh' },
] as const;

export default function HomePage() {
  const { t } = useLang();
  const lp = useLocalePath();

  return (
    <main>
      <HeroCanvasScrub />

      <CategorySection />

      <section id="collection" className="section-shell collection-shell" aria-labelledby="collection-title">
        <RevealOnScroll variant="fade">
          <div className="section-heading">
            <p className="section-kicker">{t('collection_kicker')}</p>
            <AnimatedTitleReveal id="collection-title" as="h2" className="section-title" text={t('collection_title')} />
            <p className="section-copy">{t('collection_copy')}</p>
          </div>
        </RevealOnScroll>
      </section>

      <div style={{ width: '100%', overflow: 'hidden', paddingBottom: '50px' }}>
        <ProductGrid />
      </div>

      <AboutStudio />

      <AtelierShowcase />

      <Testimonials />

      <section className="final-cta-shell">
        <div className="final-cta-inner">
          <div className="final-cta-glow" aria-hidden="true" />

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
              <Link href={lp('/shop')} className="final-cta-btn-primary">
                {t('cta_btn_collection')}
              </Link>
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

          <div className="final-cta-petal final-cta-petal-1" aria-hidden="true" />
          <div className="final-cta-petal final-cta-petal-2" aria-hidden="true" />
          <div className="final-cta-petal final-cta-petal-3" aria-hidden="true" />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
