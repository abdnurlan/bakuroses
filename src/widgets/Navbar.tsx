'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FlowerTulip, ShoppingCart, List, X } from '@phosphor-icons/react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { CartButton } from '@/features/cart/CartButton';
import { getLenis } from '@/shared/lib/lenis';
import { useHeaderCondensed } from '@/hooks/useHeaderCondensed';
import { useLang } from '@/providers/LanguageProvider';
import { type Locale } from '@/lib/i18n';

const spring: Transition = { type: 'spring', stiffness: 90, damping: 18 };

const LOCALES: { code: Locale; label: string; name: string }[] = [
  { code: 'az', label: 'AZ', name: 'Azərbaycan' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ru', label: 'RU', name: 'Русский' },
];

function NavLink({ label, href, icon, onNavigate, mobile }: {
  label: string;
  href: string;
  icon?: ReactNode;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/' || !href.includes('#')) return;
    const hash = href.split('#')[1];
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    e.preventDefault();
    getLenis().scrollTo(target, { offset: -24, duration: 1.35, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    onNavigate?.();
  };

  return (
    <Link href={href} className={mobile ? 'bk-nav__mobile-link' : 'bk-nav__link'} onClick={handleClick}>
      {icon && <span className="bk-nav__link-icon">{icon}</span>}
      {label}
    </Link>
  );
}

export function Navbar() {
  const isCondensed = useHeaderCondensed(30, 20);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t } = useLang();

  const navLinks = [
    { label: t('nav_collection'), href: '/#collection', icon: <FlowerTulip size={15} weight="duotone" /> },
    { label: t('nav_order'), href: '/order', icon: <ShoppingCart size={15} weight="duotone" /> },
  ];

  return (
    <motion.div
      className="bk-navbar-wrap"
      animate={{ paddingTop: isCondensed ? 12 : 20 }}
      initial={false}
      transition={spring}
    >
      <div className="bk-navbar-container">
        <motion.nav
          layout
          className={`bk-navbar${isCondensed ? ' is-condensed' : ''}`}
          animate={{
            backgroundColor: 'rgba(255, 252, 253, 0.42)',
            backdropFilter: 'blur(18px)',
            borderColor: 'rgba(255, 255, 255, 0.52)',
            paddingTop: isCondensed ? 8 : 14,
            paddingBottom: isCondensed ? 8 : 14,
            paddingLeft: isCondensed ? 16 : 20,
            paddingRight: isCondensed ? 16 : 20,
            maxWidth: isCondensed ? 860 : 1280,
          }}
          initial={false}
          transition={spring}
        >
          {/* LEFT — brand */}
          <motion.div layout transition={spring} className="bk-navbar__brand-col">
            <Link href="/" className="bk-navbar__brand" onClick={() => setMobileOpen(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.avif" alt="Baku Roses" width={46} height={46} className="bk-navbar__logo" />
            </Link>
          </motion.div>

          {/* CENTER — links */}
          <motion.div layout transition={spring} className="bk-navbar__links-col">
            {navLinks.map((l) => (
              <NavLink key={l.href} label={l.label} href={l.href} icon={l.icon} />
            ))}
          </motion.div>

          {/* RIGHT — lang + cta + burger */}
          <motion.div layout transition={spring} className="bk-navbar__actions-col">

            {/* Language switcher */}
            <div ref={langRef} className="bk-lang">
              <button
                type="button"
                className="bk-lang__trigger"
                onClick={() => setLangOpen((v) => !v)}
                aria-expanded={langOpen}
              >
                <span className="bk-lang__code">{locale.toUpperCase()}</span>
                <motion.span
                  animate={{ rotate: langOpen ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="bk-lang__chevron"
                >
                  ▾
                </motion.span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    className="bk-lang__menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {LOCALES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className={`bk-lang__option${item.code === locale ? ' is-active' : ''}`}
                        onClick={() => { setLocale(item.code); setLangOpen(false); }}
                      >
                        <span className="bk-lang__option-code">{item.label}</span>
                        <span className="bk-lang__option-name">{item.name}</span>
                        <span className="bk-lang__option-check">✓</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <CartButton className="bk-navbar__cta" />

            <button
              type="button"
              className="bk-navbar__burger"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t('nav_close') : t('nav_open')}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span key="x" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.16 }}>
                    <X size={18} weight="bold" />
                  </motion.span>
                ) : (
                  <motion.span key="m" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.16 }}>
                    <List size={18} weight="bold" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </motion.nav>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              ref={dropdownRef}
              className="bk-navbar__mobile"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {navLinks.map((l) => (
                <NavLink key={l.href} label={l.label} href={l.href} icon={l.icon} mobile onNavigate={() => setMobileOpen(false)} />
              ))}
              <div className="bk-navbar__mobile-divider" />
              {/* Mobile lang */}
              <div className="bk-navbar__mobile-langs">
                {LOCALES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`bk-navbar__mobile-lang-btn${item.code === locale ? ' is-active' : ''}`}
                    onClick={() => { setLocale(item.code); setMobileOpen(false); }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="bk-navbar__mobile-divider" />
              <CartButton className="bk-navbar__mobile-cta" onClick={() => setMobileOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
