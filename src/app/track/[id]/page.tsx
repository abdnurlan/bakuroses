import { TrackingPage } from '@/features/order/TrackingPage';

export const metadata = {
  title: 'Sifarişi İzlə | Baku Roses',
};

interface TrackPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { id } = await params;
  return (
    <main style={{ paddingTop: '6rem', paddingBottom: '4rem', minHeight: '100vh' }}>
      <TrackingPage orderId={id} />
    </main>
  );
}
