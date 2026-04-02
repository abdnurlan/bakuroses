'use client';

import { useEffect, useMemo, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { SEED_PRODUCTS } from './products.data';
import { DURATION, EASE } from '@/lib/animation-tokens';

function getCardsPerView(width: number) {
  if (width <= 640) {
    return 1;
  }

  if (width <= 920) {
    return 2;
  }

  if (width <= 1180) {
    return 3;
  }

  return 4;
}

export function ProductGrid() {
  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const syncCardsPerView = () => {
      setCardsPerView(getCardsPerView(window.innerWidth));
    };

    syncCardsPerView();
    window.addEventListener('resize', syncCardsPerView);

    return () => {
      window.removeEventListener('resize', syncCardsPerView);
    };
  }, []);

  const pages = useMemo(() => {
    const result = [];

    for (let index = 0; index < SEED_PRODUCTS.length; index += cardsPerView) {
      result.push(SEED_PRODUCTS.slice(index, index + cardsPerView));
    }

    return result;
  }, [cardsPerView]);

  const safeCurrentPage = Math.min(currentPage, Math.max(pages.length - 1, 0));
  const activePage = pages[safeCurrentPage] ?? [];

  return (
    <div className="product-slider-shell">
      <div className="product-slider-toolbar">
        <p className="product-slider-caption">Seçilmiş 10 buket və kompozisiya</p>

        <div className="product-slider-controls">
          <button
            type="button"
            className="product-slider-control"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
            disabled={safeCurrentPage === 0}
            aria-label="Əvvəlki məhsullar"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            className="product-slider-control"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, pages.length - 1))}
            disabled={safeCurrentPage >= pages.length - 1}
            aria-label="Növbəti məhsullar"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="product-slider-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cardsPerView}-${safeCurrentPage}`}
            className="product-slider-page"
            style={{
              gridTemplateColumns: `repeat(${activePage.length}, minmax(0, 1fr))`,
            }}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: DURATION.fast, ease: EASE.smooth }}
          >
            {activePage.map((product) => (
              <div key={product.id} className="product-slider-slide">
                <ProductCard product={product} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="product-slider-pagination" aria-label="Kolleksiya səhifələri">
        {pages.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`product-slider-dot${index === safeCurrentPage ? ' is-active' : ''}`}
            onClick={() => setCurrentPage(index)}
            aria-label={`Səhifə ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
