'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowsOutSimple, Check, ShoppingBag, X } from '@phosphor-icons/react';

import { Product } from '@/entities/product/types';
import { useAppStore } from '@/shared/store';
import { useLang } from '@/providers/LanguageProvider';
import { getCategoryName } from '@/lib/i18n';
import { useCanHover } from '@/hooks/useCanHover';

interface ProductCardProps {
  product: Product;
  /** next/image `sizes` for the slot the card sits in */
  sizes?: string;
  /** load the photo now instead of when the card nears the viewport (cards in a sideways-scrolling strip) */
  eager?: boolean;
}

const GRID_SIZES = '(max-width: 640px) 100vw, (max-width: 920px) 50vw, (max-width: 1180px) 33vw, 25vw';

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

// Tilt, image parallax and gloss follow the pointer through CSS variables written
// at most once per frame — no React render and no animation library per card.
// The hover reveal (name, price, add button) is pure CSS; see `.pc` in globals.css.
export function ProductCard({ product, sizes = GRID_SIZES, eager = false }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [hoverArmed, setHoverArmed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const canHover = useCanHover();
  const addToCart = useAppStore((s) => s.addToCart);
  const { locale, t } = useLang();
  const cardRef = useRef<HTMLElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);

  const numericId = product.id.match(/\d+/)?.[0] ?? '1';
  const productNumber = numericId.padStart(2, '0').slice(-2);
  const hoverImage = product.galleryImages?.find((img) => img !== product.imageUrl) ?? product.imageUrl;

  const applyPointer = () => {
    frameRef.current = 0;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (pointerRef.current.x - r.left) / r.width - 0.5;
    const ny = (pointerRef.current.y - r.top) / r.height - 0.5;
    el.style.setProperty('--pc-rx', `${(-ny * 10).toFixed(2)}deg`);
    el.style.setProperty('--pc-ry', `${(nx * 10).toFixed(2)}deg`);
    el.style.setProperty('--pc-ix', `${(nx * 6).toFixed(2)}%`);
    el.style.setProperty('--pc-iy', `${(ny * 6).toFixed(2)}%`);
    el.style.setProperty('--pc-gx', `${((nx + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--pc-gy', `${((ny + 0.5) * 100).toFixed(1)}%`);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!canHover) return;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    if (!frameRef.current) frameRef.current = requestAnimationFrame(applyPointer);
  };

  const onMouseLeave = () => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    const el = cardRef.current;
    if (!el) return;
    for (const v of ['--pc-rx', '--pc-ry', '--pc-ix', '--pc-iy', '--pc-gx', '--pc-gy']) el.style.removeProperty(v);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <article
        ref={cardRef}
        className="pc"
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHoverArmed(true)}
        onMouseLeave={onMouseLeave}
      >
      {/* image */}
      <div className="pc-media">
        <div className="pc-img-wrap">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="pc-img pc-img-base"
            sizes={sizes}
            loading={eager ? 'eager' : 'lazy'}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
          {/* second photo is only fetched once the card is actually hovered */}
          {canHover && hoverArmed && hoverImage !== product.imageUrl && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              className="pc-img pc-img-hover"
              sizes={sizes}
            />
          )}
        </div>

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
          <span className="pc-price">
            {product.price.toFixed(0)}&nbsp;₼
          </span>
        </div>

        <div className="pc-bottom">
          <div className="pc-name-wrap">
            <h3 className="pc-name">{product.name}</h3>
            {product.subtitle && <p className="pc-sub">{product.subtitle}</p>}
          </div>

          <button
            type="button"
            className={`pc-btn ${added ? 'is-added' : ''}`}
            onClick={handleAdd}
            aria-label={added ? t('product_added') : t('product_add')}
          >
            {added ? <Check size={14} weight="bold" /> : <ShoppingBag size={14} weight="bold" />}
            <span>{added ? t('product_added') : t('product_add')}</span>
          </button>
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
        <button
          type="button"
          className={`pc-footer-btn ${added ? 'is-added' : ''}`}
          onClick={handleAdd}
          aria-label={added ? t('product_added') : t('product_add')}
        >
          {added ? <Check size={14} weight="bold" /> : <ShoppingBag size={14} weight="bold" />}
        </button>
      </div>

      {/* gloss */}
      <div className="pc-gloss" />
      </article>

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
