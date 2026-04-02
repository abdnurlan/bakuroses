'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FlowerTulip, List, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CartButton } from '@/features/cart/CartButton';
import { EASE, DURATION } from '@/lib/animation-tokens';
import { getLenis } from '@/shared/lib/lenis';
import { cn } from '@/shared/lib/cn';

const NAV_LINKS = [
  { label: 'Kolleksiya', href: '/#collection', icon: <FlowerTulip size={16} weight="duotone" /> },
];

function NavLink({
  label,
  href,
  icon,
  onNavigate,
  className,
}: {
  label: string;
  href: string;
  icon?: ReactNode;
  onNavigate?: () => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const pathname = usePathname();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/' || !href.includes('#')) {
      return;
    }

    const hash = href.split('#')[1];
    if (!hash) {
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      return;
    }

    event.preventDefault();

    getLenis().scrollTo(target, {
      offset: -24,
      duration: 1.35,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });

    onNavigate?.();
  };

  return (
    <Link
      href={href}
      className={cn('site-nav-action', className)}
      style={{
        position: 'relative',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        textDecoration: 'none',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        transition: 'color 0.2s ease',
      }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="site-nav-action-inner">
        {icon ? <span className="site-nav-action-icon">{icon}</span> : null}
        <span>{label}</span>
      </span>
      {/* Underline reveal */}
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{
          duration: DURATION.fast,
          ease: EASE.smooth,
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'var(--color-accent)',
          transformOrigin: hovered ? 'left center' : 'right center',
          display: 'block',
        }}
      />
    </Link>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="site-nav-wrap">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: 'rgba(252, 247, 244, 0.76)',
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(205, 118, 151, 0.18)',
          boxShadow: '0 16px 36px rgba(138, 113, 120, 0.16)',
        }}
        transition={{ duration: DURATION.fast, ease: EASE.smooth }}
        className="site-nav-shell"
      >
        <Link
          href="/"
          className="font-display site-nav-brand"
          style={{
            textDecoration: 'none',
            color: 'var(--color-text)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/logo.avif"
            alt="Baku Roses"
            width={54}
            height={54}
            priority
            className="site-nav-logo"
          />
        </Link>

        <div className="site-nav-links site-nav-links-desktop">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} label={l.label} href={l.href} icon={l.icon} />
          ))}
          <CartButton className="site-nav-action-fixed site-nav-action-chip" />
        </div>

        <div className="site-nav-mobile-actions">
          <button
            type="button"
            className="site-nav-toggle"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Menyunu bağla' : 'Menyunu aç'}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Menyunu bağla"
              className="site-nav-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: DURATION.fast, ease: EASE.smooth }}
              className="site-nav-mobile-panel"
            >
              <div className="site-nav-mobile-heading">
                <span className="site-nav-mobile-label">Naviqasiya</span>
                <span className="site-nav-mobile-caption">Seçilmiş keçidlər</span>
              </div>

              <div className="site-nav-mobile-links">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.href}
                    label={link.label}
                    href={link.href}
                    icon={link.icon}
                    onNavigate={() => setMobileOpen(false)}
                    className="site-nav-mobile-link"
                  />
                ))}
              </div>

              <div className="site-nav-mobile-footer">
                <CartButton
                  className="site-nav-mobile-cart"
                  onClick={() => setMobileOpen(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
