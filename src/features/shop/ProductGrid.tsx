'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import { fetchProducts } from '@/api/products';
import type { Product } from '@/entities/product/types';
import { useLang } from '@/providers/LanguageProvider';
import { useLocalePath } from '@/hooks/useLocalePath';

const CARD_WIDTH = 320; // px
const CARD_BLEED_X = 6; // px, so visible card gap stays 12px
const SPEED = 80;       // px/sec
// The marquee is a teaser — the full catalogue lives on /shop. Rendering every
// product (×3 for the loop) put 700+ animated cards in the DOM.
const MARQUEE_LIMIT = 16;
const WIDEST_VIEWPORT = 2560;

/** up to `limit` products, alternating categories so the teaser shows the range */
function pickShowcase(products: Product[], limit: number): Product[] {
  const byCategory = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.categorySlug ?? '';
    const list = byCategory.get(key);
    if (list) list.push(p);
    else byCategory.set(key, [p]);
  }
  const queues = [...byCategory.values()];
  const picked: Product[] = [];
  for (let round = 0; picked.length < limit && queues.some((q) => q.length > round); round++) {
    for (const q of queues) {
      if (q[round] && picked.length < limit) picked.push(q[round]);
    }
  }
  return picked;
}

export function ProductGrid() {
  const { t } = useLang();
  const lp = useLocalePath();
  const reduceMotion = useReducedMotion();
  const { data: apiProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const products = pickShowcase(apiProducts ?? [], MARQUEE_LIMIT);
  const slideWidth = CARD_WIDTH + CARD_BLEED_X * 2;
  const setWidth = products.length * slideWidth;
  // enough copies that the loop never shows a gap, even on a very wide screen
  const copies = setWidth > 0 ? Math.max(2, Math.ceil(WIDEST_VIEWPORT / setWidth) + 1) : 0;
  const looped = Array.from({ length: copies }, () => products).flat();

  const x = useMotionValue(0);
  const lastTimeRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Drag state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartVal = useRef(0);
  const [cursor, setCursor] = useState<'grab' | 'grabbing'>('grab');

  // Auto-scroll — skips frames while dragging or off-screen
  useAnimationFrame((time) => {
    if (reduceMotion || !isVisibleRef.current) {
      lastTimeRef.current = null;
      return;
    }
    if (isDragging.current) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const delta = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    let next = x.get() - SPEED * delta;
    if (Math.abs(next) >= setWidth) next += setWidth;
    x.set(next);
  });

  const hasDragged = useRef(false);
  const DRAG_THRESHOLD = 5;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Let button clicks pass through untouched
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragStartVal.current = x.get();
    setCursor('grabbing');
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) hasDragged.current = true;
    let next = dragStartVal.current + delta;
    if (next > 0) next -= setWidth;
    if (Math.abs(next) >= setWidth) next += setWidth;
    x.set(next);
  };

  const onPointerUp = () => {
    isDragging.current = false;
    hasDragged.current = false;
    lastTimeRef.current = null;
    setCursor('grab');
  };

  return (
    <div className="product-marquee-shell">
      {/* Toolbar */}
      <div className="product-slider-toolbar">
        <div className="product-slider-toolbar-inner">
          <div className="product-slider-head">
            <p className="product-slider-caption">{t('product_count')}</p>
            <Link href={lp('/shop')} className="product-slider-see-all">
              {t('product_see_all')}
            </Link>
          </div>
        </div>
      </div>

      {/* Full-width marquee track */}
      <div
        ref={viewportRef}
        className="product-marquee-viewport"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >

        <motion.div
          className="product-marquee-track"
          style={{ x }}
        >
          {looped.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className="product-marquee-slide"
              style={{ width: slideWidth, flexShrink: 0 }}
            >
              <ProductCard product={product} sizes={`${CARD_WIDTH}px`} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
