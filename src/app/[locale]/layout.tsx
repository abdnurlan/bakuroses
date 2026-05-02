import { isLocale, DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { SiteShell } from '@/widgets/SiteShell';
import { PageTransition } from '@/widgets/PageTransition';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

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
    <LanguageProvider initialLocale={locale}>
      <SiteShell>
        <PageTransition>{children}</PageTransition>
      </SiteShell>
    </LanguageProvider>
  );
}
