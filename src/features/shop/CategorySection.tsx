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

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-mono', slug: 'mono-buketler', name: 'Mono Buketlər', description: 'Tək növ güldən hazırlanmış minimalist buketlər', imageUrl: 'https://images.unsplash.com/photo-1548094990-c16ca90f1f0d?w=900&q=80', sortOrder: 1, isActive: true },
  { id: 'cat-qarisiq', slug: 'qarisiq-buketler', name: 'Qarışıq Buketlər', description: 'Müxtəlif güllərin uyğun birləşməsindən yaranan buketlər', imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&q=80', sortOrder: 2, isActive: true },
  { id: 'cat-premium', slug: 'premium-kompozisiyalar', name: 'Premium Kompozisiya və Buketlər', description: 'Seçilmiş premium güllərdən hazırlanmış lüks kompozisiyalar', imageUrl: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=900&q=80', sortOrder: 3, isActive: true },
  { id: 'cat-sebet', slug: 'sebet-qutu-kompozisiyalar', name: 'Səbət və Qutuda Kompozisiyalar', description: 'Səbət və xüsusi qutu içində təqdim olunan gül kompozisiyaları', imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80', sortOrder: 4, isActive: true },
  { id: 'cat-gelin', slug: 'gelin-buketleri', name: 'Gəlin Buketləri', description: 'Toy mərasimləri üçün xüsusi hazırlanmış gəlin buketləri', imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80', sortOrder: 5, isActive: true },
  { id: 'cat-art', slug: 'art', name: 'Art', description: 'Floristik sənət əsərləri — klassik çərçivədən kənara çıxan kompozisiyalar', imageUrl: 'https://images.unsplash.com/photo-1487530811015-780be3279e8f?w=900&q=80', sortOrder: 6, isActive: true },
  { id: 'cat-newborn', slug: 'yeni-dogulmus', name: 'Yeni Doğulmuş Uşaq Çıxışı', description: 'Yeni doğulan uşaq üçün xüsusi hazırlanmış zərif buket və kompozisiyalar', imageUrl: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=900&q=80', sortOrder: 7, isActive: true },
  { id: 'cat-yeni-il', slug: 'yeni-il-kompozisiyalari', name: 'Yeni İl Kompozisiyaları', description: 'Yeni il və qış mövsümü üçün xüsusi dekorlu çiçək kompozisiyaları', imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900&q=80', sortOrder: 8, isActive: true },
  { id: 'cat-novruz', slug: 'novruz', name: 'Novruz', description: 'Novruz bayramı ruhunu əks etdirən milli koloritli gül kompozisiyaları', imageUrl: 'https://images.unsplash.com/photo-1444930694458-01babf71870c?w=900&q=80', sortOrder: 9, isActive: true },
  { id: 'cat-dekor', slug: 'toy-ad-guunu-nisar-dekor', name: 'Toy, Ad günü, Nişan və Nigar Dekorları', description: 'Xüsusi tədbirlər üçün tam məkan bəzəyi və dekor həlləri', imageUrl: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=900&q=80', sortOrder: 10, isActive: true },
];

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
  const rotateX = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const imgX = useTransform(sx, [-0.5, 0.5], ['-3%', '3%']);
  const imgY = useTransform(sy, [-0.5, 0.5], ['-3%', '3%']);

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
