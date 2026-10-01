import { Inter, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import Script from 'next/script';
import '@/app/globals.css';
import { LenisProvider } from '@/widgets/LenisProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';

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

// Shared <html> shell for both root layouts ([locale] and admin), so each can
// set its own `lang` attribute.
export function RootDocument({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html lang={lang} className={`${displayFont.variable} ${bodyFont.variable} ${priceFont.variable}`}>
      <body className="app-shell antialiased">
        {/* lazyOnload, not afterInteractive: gtag.js is ~193 KB, the single
            largest resource on the page, and competed with hydration for the
            main thread. Analytics does not need to beat first paint. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F9EY1KF98E"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-F9EY1KF98E');
        `}</Script>
        <div className="site-ambience" aria-hidden="true">
          <span className="site-ambience__blob site-ambience__blob--rose" />
          <span className="site-ambience__blob site-ambience__blob--olive" />
          <span className="site-ambience__blob site-ambience__blob--ivory" />
          <span className="site-ambience__grain" />
        </div>
        <QueryProvider>
          <MotionConfig reducedMotion="user">
            <LenisProvider>
              {children}
              <ToastProvider />
            </LenisProvider>
          </MotionConfig>
        </QueryProvider>
      </body>
    </html>
  );
}
