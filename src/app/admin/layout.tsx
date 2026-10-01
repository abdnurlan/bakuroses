import type { Metadata } from 'next';
import { RootDocument } from '@/widgets/RootDocument';
import { AdminShell } from './AdminShell';

export const metadata: Metadata = {
  title: 'Baku Roses | Premium Gül Evi',
  description: 'Bakıda seçilmiş buketlər, premium gül kompozisiyaları və zövqlə hazırlanmış çatdırılma təcrübəsi.',
};

// Separate root layout for the admin panel (Azerbaijani UI).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument lang="az">
      <AdminShell>{children}</AdminShell>
    </RootDocument>
  );
}
