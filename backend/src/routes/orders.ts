import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateOrderCode } from '../services/orderCode';
import { createEpointPayment } from '../services/epoint';
import { queueEmail } from '../services/email';
import { emitOrderStatus } from '../services/socket';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const CreateOrderSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  note: z.string().optional(),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .min(1),
  paymentType: z.enum(['cash', 'epoint']),
  zoneId: z.string(),
  promoCode: z.string().optional(),
});

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: '✅ Sifariş Təsdiqləndi', body: 'Sifarişiniz hazırlanır.' },
  PREPARING: { title: '👨‍🍳 Hazırlanır', body: 'Atölyemiz sifarişiniz üzərində işləyir.' },
  ON_THE_WAY: { title: '🛵 Yolda', body: 'Kuryerimiz sizə doğru gəlir!' },
  DELIVERED: { title: '📦 Çatdırıldı', body: 'Sifarişinizdən zövq alın!' },
  CANCELLED: { title: '❌ Ləğv Edildi', body: 'Sifarişiniz ləğv edildi.' },
};

async function notifyByStatus(order: { id: string; code: string; customerName: string; address: string; total: number; items: { product: { name: string }; quantity: number; price: number }[] }, status: string) {
  if (status === 'CONFIRMED') {
    await queueEmail(
      process.env.ADMIN_EMAIL!,
      `Yeni Sifariş #${order.code}`,
      'new-order-admin',
      { order }
    ).catch(console.error);
  }
  if (status === 'ON_THE_WAY') {
    await queueEmail(
      process.env.ADMIN_EMAIL!,
      `Sifariş #${order.code} yolda`,
      'order-on-the-way',
      { order }
    ).catch(console.error);
  }
}

router.post('/', validate(CreateOrderSchema), async (req, res) => {
  const { name, phone, address, lat, lng, note, items, paymentType, zoneId, promoCode, deliveryFee: clientDeliveryFee } = req.body;

  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) {
    res.status(400).json({ error: 'Zone not found' });
    return;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
  });

  const subtotal = items.reduce((sum: number, item: { productId: string; quantity: number }) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  let discountAmount = 0;
  let promoCodeId: string | null = null;

  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode.toUpperCase().trim() },
    });

    if (promo && promo.isActive &&
      (!promo.expiresAt || promo.expiresAt > new Date()) &&
      (promo.maxUses === null || promo.usedCount < promo.maxUses) &&
      (promo.minOrderAmount === null || subtotal >= promo.minOrderAmount)
    ) {
      discountAmount = promo.discountType === 'percent'
        ? Math.min((subtotal * promo.discountValue) / 100, subtotal)
        : Math.min(promo.discountValue, subtotal);
      discountAmount = parseFloat(discountAmount.toFixed(2));
      promoCodeId = promo.id;
    }
  }

  // Use server-side zone delivery fee (not client-provided value)
  const deliveryFee = zone.deliveryFee ?? (clientDeliveryFee ?? 0);
  const total = parseFloat((subtotal + deliveryFee - discountAmount).toFixed(2));

  const order = await prisma.order.create({
    data: {
      code: generateOrderCode(),
      customerName: name,
      customerPhone: phone,
      address,
      lat,
      lng,
      note,
      total,
      deliveryFee,
      discountAmount,
      promoCodeId,
      paymentType,
      status: paymentType === 'cash' ? 'CONFIRMED' : 'PENDING_PAYMENT',
      zoneId,
      items: {
        create: items.map((item: { productId: string; quantity: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: products.find((p) => p.id === item.productId)!.price,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  if (promoCodeId) {
    await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: { usedCount: { increment: 1 } },
    });
  }

  if (paymentType === 'cash') {
    await notifyByStatus(order, 'CONFIRMED');
  }

  if (paymentType === 'epoint') {
    const payment = await createEpointPayment({
      orderId: order.id,
      amount: total,
      currency: 'AZN',
      description: `Order #${order.code}`,
      successRedirectUrl: `${process.env.CLIENT_URL}/track/${order.id}?payment=success`,
      failRedirectUrl: `${process.env.CLIENT_URL}/track/${order.id}?payment=fail`,
    });
    res.json({ orderId: order.id, paymentUrl: payment.redirect_url });
    return;
  }

  res.json({ orderId: order.id, trackingUrl: `/track/${order.id}` });
});

router.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: true } },
      zone: true,
      payment: true,
      delivery: true,
    },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json(order);
});

router.get('/:id/status', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, status: true, updatedAt: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json(order);
});

router.put('/:id/status', adminGuard, async (req, res) => {
  const { status } = req.body as { status: string };

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: status as never },
    include: { items: { include: { product: true } } },
  });

  emitOrderStatus(order.id, order.status);
  await notifyByStatus(order, order.status);

  res.json(order);
});

router.get('/', adminGuard, async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, zone: true, payment: true, promoCode: true },
    }),
    prisma.order.count(),
  ]);

  res.json({ orders, total, page, limit });
});

export { STATUS_MESSAGES };
export default router;
