'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/providers/LanguageProvider';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const MINI_CARDS = [
  { eyebrow: 'atelier_eyebrow_1', title: 'atelier_title_1', copy: 'atelier_copy_1' },
  { eyebrow: 'atelier_eyebrow_2', title: 'atelier_title_2', copy: 'atelier_copy_2' },
  { eyebrow: 'atelier_eyebrow_3', title: 'atelier_title_3', copy: 'atelier_copy_3' },
] as const;

const DETAIL_CARDS = [
  { value: 'signature_same_day', label: 'signature_same_day_label' },
  { value: 'signature_personal', label: 'signature_personal_label' },
  { value: 'signature_custom', label: 'signature_custom_label' },
] as const;

export function AtelierShowcase() {
  const { t } = useLang();

  return (
    <section className="section-shell atelier-shell" aria-labelledby="atelier-title">
      <div className="atelier-grid">
        <motion.article
          className="atelier-feature-card"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.div className="section-heading" variants={fadeUp}>
            <p className="section-kicker">{t('atelier_feature_kicker')}</p>
            <h2 id="atelier-title" className="section-title atelier-title">
              {t('atelier_feature_title')}
            </h2>
            <p className="section-copy atelier-copy">{t('atelier_feature_copy')}</p>
          </motion.div>

          <div className="signature-detail-grid">
            {DETAIL_CARDS.map((item) => (
              <motion.div key={item.value} className="signature-detail-card" variants={fadeUp}>
                <span className="signature-detail-value">{t(item.value)}</span>
                <span className="signature-detail-label">{t(item.label)}</span>
              </motion.div>
            ))}
          </div>
        </motion.article>

        <motion.div
          className="atelier-stack"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.08 }}
        >
          {MINI_CARDS.map((item) => (
            <motion.article key={item.title} className="atelier-mini-card" variants={fadeUp}>
              <p className="atelier-mini-eyebrow">{t(item.eyebrow)}</p>
              <h3 className="atelier-mini-title">{t(item.title)}</h3>
              <p className="atelier-mini-copy">{t(item.copy)}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
