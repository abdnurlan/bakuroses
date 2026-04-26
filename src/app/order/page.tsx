import { OrderForm } from '@/features/order/OrderForm';

export const metadata = {
  title: 'Sifariş Ver | Baku Roses',
};

export default function OrderPage() {
  return (
    <main className="order-page">
      <OrderForm />
    </main>
  );
}
