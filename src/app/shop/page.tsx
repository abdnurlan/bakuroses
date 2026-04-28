'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretDown, CaretLeft, CaretUp, MagnifyingGlass, SlidersHorizontal, X,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

import { ProductCard } from '@/features/shop/ProductCard';
import { fetchProducts, fetchCategories, type Category } from '@/api/categories';
import { useLang } from '@/providers/LanguageProvider';
import { SiteFooter } from '@/features/shop/SiteFooter';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import { useAppStore } from '@/shared/store';
import { getCategoryName } from '@/lib/i18n';

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'newest';

const PRICE_RANGES = [
  { label: '≤ 50 ₼', min: 0, max: 50 },
  { label: '50 – 100 ₼', min: 50, max: 100 },
  { label: '100 – 200 ₼', min: 100, max: 200 },
  { label: '200+ ₼', min: 200, max: undefined },
] as const;

function FilterAccordion({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sf-accordion">
      <button className="sf-accordion__head" onClick={() => setOpen(v => !v)}>
        <span>{title}</span>
        {open ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="sf-accordion__body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShopInner() {
  const { locale, t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? '');
  const [priceMin, setPriceMin] = useState<number | undefined>(
    searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
  );
  const [priceMax, setPriceMax] = useState<number | undefined>(
    searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  );
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) ?? 'default',
  );
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const cartItems = useAppStore((s) => s.cartItems);
  const setUI = useAppStore((s) => s.setUI);
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 360);
    return () => clearTimeout(id);
  }, [search]);

  const pushUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (priceMin != null) params.set('minPrice', String(priceMin));
    if (priceMax != null) params.set('maxPrice', String(priceMax));
    if (sort !== 'default') params.set('sort', sort);
    const query = params.toString();
    const target = query ? `/shop?${query}` : '/shop';
    const current = typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : target;

    if (current !== target) {
      router.replace(target, { scroll: false });
    }
  }, [activeCategory, debouncedSearch, priceMin, priceMax, sort, router]);

  useEffect(() => { pushUrl(); }, [pushUrl]);

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ['products', activeCategory, debouncedSearch, priceMin, priceMax, sort],
    queryFn: () => fetchProducts({
      category: activeCategory || undefined,
      search: debouncedSearch || undefined,
      minPrice: priceMin,
      maxPrice: priceMax,
      sort,
    }),
    staleTime: 30_000,
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const isLoading = productsQuery.isLoading;
  const totalCategoryCount = categories.reduce((sum, cat) => sum + (cat._count?.products ?? 0), 0);

  const hasFilters = !!(activeCategory || debouncedSearch || priceMin != null || priceMax != null || sort !== 'default');

  const clearAll = () => {
    setSearch('');
    setActiveCategory('');
    setPriceMin(undefined);
    setPriceMax(undefined);
    setSort('default');
  };

  const selectPriceRange = (min: number, max?: number) => {
    if (priceMin === min && priceMax === max) {
      setPriceMin(undefined);
      setPriceMax(undefined);
    } else {
      setPriceMin(min);
      setPriceMax(max);
    }
  };

  const sortLabels: Record<SortOption, string> = {
    default: t('shop_sort_default'),
    price_asc: t('shop_sort_price_asc'),
    price_desc: t('shop_sort_price_desc'),
    newest: t('shop_sort_newest'),
  };

  const sidebar = (
    <aside className="shop-sidebar">
      {/* Search */}
      <div className="shop-search-wrap">
        <MagnifyingGlass size={15} className="shop-search-icon" />
        <input
          className="shop-search"
          type="search"
          aria-label={t('shop_search_placeholder')}
          placeholder={t('shop_search_placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="shop-search-clear" onClick={() => setSearch('')} aria-label="clear">
            <X size={13} />
          </button>
        )}
      </div>

      {hasFilters && (
        <button className="shop-clear-all" onClick={clearAll}>
          <X size={13} />
          {t('shop_clear_filters')}
        </button>
      )}

      {/* Category */}
      <FilterAccordion title={t('shop_filter_category')}>
        <ul className="sf-cat-list">
          <li>
            <button
              className={`sf-cat-item ${activeCategory === '' ? 'is-active' : ''}`}
              onClick={() => setActiveCategory('')}
            >
              {t('shop_filter_all')}
              <span className="sf-cat-count">{totalCategoryCount || ''}</span>
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <button
                className={`sf-cat-item ${activeCategory === cat.slug ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? '' : cat.slug)}
              >
                <span className="sf-cat-name">{getCategoryName(locale, cat.slug, cat.name)}</span>
                {cat._count?.products != null && (
                  <span className="sf-cat-count">{cat._count.products}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </FilterAccordion>

      {/* Price */}
      <FilterAccordion title={t('shop_filter_price')}>
        <ul className="sf-price-list">
          {PRICE_RANGES.map(range => (
            <li key={range.label}>
              <button
                className={`sf-price-item ${priceMin === range.min && priceMax === range.max ? 'is-active' : ''}`}
                onClick={() => selectPriceRange(range.min, range.max)}
              >
                {range.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="sf-price-inputs">
          <div className="sf-price-input-wrap">
            <span className="sf-price-cur">₼</span>
            <input
              type="number" min={0}
              className="sf-price-input"
              placeholder={t('shop_price_min')}
              value={priceMin ?? ''}
              onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <span className="sf-price-dash">—</span>
          <div className="sf-price-input-wrap">
            <span className="sf-price-cur">₼</span>
            <input
              type="number" min={0}
              className="sf-price-input"
              placeholder={t('shop_price_max')}
              value={priceMax ?? ''}
              onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
      </FilterAccordion>

      {/* Sort */}
      <FilterAccordion title={t('shop_sort_default')} defaultOpen={false}>
        <ul className="sf-sort-list">
          {(Object.keys(sortLabels) as SortOption[]).map(opt => (
            <li key={opt}>
              <button
                className={`sf-sort-item ${sort === opt ? 'is-active' : ''}`}
                onClick={() => setSort(opt)}
              >
                {sortLabels[opt]}
              </button>
            </li>
          ))}
        </ul>
      </FilterAccordion>
    </aside>
  );

  return (
    <main className="shop-page">
      <div className="shop-layout">

        {/* ── Desktop sidebar ── */}
        <div className="shop-sidebar-col">
          {sidebar}
        </div>

        {/* ── Main content ── */}
        <div className="shop-main-col">

          {/* Header */}
          <div className="shop-main-head">
            <div className="shop-head-copy">
              <Link href="/" className="shop-home-link" aria-label="Ana səhifəyə qayıt">
                <CaretLeft size={15} weight="bold" />
                <span>Geri</span>
              </Link>
              <div>
                <p className="section-kicker" style={{ marginBottom: '0.35rem' }}>{t('collection_kicker')}</p>
                <AnimatedTitleReveal as="h1" className="shop-title" text={t('shop_title')} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Mobile filter toggle */}
              <button
                className={`shop-mobile-filter-btn ${mobileSidebarOpen ? 'is-active' : ''}`}
                onClick={() => setMobileSidebarOpen(v => !v)}
              >
                <SlidersHorizontal size={16} weight="bold" />
                {t('shop_filters')}
                {hasFilters && <span className="shop-filter-dot" />}
              </button>

              {/* Cart button */}
              <button
                className="shop-cart-btn"
                onClick={() => setUI({ isCartOpen: true })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Səbətə keç
                {cartCount > 0 && <span className="shop-cart-btn-badge">{cartCount}</span>}
              </button>
            </div>
          </div>

          {/* Mobile sidebar drawer */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <motion.div
                className="shop-mobile-sidebar"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.26 }}
              >
                {sidebar}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar row */}
          <div className="shop-topbar">
            <span className="shop-result-count">
              {isLoading ? '…' : t('shop_result_count').replace('{n}', String(products.length))}
            </span>

            {/* Active pills */}
            <div className="shop-active-filters">
              {activeCategory && (
                <span className="shop-active-pill">
                  <span>
                    {(() => {
                      const category = categories.find(c => c.slug === activeCategory);
                      return getCategoryName(locale, category?.slug ?? activeCategory, category?.name ?? activeCategory);
                    })()}
                  </span>
                  <button onClick={() => setActiveCategory('')}><X size={11} /></button>
                </span>
              )}
              {(priceMin != null || priceMax != null) && (
                <span className="shop-active-pill">
                  <span>{priceMin != null ? `${priceMin} ₼` : '0 ₼'} – {priceMax != null ? `${priceMax} ₼` : '∞'}</span>
                  <button onClick={() => { setPriceMin(undefined); setPriceMax(undefined); }}><X size={11} /></button>
                </span>
              )}
              {debouncedSearch && (
                <span className="shop-active-pill">
                  <span>&quot;{debouncedSearch}&quot;</span>
                  <button onClick={() => setSearch('')}><X size={11} /></button>
                </span>
              )}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="shop-grid shop-grid--loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shop-skeleton" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              className="shop-empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="shop-empty-title">{t('shop_no_results')}</p>
              <p className="shop-empty-sub">{t('shop_no_results_sub')}</p>
              <button className="shop-chip is-active" style={{ marginTop: '0.5rem' }} onClick={clearAll}>
                {t('shop_clear_filters')}
              </button>
            </motion.div>
          ) : (
            <motion.div className="shop-grid" layout>
              <AnimatePresence mode="popLayout">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.28) }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

function ShopSkeleton() {
  return (
    <main className="shop-page">
      <div className="shop-layout">
        <div className="shop-sidebar-col">
          <div className="shop-sidebar" style={{ minHeight: 420 }} />
        </div>
        <div className="shop-main-col">
          <div className="shop-main-head">
            <div style={{ height: 48, width: 240, borderRadius: 8, background: 'rgba(186,123,145,0.1)' }} />
          </div>
          <div className="shop-grid shop-grid--loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shop-skeleton" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopInner />
    </Suspense>
  );
}
