'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLang } from '@/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';
import {
  InstagramLogo,
  WhatsappLogo,
  MapPin,
  Phone,
  ArrowUpRight,
} from '@phosphor-icons/react';

const SOCIAL_LINKS = [
  {
    icon: InstagramLogo,
    label: 'Instagram',
    href: 'https://www.instagram.com/baku.roses/',
    weight: 'fill' as const,
  },
];

const CONTACT_NUMBERS = [
  { label: '+994 50 705 11 15', plain: '994507051115' },
  { label: '+994 55 705 11 18', plain: '994557051118' },
];

const NAV_LINKS = [
  { labelKey: 'nav_collection', href: '/shop' },
  { labelKey: 'nav_about', href: '/about' },
  { labelKey: 'nav_testimonials', href: '/testimonials' },
] satisfies { labelKey: TranslationKey; href: string }[];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function SiteFooter() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="sf-root">
      <div className="sf-glow" aria-hidden="true" />

      <div className="sf-inner">
        {/* ─── Top row ─── */}
        <motion.div
          className="sf-top"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
        >
          {/* Brand col */}
          <motion.div className="sf-brand-col" variants={fadeUp}>
            <Link href="/" className="sf-logo-link">
              <span className="sf-wordmark">Baku Roses</span>
            </Link>
            <p className="sf-tagline">
              {t('about_location')}
            </p>

            {/* Social */}
            <div className="sf-socials">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href, weight }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="sf-social-btn"
                >
                  <Icon size={20} weight={weight} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Nav col */}
          <motion.div className="sf-nav-col" variants={fadeUp}>
            <p className="sf-col-title">{t('nav_collection')}</p>
            <ul className="sf-link-list">
              {NAV_LINKS.map(({ labelKey, href }) => (
                <li key={labelKey}>
                  <Link href={href} className="sf-link">
                    <ArrowUpRight size={14} weight="bold" className="sf-link-icon" />
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact col */}
          <motion.div className="sf-contact-col" variants={fadeUp}>
            <p className="sf-col-title">{t('nav_order')}</p>
            <ul className="sf-contact-list">
              {CONTACT_NUMBERS.map((number) => (
                <li key={number.plain} className="sf-contact-number-row">
                  <span className="sf-contact-number">{number.label}</span>
                  <a
                    href={`tel:+${number.plain}`}
                    className="sf-contact-action"
                    aria-label={`${number.label} zəng et`}
                  >
                    <Phone size={16} weight="fill" />
                  </a>
                  <a
                    href={`https://wa.me/${number.plain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sf-contact-action"
                    aria-label={`${number.label} WhatsApp`}
                  >
                    <WhatsappLogo size={16} weight="fill" />
                  </a>
                </li>
              ))}
              <li>
                <span className="sf-contact-item sf-no-link">
                  <MapPin size={16} weight="fill" className="sf-contact-icon" />
                  <span>Bakı, Azərbaycan</span>
                </span>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* ─── Divider ─── */}
        <div className="sf-divider" />

        {/* ─── Bottom row ─── */}
        <div className="sf-bottom">
          <span className="sf-copy">
            © {year} Baku Roses · {t('footer_rights')} ·{' '}
            <a
              href="https://www.instagram.com/codalov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="sf-copy-link"
            >
              {t('footer_credit')}
            </a>
          </span>
          <div className="sf-bottom-links">
            <a href="/privacy" className="sf-bottom-link">Privacy</a>
            <span className="sf-bottom-dot">·</span>
            <a href="/delivery" className="sf-bottom-link">{t('cta_stat_delivery')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
