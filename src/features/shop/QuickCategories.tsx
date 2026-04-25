'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';
import { RevealOnScroll } from '@/shared/ui/RevealOnScroll';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { ArrowRight } from '@phosphor-icons/react';

const CATEGORIES = [
  {
    id: 'petite',
    titleKey: 'quick_cat_1_title',
    descKey: 'quick_cat_1_desc',
    href: '/shop?price=petite',
    image: '/images/products/dinner-mini.png',
  },
  {
    id: 'signature',
    titleKey: 'quick_cat_2_title',
    descKey: 'quick_cat_2_desc',
    href: '/shop?price=signature',
    image: '/images/products/pastel-tulip-cloud.png',
  },
  {
    id: 'premium',
    titleKey: 'quick_cat_3_title',
    descKey: 'quick_cat_3_desc',
    href: '/shop?price=premium',
    image: '/images/products/peony-bouquet.png',
  },
  {
    id: 'boxes',
    titleKey: 'quick_cat_4_title',
    descKey: 'quick_cat_4_desc',
    href: '/shop?category=boxes',
    image: '/images/products/morning-rose-box.png',
  },
] as const;

function CategoryCard({
  cat,
  t,
}: {
  cat: typeof CATEGORIES[number];
  t: (key: TranslationKey) => string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [canHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 160, damping: 20 });
  const sy = useSpring(y, { stiffness: 160, damping: 20 });
  
  // Subtle 3D rotation
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);

  // Image parallax
  const imgX = useTransform(sx, [-0.5, 0.5], ['-2%', '2%']);
  const imgY = useTransform(sy, [-0.5, 0.5], ['-2%', '2%']);

  const onMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!canHover) return;
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link href={cat.href} passHref legacyBehavior>
      <motion.a
        ref={cardRef}
        className="quick-category-card"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div className="quick-category-bg" style={{ x: imgX, y: imgY }}>
          <Image
            src={cat.image}
            alt={t(cat.titleKey)}
            fill
            className="quick-category-img"
            sizes="(max-width: 640px) 100vw, (max-width: 920px) 50vw, 25vw"
          />
        </motion.div>
        
        <div className="quick-category-overlay" />
        
        <div className="quick-category-arrow">
          <ArrowRight size={20} weight="bold" />
        </div>

        <div className="quick-category-content">
          <h3 className="quick-category-title">{t(cat.titleKey)}</h3>
          <p className="quick-category-desc">{t(cat.descKey)}</p>
        </div>
      </motion.a>
    </Link>
  );
}

export function QuickCategories() {
  const { t } = useLang();

  return (
    <section className="section-shell" style={{ paddingBottom: '2rem' }}>
      <RevealOnScroll variant="fade" style={{ marginBottom: '3.5rem' }}>
        <div className="section-heading" style={{ alignItems: 'flex-start', textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
          <p className="section-kicker">{t('quick_kicker')}</p>
          <AnimatedTitleReveal as="h2" className="section-title" text={t('quick_title')} />
        </div>
      </RevealOnScroll>

      <div className="quick-categories-grid">
        {CATEGORIES.map((cat, i) => (
          <RevealOnScroll key={cat.id} variant="slide-up" delay={i * 0.1}>
            <CategoryCard cat={cat} t={t} />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
