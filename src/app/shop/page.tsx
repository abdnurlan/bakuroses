'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass, SlidersHorizontal, X, CaretDown, CaretUp,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

import { ProductCard } from '@/features/shop/ProductCard';
import { fetchProducts, fetchCategories, type Category } from '@/api/categories';
import { SEED_PRODUCTS } from '@/features/shop/products.data';
import { useLang } from '@/providers/LanguageProvider';
import { SiteFooter } from '@/features/shop/SiteFooter';
import { AnimatedTitleReveal } from '@/shared/ui/AnimatedTitleReveal';
import type { Product } from '@/entities/product/types';

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'newest';

const PRICE_RANGES = [
  { label: '≤ 50 ₼', min: 0, max: 50 },
  { label: '50 – 100 ₼', min: 50, max: 100 },
  { label: '100 – 200 ₼', min: 100, max: 200 },
  { label: '200+ ₼', min: 200, max: undefined },
] as const;

const FALLBACK_CATEGORY_NAMES: Record<string, string> = {
  'premium-kompozisiyalar': 'Premium Kompozisiya və Buketlər',
  'qarisiq-buketler': 'Qarışıq Buketlər',
  'sebet-qutu-kompozisiyalar': 'Səbət və Qutuda Kompozisiyalar',
  'yeni-dogulmus': 'Yeni Doğulmuş Uşaq Çıxışı',
  'toy-ad-guunu-nisar-dekor': 'Toy, Ad günü, Nişan və Nigar Dekorları',
  'yeni-il-kompozisiyalari': 'Yeni İl Kompozisiyaları',
  'mono-buketler': 'Mono Buketlər',
  'gelin-buketleri': 'Gəlin Buketləri',
  novruz: 'Novruz',
  art: 'Art',
};

function categoryKey(product: Product) {
  return product.categorySlug ?? product.category;
}

function buildCategoriesFromProducts(products: Product[]): Category[] {
  const map = new Map<string, Category>();

  products.forEach((product, index) => {
    const slug = categoryKey(product);
    const existing = map.get(slug);

    if (existing) {
      existing._count = { products: (existing._count?.products ?? 0) + 1 };
      return;
    }

    map.set(slug, {
      id: `fallback-${slug}`,
      slug,
      name: FALLBACK_CATEGORY_NAMES[slug] ?? product.category,
      sortOrder: index,
      isActive: true,
      _count: { products: 1 },
    });
  });

  return Array.from(map.values());
}

function filterProducts(
  products: Product[],
  filters: {
    search: string;
    category: string;
    minPrice?: number;
    maxPrice?: number;
    sort: SortOption;
  },
) {
  const search = filters.search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const matchesSearch = !search
      || product.name.toLowerCase().includes(search)
      || product.subtitle?.toLowerCase().includes(search)
      || product.category.toLowerCase().includes(search);

    const matchesCategory = !filters.category
      || product.categorySlug === filters.category
      || product.category === filters.category;

    const matchesMin = filters.minPrice == null || product.price >= filters.minPrice;
    const matchesMax = filters.maxPrice == null || product.price <= filters.maxPrice;

    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'price_asc') return a.price - b.price;
    if (filters.sort === 'price_desc') return b.price - a.price;
    return 0;
  });
}

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
  const { t } = useLang();
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
    placeholderData: () => buildCategoriesFromProducts(SEED_PRODUCTS),
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
    placeholderData: SEED_PRODUCTS,
    staleTime: 30_000,
  });

  const productSource = productsQuery.data?.length ? productsQuery.data : SEED_PRODUCTS;
  const categories = categoriesQuery.data?.length
    ? categoriesQuery.data
    : buildCategoriesFromProducts(productSource);
  const products = useMemo(
    () => filterProducts(productSource, {
      search: debouncedSearch,
      category: activeCategory,
      minPrice: priceMin,
      maxPrice: priceMax,
      sort,
    }),
    [activeCategory, debouncedSearch, priceMax, priceMin, productSource, sort],
  );
  const isLoading = productsQuery.isLoading && !products.length;
  const isFallbackCatalog = !isLoading
    && (productsQuery.isError || categoriesQuery.isError || !productsQuery.data?.length);

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
              <span className="sf-cat-count">{productSource.length || ''}</span>
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <button
                className={`sf-cat-item ${activeCategory === cat.slug ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? '' : cat.slug)}
              >
                <span className="sf-cat-name">{cat.name}</span>
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
            <div>
              <p className="section-kicker" style={{ marginBottom: '0.35rem' }}>{t('collection_kicker')}</p>
              <AnimatedTitleReveal as="h1" className="shop-title" text={t('shop_title')} />
            </div>

            {/* Mobile filter toggle */}
            <button
              className={`shop-mobile-filter-btn ${mobileSidebarOpen ? 'is-active' : ''}`}
              onClick={() => setMobileSidebarOpen(v => !v)}
            >
              <SlidersHorizontal size={16} weight="bold" />
              {t('shop_filters')}
              {hasFilters && <span className="shop-filter-dot" />}
            </button>
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

            {isFallbackCatalog && (
              <span className="shop-status-note">{t('shop_fallback_catalog')}</span>
            )}

            {/* Active pills */}
            <div className="shop-active-filters">
              {activeCategory && (
                <span className="shop-active-pill">
                  <span>{categories.find(c => c.slug === activeCategory)?.name ?? activeCategory}</span>
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
