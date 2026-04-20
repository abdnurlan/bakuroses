import { OrderForm } from '@/features/order/OrderForm';

export const metadata = {
  title: 'Sifariş Ver | Baku Roses',
};

export default function OrderPage() {
  return (
    <main style={{ paddingTop: '6rem', paddingBottom: '4rem', minHeight: '100vh' }}>
      <OrderForm />
    </main>
  );
}
