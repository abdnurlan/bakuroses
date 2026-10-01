import { activeProvider, type PaymentProvider } from '../config/payment';
import { createPayriffOrder } from './payriff';
import { createChewickPaymentLink, toQapik, type ChewickLineItem } from './chewick';

// One checkout entry point for the whole app. Routes never name a gateway —
// they ask for a payment and get back a URL to redirect the customer to.
// Which gateway answers is decided by PAYMENT_PROVIDER; see config/payment.ts.

export interface CheckoutOrder {
  id: string;
  code: string;
  total: number;
  deliveryFee: number;
  discountAmount: number;
  items: {
    quantity: number;
    price: number;
    product: { name: string; imageUrl: string | null };
  }[];
}

export interface CheckoutResult {
  provider: PaymentProvider;
  /** Gateway-side identifier we store on Payment.transactionId to reconcile later. */
  providerOrderId: string;
  paymentUrl: string;
}

export function currentProvider(): PaymentProvider {
  return activeProvider();
}

export async function createCheckout(
  order: CheckoutOrder,
  lang: 'az' | 'en' | 'ru'
): Promise<CheckoutResult> {
  const provider = activeProvider();

  if (provider === 'chewick') {
    const link = await createChewickPaymentLink({
      name: `Baku Roses #${order.code}`,
      items: buildChewickItems(order),
    });

    return { provider, providerOrderId: link.id, paymentUrl: link.paymentUrl };
  }

  const result = await createPayriffOrder({
    internalOrderId: order.id,
    amount: order.total,
    currency: 'AZN',
    description: `Sifariş #${order.code}`,
    callbackUrl: `${process.env.API_URL}/payments/callback?locale=${lang}`,
    approveUrl: `${process.env.CLIENT_URL}/${lang}/success`,
    cancelUrl: `${process.env.CLIENT_URL}/${lang}/error`,
    declineUrl: `${process.env.CLIENT_URL}/${lang}/error`,
    language: lang.toUpperCase(),
  });

  return { provider, providerOrderId: result.payriffOrderId, paymentUrl: result.paymentUrl };
}

/**
 * Chewick charges the sum of the line items, so the items must add up to
 * `order.total` exactly — in qəpik, to avoid float drift.
 *
 * Delivery fee becomes its own line. A discount can't be expressed as a line
 * (amounts must be >= 1), so a discounted order collapses to a single line
 * showing the real amount due rather than an itemised list that overcharges.
 */
function buildChewickItems(order: CheckoutOrder): ChewickLineItem[] {
  const totalQapik = toQapik(order.total);

  const aggregate = (): ChewickLineItem[] => [
    { name: `Sifariş #${order.code}`, amount: totalQapik, quantity: 1 },
  ];

  if (order.discountAmount > 0) return aggregate();

  const items: ChewickLineItem[] = order.items.map((item) => ({
    name: item.product.name,
    amount: toQapik(item.price),
    quantity: item.quantity,
    ...(absoluteImageUrl(item.product.imageUrl) ? { imageUrl: absoluteImageUrl(item.product.imageUrl)! } : {}),
  }));

  if (order.deliveryFee > 0) {
    items.push({ name: 'Çatdırılma', amount: toQapik(order.deliveryFee), quantity: 1 });
  }

  const sum = items.reduce((acc, i) => acc + i.amount * i.quantity, 0);
  if (sum !== totalQapik || items.some((i) => i.amount < 1)) {
    console.warn(
      `Chewick line items (${sum} qəpik) do not match order ${order.code} total (${totalQapik} qəpik) — sending a single line.`
    );
    return aggregate();
  }

  return items;
}

/** Uploaded product images are stored as `/uploads/...`; Chewick needs a fetchable URL. */
function absoluteImageUrl(imageUrl: string | null): string | undefined {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const apiUrl = process.env.API_URL;
  if (!apiUrl) return undefined;

  try {
    return new URL(imageUrl, new URL(apiUrl).origin).toString();
  } catch {
    return undefined;
  }
}
