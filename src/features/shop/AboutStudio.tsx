'use client';

import Image from 'next/image';
import {
  ChatCircleText,
  CreditCard,
  FlowerTulip,
  Sparkle,
  Timer,
  Truck,
  UserFocus,
  UsersThree,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { useLang } from '@/providers/LanguageProvider';

const ABOUT_IMAGES = {
  main: '/images/studio/about-main.png',
  detail: '/images/studio/about-detail.png',
  table: '/images/studio/about-table.png',
};

const ABOUT_STEPS = [
  { title: 'about_step_1_title', copy: 'about_step_1_copy' },
  { title: 'about_step_2_title', copy: 'about_step_2_copy' },
  { title: 'about_step_3_title', copy: 'about_step_3_copy' },
] as const;

const ABOUT_STATS = [
  { value: 'about_stat_1_value', label: 'about_stat_1_label' },
  { value: 'about_stat_2_value', label: 'about_stat_2_label' },
  { value: 'about_stat_3_value', label: 'about_stat_3_label' },
] as const;

const ABOUT_REASONS = [
  { key: 'about_reason_1', icon: FlowerTulip },
  { key: 'about_reason_2', icon: UsersThree },
  { key: 'about_reason_3', icon: Truck },
  { key: 'about_reason_4', icon: UserFocus },
  { key: 'about_reason_5', icon: Sparkle },
  { key: 'about_reason_6', icon: CreditCard },
  { key: 'about_reason_7', icon: Timer },
  { key: 'about_reason_8', icon: ChatCircleText },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function AboutStudio() {
  const { t } = useLang();

  return (
    <section className="section-shell about-studio-shell">
      <div className="about-studio-layout">
        <div className="about-studio-copy">
          <motion.p
            className="section-kicker about-studio-kicker"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
          >
            {t('about_kicker')}
          </motion.p>

          <AnimatedTitleReveal
            as="h2"
            className="section-title about-studio-title"
            text={t('about_title')}
          />

          <motion.p
            className="about-studio-lead"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.33, 1, 0.68, 1] }}
          >
            {t('about_copy')}
          </motion.p>

          <motion.p
            className="about-studio-note"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.33, 1, 0.68, 1] }}
          >
            {t('about_extra')}
          </motion.p>

          <motion.div
            className="about-studio-meta"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ staggerChildren: 0.08 }}
          >
            {ABOUT_STATS.map((stat) => (
              <motion.div key={stat.value} className="about-studio-stat" variants={fadeUp}>
                <span className="about-studio-stat-value">{t(stat.value)}</span>
                <span className="about-studio-stat-label">{t(stat.label)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="about-studio-visual"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.75, ease: [0.33, 1, 0.68, 1] }}
        >
          <motion.div
            className="about-studio-image about-studio-image-main"
            whileHover={{ scale: 0.985 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          >
            <Image
              src={ABOUT_IMAGES.main}
              alt={t('about_image_alt_main')}
              fill
              sizes="(max-width: 920px) 100vw, 48vw"
              className="about-studio-img"
            />
            <div className="about-studio-image-shade" />
            <div className="about-studio-signature">
              <span>{t('about_signature')}</span>
              <span>{t('about_location')}</span>
            </div>
          </motion.div>

          <motion.div
            className="about-studio-image about-studio-image-detail"
            whileHover={{ y: -8 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          >
            <Image
              src={ABOUT_IMAGES.detail}
              alt={t('about_image_alt_detail')}
              fill
              sizes="(max-width: 920px) 44vw, 18vw"
              className="about-studio-img"
            />
          </motion.div>

          <motion.div
            className="about-studio-image about-studio-image-table"
            whileHover={{ y: 8 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          >
            <Image
              src={ABOUT_IMAGES.table}
              alt={t('about_image_alt_table')}
              fill
              sizes="(max-width: 920px) 44vw, 18vw"
              className="about-studio-img"
            />
          </motion.div>

          <span className="about-studio-thread" aria-hidden="true" />
        </motion.div>

        <motion.div
          className="about-studio-steps"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-12% 0px' }}
          transition={{ staggerChildren: 0.1 }}
        >
          {ABOUT_STEPS.map((step, index) => (
            <motion.article key={step.title} className="about-studio-step" variants={fadeUp}>
              <span className="about-studio-step-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{t(step.title)}</h3>
              <p>{t(step.copy)}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="about-studio-reasons"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-12% 0px' }}
          transition={{ staggerChildren: 0.055 }}
        >
          <motion.div className="about-studio-reasons-head" variants={fadeUp}>
            <span>{t('about_reasons_title')}</span>
            <p>{t('about_reasons_intro')}</p>
          </motion.div>

          <ul className="about-studio-reasons-list">
            {ABOUT_REASONS.map((reason, index) => {
              const Icon = reason.icon;

              return (
                <motion.li
                  key={reason.key}
                  className="about-studio-reason-card"
                  variants={fadeUp}
                  transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
                >
                  <span className="about-studio-reason-icon">
                    <Icon size={21} weight="duotone" />
                  </span>
                  <span className="about-studio-reason-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="about-studio-reason-text">{t(reason.key)}</span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
