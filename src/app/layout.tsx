import type { Metadata } from 'next';
import { Inter, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import { LenisProvider } from '@/widgets/LenisProvider';
import { PageTransition } from '@/widgets/PageTransition';
import { SiteShell } from '@/widgets/SiteShell';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${priceFont.variable}`}>
      <body className="app-shell antialiased">
        <div className="site-ambience" aria-hidden="true">
          <span className="site-ambience__blob site-ambience__blob--rose" />
          <span className="site-ambience__blob site-ambience__blob--olive" />
          <span className="site-ambience__blob site-ambience__blob--ivory" />
          <span className="site-ambience__grain" />
        </div>
        <QueryProvider>
          <LanguageProvider>
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
