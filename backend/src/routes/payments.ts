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

// Payriff redirects customer browser here after payment (GET)
router.get('/callback', asyncHandler(async (req, res) => {
  const clientUrl = process.env.CLIENT_URL ?? 'https://bakuroses.az';
  // Payriff sends orderID (their ID) — find our internal order by transactionId
  const payriffOrderId = (req.query.orderID ?? req.query.orderId ?? req.query.order_id) as string | undefined;

  if (payriffOrderId) {
    const payment = await prisma.payment.findFirst({
      where: { transactionId: payriffOrderId },
      select: { orderId: true },
    });
    if (payment) {
      res.redirect(`${clientUrl}/az/success?order_id=${payment.orderId}`);
      return;
    }
  }

  res.redirect(`${clientUrl}/az/`);
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
