'use client';

import { useState } from 'react';
import { Sparkle, StackPlus } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/entities/product/types';
import { useAppStore } from '@/shared/store';
import { EASE, DURATION } from '@/lib/animation-tokens';

interface ProductCardProps {
  product: Product;
}

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const addToCart = useAppStore((s) => s.addToCart);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.article
      className="product-card"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        y: -10,
        boxShadow: '0 30px 60px rgba(133, 93, 110, 0.16)',
      }}
      transition={{ duration: DURATION.fast, ease: EASE.smooth }}
    >
      <div className="product-card-media">
        <motion.div
          animate={{ scale: isHovered ? 1.065 : 1 }}
          transition={{ duration: DURATION.dramatic, ease: EASE.smooth }}
          style={{ width: '100%', height: '100%' }}
        >
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            style={{ objectFit: 'cover' }}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          />
        </motion.div>

        <div className="product-card-overlay" />

        <div className="product-card-topline">
          <span className="product-card-chip">{product.category}</span>
          <span className="product-card-chip product-card-chip-muted">Studio seçimi</span>
        </div>

        <AnimatePresence>
          {product.stemNote ? (
            <motion.div
              key={product.stemNote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0.78, y: isHovered ? 0 : 4 }}
              transition={{ duration: DURATION.fast, ease: EASE.smooth }}
              className="product-card-note"
            >
              <Sparkle size={14} weight="fill" />
              <span>{product.stemNote}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="product-card-body">
        <div className="product-card-copy">
          <h3 className="font-display product-card-title">{product.name}</h3>
          {product.subtitle ? <p className="product-card-subtitle">{product.subtitle}</p> : null}
        </div>

        <div className="product-card-footer">
          <div className="product-card-pricewrap">
            <span className="product-card-price">{product.price.toFixed(0)} ₼</span>
            <span className="product-card-availability">Sifarişə hazır</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ duration: DURATION.instant }}
            onClick={handleAddToCart}
            className="product-card-button"
          >
            <span className="site-nav-action-inner">
              <span className="site-nav-action-icon">
                <StackPlus size={15} weight="bold" />
              </span>
              <span>{added ? 'Əlavə olundu' : 'Səbətə əlavə et'}</span>
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
