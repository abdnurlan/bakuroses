import type { Metadata } from 'next';
import { AboutStudio } from '@/features/shop/AboutStudio';
import { AtelierShowcase } from '@/features/shop/AtelierShowcase';
import { SiteFooter } from '@/features/shop/SiteFooter';

export const metadata: Metadata = {
  title: 'Haqqımızda | Baku Roses',
  description: 'Baku Roses studiyası, floristik yanaşması və premium gül hazırlanma prosesi.',
};

export default function AboutPage() {
  return (
    <main>
      <AboutStudio />
      <AtelierShowcase />
      <SiteFooter />
    </main>
  );
}
