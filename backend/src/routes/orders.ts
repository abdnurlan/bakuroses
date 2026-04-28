import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { generateOrderCode } from '../services/orderCode';
import { createEpointPayment } from '../services/epoint';
import { queueEmail } from '../services/email';
import { emitOrderStatus } from '../services/socket';
import { haversineDistance } from '../services/maps';
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
  paymentType: z.enum(['epoint']),
  zoneId: z.string(),
  promoCode: z.string().optional(),
});

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: '✅ Sifariş Təsdiqləndi', body: 'Sifarişiniz təsdiqləndi.' },
  CANCELLED: { title: '❌ Ləğv Edildi', body: 'Sifarişiniz ləğv edildi.' },
};

const ORDER_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED'] as const;

const UpdateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

function maskPhone(phone: string): string {
  return phone.length <= 4 ? '****' : `${'*'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
}

async function notifyByStatus(order: { id: string; code: string; customerName: string; address: string; total: number; items: { product: { name: string }; quantity: number; price: number }[] }, status: string) {
  if (status === 'CONFIRMED') {
    await queueEmail(
      process.env.ADMIN_EMAIL!,
      `Yeni Sifariş #${order.code}`,
      'new-order-admin',
      { order }
    ).catch(console.error);
  }
}

router.post('/', validate(CreateOrderSchema), asyncHandler(async (req, res) => {
  const { name, phone, address, lat, lng, note, items, paymentType, zoneId, promoCode } = req.body;

  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone || !zone.isActive) {
    res.status(400).json({ error: 'Zone not found' });
    return;
  }

  const distanceFromZoneCenter = haversineDistance(lat, lng, zone.centerLat, zone.centerLng);
  if (distanceFromZoneCenter > zone.radiusKm) {
    res.status(400).json({ error: 'Selected address is outside the selected delivery zone' });
    return;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: { productId: string }) => i.productId) }, isActive: true },
  });

  const requestedProductIds = new Set(items.map((i: { productId: string }) => i.productId));
  if (products.length !== requestedProductIds.size) {
    res.status(400).json({ error: 'One or more products are unavailable' });
    return;
  }

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

  const deliveryFee = zone.deliveryFee;
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
      status: 'PENDING_PAYMENT',
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

  const payment = await createEpointPayment({
    orderId: order.id,
    amount: total,
    currency: 'AZN',
    description: `Order #${order.code}`,
    successRedirectUrl: `${process.env.CLIENT_URL}/success?order_id=${order.id}`,
    failRedirectUrl: `${process.env.CLIENT_URL}/error?order_id=${order.id}`,
  });

  if (payment.status !== 'success' || !payment.redirect_url) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    res.status(502).json({ error: 'Payment gateway error. Please try again.' });
    return;
  }

  res.json({ orderId: order.id, paymentUrl: payment.redirect_url });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: true } },
      zone: true,
      delivery: true,
    },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({
    ...order,
    customerPhone: maskPhone(order.customerPhone),
  });
}));

router.get('/:id/status', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, status: true, updatedAt: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json(order);
}));

router.put('/:id/status', adminGuard, validate(UpdateStatusSchema), asyncHandler(async (req, res) => {
  const { status } = req.body as { status: typeof ORDER_STATUSES[number] };

  const currentOrder = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { payment: true },
  });

  if (!currentOrder) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (
    currentOrder.status === 'PENDING_PAYMENT' &&
    currentOrder.paymentType === 'epoint' &&
    currentOrder.payment?.status !== 'PAID' &&
    status !== 'CANCELLED'
  ) {
    res.status(400).json({ error: 'Online payment must be paid before confirming this order' });
    return;
  }

  if (currentOrder.status === status) {
    res.json(currentOrder);
    return;
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: { include: { product: true } } },
  });

  emitOrderStatus(order.id, order.status);
  await notifyByStatus(order, order.status);

  res.json(order);
}));

router.get('/', adminGuard, asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;
  const status = typeof req.query.status === 'string' && ORDER_STATUSES.includes(req.query.status as typeof ORDER_STATUSES[number])
    ? req.query.status as typeof ORDER_STATUSES[number]
    : undefined;
  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, zone: true, payment: true, promoCode: true },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page, limit });
}));

export { STATUS_MESSAGES };
export default router;
