import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE, translations } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = translations[locale];

  return {
    title: t.meta_shop_title,
    description: t.shop_copy,
    alternates: {
      canonical: `/${locale}/shop`,
      languages: {
        az: '/az/shop',
        en: '/en/shop',
        ru: '/ru/shop',
        'x-default': '/az/shop',
      },
    },
  };
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
