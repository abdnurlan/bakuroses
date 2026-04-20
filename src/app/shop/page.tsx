'use client';

import Link from 'next/link';
import { CaretLeft } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

import { ProductCard } from '@/features/shop/ProductCard';
import { SEED_PRODUCTS } from '@/features/shop/products.data';
import { fetchProducts } from '@/api/products';
import { useLang } from '@/providers/LanguageProvider';
import { RevealOnScroll } from '@/shared/ui/RevealOnScroll';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';

export default function ShopPage() {
  const { t } = useLang();

  const { data: apiProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const products = apiProducts ?? SEED_PRODUCTS;

  return (
    <main className="shop-page">
      <section className="section-shell">
        <RevealOnScroll variant="fade">
          <div className="shop-header">
            <Link href="/" className="shop-back-btn">
              <CaretLeft size={16} weight="bold" />
              <span>{t('shop_back')}</span>
            </Link>
            
            <div className="shop-intro">
              <p className="section-kicker">{t('collection_kicker')}</p>
              <h1 className="section-title shop-title">{t('shop_title')}</h1>
              <p className="section-copy shop-copy">{t('shop_copy')}</p>
            </div>
          </div>
        </RevealOnScroll>

        <div className="shop-grid-container">
          <div className="shop-grid">
            {products.map((product, index) => (
              <RevealOnScroll 
                key={product.id} 
                variant="slide-up" 
                delay={index * 0.05}
              >
                <ProductCard product={product} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span className="site-footer-mark">Baku Roses</span>
        <span className="site-footer-copy">
          © {new Date().getFullYear()} · {t('footer_rights')}
        </span>
      </footer>
    </main>
  );
}
