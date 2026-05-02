import type { Metadata } from 'next';
import { Testimonials } from '@/features/shop/Testimonials';
import { SiteFooter } from '@/features/shop/SiteFooter';

export const metadata: Metadata = {
  title: 'Rəylər | Baku Roses',
  description: 'Baku Roses müştərilərinin gül sifarişi və çatdırılma təcrübələri.',
};

export default function TestimonialsPage() {
  return (
    <main>
      <Testimonials />
      <SiteFooter />
    </main>
  );
}
