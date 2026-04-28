'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from '@phosphor-icons/react';
import { fetchCategories, type Category } from '@/api/categories';
import { RevealOnScroll } from '@/shared/ui/RevealOnScroll';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { useLang } from '@/providers/LanguageProvider';

const FALLBACK_CATEGORIES: Category[] = [];

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 22 });
  const sy = useSpring(y, { stiffness: 180, damping: 22 });
  const rotateX = useTransform(sy, [-0.5, 0.5], canHover ? [5, -5] : [0, 0]);
  const rotateY = useTransform(sx, [-0.5, 0.5], canHover ? [-5, 5] : [0, 0]);
  const imgX = useTransform(sx, [-0.5, 0.5], canHover ? ['-3%', '3%'] : ['0%', '0%']);
  const imgY = useTransform(sy, [-0.5, 0.5], canHover ? ['-3%', '3%'] : ['0%', '0%']);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const isFeatured = index === 0 || index === 2;

  return (
    <Link href={`/shop?category=${cat.slug}`} className={`cat-card ${isFeatured ? 'cat-card--featured' : ''}`}>
      <motion.div
        ref={wrapRef}
        className="cat-card__inner"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
        whileTap={{ scale: 0.975 }}
        data-index={index + 1}
      >
        <motion.div className="cat-card__bg" style={{ x: imgX, y: imgY }}>
          {cat.imageUrl && (
            <Image
              src={cat.imageUrl}
              alt={cat.name}
              fill
              className="cat-card__img"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
        </motion.div>

        <div className="cat-card__overlay" />

        <div className="cat-card__num">
          {String(index + 1).padStart(2, '0')}
        </div>

        <motion.div
          className="cat-card__arrow"
          animate={hovered ? { x: 0, opacity: 1 } : { x: -6, opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <ArrowRight size={18} weight="bold" />
        </motion.div>

        <div className="cat-card__content">
          <motion.h3
            className="cat-card__name"
            animate={hovered ? { y: 0 } : { y: 4 }}
            transition={{ duration: 0.28 }}
          >
            {cat.name}
          </motion.h3>
          {cat.description && (
            <motion.p
              className="cat-card__desc"
              animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.28, delay: 0.04 }}
            >
              {cat.description}
            </motion.p>
          )}
        </div>

        <div className="cat-card__gloss" aria-hidden />
      </motion.div>
    </Link>
  );
}

export function CategorySection() {
  const { t } = useLang();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const cats = categories ?? FALLBACK_CATEGORIES;

  return (
    <section className="cat-section section-shell" aria-labelledby="cat-section-title">
      <RevealOnScroll variant="fade" style={{ marginBottom: '3.5rem' }}>
        <div className="section-heading" style={{ alignItems: 'flex-start', textAlign: 'left', maxWidth: '820px', margin: '0 auto' }}>
          <p className="section-kicker">{t('cat_section_kicker')}</p>
          <AnimatedTitleReveal id="cat-section-title" as="h2" className="section-title" text={t('cat_section_title')} />
          <p className="section-copy">{t('cat_section_copy')}</p>
        </div>
      </RevealOnScroll>

      <div className="cat-grid">
        {cats.map((cat, i) => (
          <RevealOnScroll key={cat.id} variant="slide-up" delay={i * 0.07}>
            <CategoryCard cat={cat} index={i} />
          </RevealOnScroll>
        ))}
      </div>

      <RevealOnScroll variant="fade" style={{ marginTop: '3rem', textAlign: 'center' }}>
        <Link href="/shop" className="cat-section__see-all">
          {t('cat_section_see_all')}
          <ArrowRight size={16} weight="bold" />
        </Link>
      </RevealOnScroll>
    </section>
  );
}
