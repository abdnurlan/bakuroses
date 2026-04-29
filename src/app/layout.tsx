import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import { LenisProvider } from '@/widgets/LenisProvider';
import { PageTransition } from '@/widgets/PageTransition';
import { SiteShell } from '@/widgets/SiteShell';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { LANGUAGE_COOKIE, isLocale } from '@/lib/i18n';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const priceFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-price',
});

export const metadata: Metadata = {
  title: 'Baku Roses | Premium Gül Evi',
  description: 'Bakıda seçilmiş buketlər, premium gül kompozisiyaları və zövqlə hazırlanmış çatdırılma təcrübəsi.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const storedLocale = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const initialLocale = isLocale(storedLocale) ? storedLocale : 'az';

  return (
    <html lang={initialLocale} className={`${displayFont.variable} ${bodyFont.variable} ${priceFont.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-F9EY1KF98E" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-F9EY1KF98E');
            `,
          }}
        />
      </head>
      <body className="app-shell antialiased">
        <div className="site-ambience" aria-hidden="true">
          <span className="site-ambience__blob site-ambience__blob--rose" />
          <span className="site-ambience__blob site-ambience__blob--olive" />
          <span className="site-ambience__blob site-ambience__blob--ivory" />
          <span className="site-ambience__grain" />
        </div>
        <QueryProvider>
          <LanguageProvider initialLocale={initialLocale}>
            <MotionConfig reducedMotion="user">
              <LenisProvider>
                <SiteShell>
                  <PageTransition>{children}</PageTransition>
                </SiteShell>
                <ToastProvider />
              </LenisProvider>
            </MotionConfig>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
