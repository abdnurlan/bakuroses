'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, X, ShoppingBag } from '@phosphor-icons/react';

const links = [
  { label: 'Albom', href: '/shop' },
  { label: 'Kataloq', href: '/shop' },
  { label: 'Haqqımızda', href: '/about' },
  { label: 'Əlaqə', href: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.4s, box-shadow 0.4s',
        background: scrolled ? 'rgba(250,250,249,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span
            className="font-display"
            style={{
              fontSize: '1.6rem',
              fontWeight: 600,
              color: '#18181b',
              letterSpacing: '-0.02em',
            }}
          >
            Baku<span style={{ color: '#e11d48' }}>roses</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#52525b',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e11d48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
              className="hidden md:block"
            >
              {l.label}
            </Link>
          ))}

          <Link
            href="/shop"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#e11d48',
              color: '#fff',
              padding: '0.5rem 1.25rem',
              borderRadius: '2px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.15s',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#be123c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#e11d48';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            className="!hidden md:!flex"
          >
            <ShoppingBag size={16} weight="bold" />
            Sifariş ver
          </Link>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#18181b',
              padding: '4px',
            }}
            className="md:hidden"
          >
            {open ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            background: 'rgba(250,250,249,0.98)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid #e4e4e7',
            padding: '1.5rem 2rem 2rem',
          }}
          className="md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '0.75rem 0',
                fontSize: '1rem',
                fontWeight: 500,
                color: '#18181b',
                textDecoration: 'none',
                borderBottom: '1px solid #f4f4f5',
                transition: 'color 0.2s',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
              background: '#e11d48',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '2px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={16} weight="bold" />
            Sifariş ver
          </Link>
        </div>
      )}
    </header>
  );
}
