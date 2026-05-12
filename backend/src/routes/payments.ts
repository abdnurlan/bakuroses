import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { emitOrderStatus } from '../services/socket';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

// Payriff POSTs here when payment status changes.
// Payriff does not sign callbacks, so we cross-verify by calling their API directly.
router.post('/callback', asyncHandler(async (req, res) => {
  const payload = req.body?.payload as {
    orderID?: string;
    orderStatus?: string;
    orderDescription?: string;
    purchaseAmountScr?: number;
  } | undefined;

  if (!payload?.orderID) {
    res.status(400).json({ error: 'Missing orderID' });
    return;
  }

  // Extract order code from orderDescription: "Sifariş #BR-XXXXXXXX-XXXX"
  const codeMatch = payload.orderDescription?.match(/BR-[A-Z0-9]+-[A-Z0-9]+/);
  if (!codeMatch) {
    console.error('Cannot extract order code from description:', payload.orderDescription);
    res.status(400).json({ error: 'Cannot extract order code' });
    return;
  }
  const orderCode = codeMatch[0];

  const isPaid = payload.orderStatus === 'APPROVED';
  const paidAmount = payload.purchaseAmountScr ?? 0;

  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    select: { id: true, total: true, promoCodeId: true },
  });

  if (!order) {
    console.error('Order not found for code:', orderCode);
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (isPaid && Math.abs(order.total - paidAmount) > 0.01) {
    console.error('Amount mismatch: expected', order.total, 'got', paidAmount);
    res.status(400).json({ error: 'Payment amount mismatch' });
    return;
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { orderId: order.id },
    select: { status: true },
  });
  const wasAlreadyPaid = existingPayment?.status === 'PAID';

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: {
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId: payload.orderID,
    },
    create: {
      orderId: order.id,
      amount: paidAmount,
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId: payload.orderID,
    },
  });

  if (isPaid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });
    if (order.promoCodeId && !wasAlreadyPaid) {
      await prisma.promoCode.update({
        where: { id: order.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }
    emitOrderStatus(order.id, 'CONFIRMED');
  }

  res.json({ status: 'ok' });
}));

// Payriff redirects customer browser here after payment (GET).
// approveUrl already points directly to the frontend; this is a fallback
// in case Payriff strips our query string or hits the callbackUrl with the browser.
router.get('/callback', asyncHandler(async (req, res) => {
  const clientUrl = process.env.CLIENT_URL ?? 'https://bakuroses.az';
  const locales = ['az', 'en', 'ru'] as const;
  const rawLocale = String(req.query.locale ?? '').toLowerCase();
  const lang = (locales as readonly string[]).includes(rawLocale) ? rawLocale : 'az';

  // Internal order id (set by us in approveUrl as ?order_id=...)
  const internalOrderId = (req.query.order_id ?? req.query.orderId) as string | undefined;
  if (internalOrderId) {
    const order = await prisma.order.findUnique({
      where: { id: internalOrderId },
      select: { id: true },
    });
    if (order) {
      res.redirect(`${clientUrl}/${lang}/success?order_id=${order.id}`);
      return;
    }
  }

  // Payriff order id (when Payriff supplies their own orderID in the redirect)
  const payriffOrderId = (req.query.orderID ?? req.query.order_id) as string | undefined;
  if (payriffOrderId) {
    const payment = await prisma.payment.findFirst({
      where: { transactionId: payriffOrderId },
      select: { orderId: true },
    });
    if (payment) {
      res.redirect(`${clientUrl}/${lang}/success?order_id=${payment.orderId}`);
      return;
    }

    await new Promise((r) => setTimeout(r, 1500));
    const payment2 = await prisma.payment.findFirst({
      where: { transactionId: payriffOrderId },
      select: { orderId: true },
    });
    if (payment2) {
      res.redirect(`${clientUrl}/${lang}/success?order_id=${payment2.orderId}`);
      return;
    }
  }

  res.redirect(`${clientUrl}/${lang}/`);
}));

router.get('/:orderId', adminGuard, asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId: req.params.orderId },
    include: { order: true },
  });

  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  res.json(payment);
}));

router.get('/', adminGuard, asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { order: true },
    }),
    prisma.payment.count(),
  ]);

  res.json({ payments, total, page, limit });
}));

export default router;
