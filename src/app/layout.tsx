import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { FloatingCartButton } from '@/features/cart/FloatingCartButton';
import { LenisProvider } from '@/widgets/LenisProvider';
import { Navbar } from '@/widgets/Navbar';
import { PageTransition } from '@/widgets/PageTransition';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Baku Roses | Premium Gül Evi',
  description: 'Bakıda seçilmiş buketlər, premium gül kompozisiyaları və zövqlə hazırlanmış çatdırılma təcrübəsi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="app-shell antialiased">
        <MotionConfig reducedMotion="user">
          <LenisProvider>
            <Navbar />
            <CartDrawer />
            <FloatingCartButton />
            <PageTransition>{children}</PageTransition>
          </LenisProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
