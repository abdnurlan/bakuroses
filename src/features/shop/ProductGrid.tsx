'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import { SEED_PRODUCTS } from './products.data';
import { fetchProducts } from '@/api/products';
import { useLang } from '@/providers/LanguageProvider';

const CARD_WIDTH = 320; // px
const CARD_BLEED_X = 6; // px, so visible card gap stays 12px
const SPEED = 60;       // px/sec

export function ProductGrid() {
  const { t } = useLang();
  const { data: apiProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const products = apiProducts ?? SEED_PRODUCTS;
  const looped = [...products, ...products, ...products];
  const slideWidth = CARD_WIDTH + CARD_BLEED_X * 2;
  const setWidth = products.length * slideWidth;

  const x = useMotionValue(0);
  const lastTimeRef = useRef<number | null>(null);

  // Drag state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartVal = useRef(0);
  const [cursor, setCursor] = useState<'grab' | 'grabbing'>('grab');

  // Auto-scroll — skips frames while dragging
  useAnimationFrame((time) => {
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

  // Pointer handlers — allow full drag anywhere in viewport
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartVal.current = x.get();
    setCursor('grabbing');
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    let next = dragStartVal.current + delta;
    // keep wrap logic consistent
    if (next > 0) next -= setWidth;
    if (Math.abs(next) >= setWidth) next += setWidth;
    x.set(next);
  };

  const onPointerUp = () => {
    isDragging.current = false;
    lastTimeRef.current = null; // reset timer so no sudden jump on resume
    setCursor('grab');
  };

  return (
    <div className="product-marquee-shell">
      {/* Toolbar */}
      <div className="product-slider-toolbar">
        <div className="product-slider-toolbar-inner">
          <div className="product-slider-head">
            <p className="product-slider-caption">{t('product_count')}</p>
            <Link href="/shop" className="product-slider-see-all">
              {t('product_see_all')}
            </Link>
          </div>
        </div>
      </div>

      {/* Full-width marquee track */}
      <div
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
              <ProductCard product={product} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
