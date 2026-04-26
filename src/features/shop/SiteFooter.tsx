'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLang } from '@/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';
import {
  InstagramLogo,
  WhatsappLogo,
  TelegramLogo,
  MapPin,
  Phone,
  Envelope,
  ArrowUpRight,
} from '@phosphor-icons/react';

const SOCIAL_LINKS = [
  {
    icon: InstagramLogo,
    label: 'Instagram',
    href: 'https://www.instagram.com/bakuroses/',
    weight: 'fill' as const,
  },
  {
    icon: WhatsappLogo,
    label: 'WhatsApp',
    href: 'https://wa.me/994505050000',
    weight: 'fill' as const,
  },
  {
    icon: TelegramLogo,
    label: 'Telegram',
    href: 'https://t.me/bakuroses',
    weight: 'fill' as const,
  },
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
              <li>
                <a href="tel:+994505050000" className="sf-contact-item">
                  <Phone size={16} weight="fill" className="sf-contact-icon" />
                  <span>+994 50 505 00 00</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@bakuroses.az" className="sf-contact-item">
                  <Envelope size={16} weight="fill" className="sf-contact-icon" />
                  <span>info@bakuroses.az</span>
                </a>
              </li>
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
            © {year} Baku Roses · {t('footer_rights')}
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
