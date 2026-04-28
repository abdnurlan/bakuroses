'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowsOutSimple, Check, ShoppingBag, X } from '@phosphor-icons/react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';


import { Product } from '@/entities/product/types';
import { useAppStore } from '@/shared/store';
import { useLang } from '@/providers/LanguageProvider';
import { getCategoryName } from '@/lib/i18n';

interface ProductCardProps {
  product: Product;
}

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

export function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const addToCart = useAppStore((s) => s.addToCart);
  const { locale, t } = useLang();
  const cardRef = useRef<HTMLElement>(null);

  const numericId = product.id.match(/\d+/)?.[0] ?? '1';
  const productNumber = numericId.padStart(2, '0').slice(-2);
  const hoverImage = product.galleryImages?.find((img) => img !== product.imageUrl) ?? product.imageUrl;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // On touch/mobile canHover is false, so spring updates never fire — safe to always create
  const sx = useSpring(x, { stiffness: 160, damping: 20 });
  const sy = useSpring(y, { stiffness: 160, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], canHover ? [5, -5] : [0, 0]);
  const rotateY = useTransform(sx, [-0.5, 0.5], canHover ? [-5, 5] : [0, 0]);
  const imgX = useTransform(sx, [-0.5, 0.5], canHover ? ['-3%', '3%'] : ['0%', '0%']);
  const imgY = useTransform(sy, [-0.5, 0.5], canHover ? ['-3%', '3%'] : ['0%', '0%']);
  const [glossPos, setGlossPos] = useState({ x: 50, y: 50 });
  const isExpanded = canHover ? hovered : true;

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncCanHover = () => setCanHover(media.matches);

    syncCanHover();
    media.addEventListener('change', syncCanHover);

    return () => {
      media.removeEventListener('change', syncCanHover);
    };
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover) return;
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    x.set(nx);
    y.set(ny);
    setGlossPos({ x: (nx + 0.5) * 100, y: (ny + 0.5) * 100 });
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <motion.article
        ref={cardRef}
        className="pc"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
        whileTap={{ scale: 0.975 }}
      >
      {/* image */}
      <div className="pc-media">
        <motion.div className="pc-img-wrap" style={{ x: imgX, y: imgY }}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="pc-img pc-img-base"
            sizes="(max-width: 640px) 100vw, (max-width: 920px) 50vw, (max-width: 1180px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
          {canHover && hoverImage !== product.imageUrl && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              className="pc-img pc-img-hover"
              sizes="(max-width: 640px) 100vw, (max-width: 920px) 50vw, (max-width: 1180px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          )}
        </motion.div>

        <div className="pc-vignette" />

        <button
          type="button"
          className="pc-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            setViewerOpen(true);
          }}
          aria-label={t('product_view_large')}
        >
          <ArrowsOutSimple size={15} weight="bold" />
        </button>

        <div className="pc-top">
          <div className="pc-top-tags">
            <span className="pc-number">№ {productNumber}</span>
          </div>
          <motion.span
            className="pc-price"
            animate={isExpanded ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {product.price.toFixed(0)}&nbsp;₼
          </motion.span>
        </div>

        <div className="pc-bottom">
          <motion.div
            className="pc-name-wrap"
            animate={isExpanded ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
            transition={{ duration: 0.36 }}
          >
            <h3 className="pc-name">{product.name}</h3>
            {product.subtitle && <p className="pc-sub">{product.subtitle}</p>}
          </motion.div>

          <motion.button
            className={`pc-btn ${added ? 'is-added' : ''}`}
            animate={isExpanded ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.36, delay: 0.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleAdd}
            aria-label={added ? t('product_added') : t('product_add')}
          >
            {added ? <Check size={14} weight="bold" /> : <ShoppingBag size={14} weight="bold" />}
            <span>{added ? t('product_added') : t('product_add')}</span>
          </motion.button>
        </div>
      </div>

      {/* footer */}
      <div className="pc-footer">
        <div className="pc-footer-left">
          <span className="pc-footer-name">
            {getCategoryName(locale, product.categorySlug, product.category ?? t('product_ready'))}
          </span>
          <span className="pc-footer-cat">{product.stemNote ?? t('product_ready')}</span>
        </div>
        <motion.button
          className={`pc-footer-btn ${added ? 'is-added' : ''}`}
          whileTap={{ scale: 0.88 }}
          onClick={handleAdd}
          aria-label={added ? t('product_added') : t('product_add')}
        >
          {added ? <Check size={14} weight="bold" /> : <ShoppingBag size={14} weight="bold" />}
        </motion.button>
      </div>

      {/* gloss */}
      <div
        className="pc-gloss"
        style={{
          background: `radial-gradient(ellipse at ${glossPos.x}% ${glossPos.y}%, rgba(255,255,255,0.11) 0%, transparent 62%)`,
        }}
      />
      </motion.article>

      {viewerOpen && createPortal(
        <div className="pc-viewer" role="dialog" aria-modal="true" aria-label={product.name}>
          <button
            type="button"
            className="pc-viewer-close"
            onClick={() => setViewerOpen(false)}
            aria-label={t('cart_close')}
          >
            <X size={22} weight="bold" />
          </button>
          <div className="pc-viewer-frame">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="pc-viewer-img"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
