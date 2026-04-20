'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import { SEED_PRODUCTS } from './products.data';
import { DURATION, EASE } from '@/lib/animation-tokens';
import { fetchProducts } from '@/api/products';
import { useLang } from '@/providers/LanguageProvider';

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

const sliderPageVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 36 : -36,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -36 : 36,
  }),
};

export function ProductGrid() {
  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const { t } = useLang();

  const { data: apiProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const products = apiProducts ?? SEED_PRODUCTS;

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

    for (let index = 0; index < products.length; index += cardsPerView) {
      result.push(products.slice(index, index + cardsPerView));
    }

    return result;
  }, [cardsPerView, products]);

  const safeCurrentPage = Math.min(currentPage, Math.max(pages.length - 1, 0));
  const activePage = pages[safeCurrentPage] ?? [];
  const maxPage = Math.max(pages.length - 1, 0);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 0), maxPage);

    if (nextPage === safeCurrentPage) {
      return;
    }

    setSlideDirection(nextPage > safeCurrentPage ? 1 : -1);
    setCurrentPage(nextPage);
  };

  const goToPreviousPage = () => {
    goToPage(safeCurrentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(safeCurrentPage + 1);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeDistance = 56;
    const swipeVelocity = 420;

    if (info.offset.x <= -swipeDistance || info.velocity.x <= -swipeVelocity) {
      goToNextPage();
      return;
    }

    if (info.offset.x >= swipeDistance || info.velocity.x >= swipeVelocity) {
      goToPreviousPage();
    }
  };

  return (
    <div className="product-slider-shell">
      <div className="product-slider-toolbar">
        <div className="product-slider-head">
          <p className="product-slider-caption">{t('product_count')}</p>
          <Link href="/shop" className="product-slider-see-all">
            {t('product_see_all')}
          </Link>
        </div>

        <div className="product-slider-controls">
          <button
            type="button"
            className="product-slider-control"
            onClick={goToPreviousPage}
            disabled={safeCurrentPage === 0}
            aria-label={t('product_prev')}
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            className="product-slider-control"
            onClick={goToNextPage}
            disabled={safeCurrentPage >= pages.length - 1}
            aria-label={t('product_next')}
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="product-slider-viewport">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={`${cardsPerView}-${safeCurrentPage}`}
            className="product-slider-page"
            style={{
              gridTemplateColumns: `repeat(${cardsPerView}, minmax(0, 1fr))`,
            }}
            custom={slideDirection}
            variants={sliderPageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: DURATION.fast, ease: EASE.smooth }}
            drag={pages.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
          >
            {activePage.map((product) => (
              <div key={product.id} className="product-slider-slide">
                <ProductCard product={product} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="product-slider-pagination" aria-label={t('product_pagination')}>
        {pages.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`product-slider-dot${index === safeCurrentPage ? ' is-active' : ''}`}
            onClick={() => goToPage(index)}
            aria-label={`${t('product_page')} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
