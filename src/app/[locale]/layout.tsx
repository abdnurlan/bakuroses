import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE, LOCALES, translations } from '@/lib/i18n';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { RootDocument } from '@/widgets/RootDocument';
import { SiteShell } from '@/widgets/SiteShell';
import { PageTransition } from '@/widgets/PageTransition';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = translations[locale];

  return {
    metadataBase: new URL('https://bakuroses.az'),
    title: t.meta_title,
    description: t.meta_description,
  };
}

// Root layout: lives under [locale] so <html lang> matches the URL language.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <RootDocument lang={locale}>
      <LanguageProvider initialLocale={locale}>
        <SiteShell>
          <PageTransition>{children}</PageTransition>
        </SiteShell>
      </LanguageProvider>
    </RootDocument>
  );
}
