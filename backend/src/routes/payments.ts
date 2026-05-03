import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { getPayriffOrderStatus, type PayriffCallbackPayload } from '../services/payriff';
import { emitOrderStatus } from '../services/socket';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

// Payriff POSTs here when payment status changes.
// Payriff does not sign callbacks, so we cross-verify by calling their API directly.
router.post('/callback', asyncHandler(async (req, res) => {
  const body = req.body as { code?: string; payload?: PayriffCallbackPayload };

  const payriffOrderId = body?.payload?.orderId;
  if (!payriffOrderId) {
    res.status(400).json({ error: 'Missing orderId in callback' });
    return;
  }

  // Cross-verify with Payriff API — do not trust the callback body alone
  let verified: PayriffCallbackPayload;
  try {
    verified = await getPayriffOrderStatus(payriffOrderId);
  } catch (err) {
    console.error('Payriff status check failed:', err);
    res.status(502).json({ error: 'Could not verify payment status' });
    return;
  }

  const internalOrderId = verified.transactions?.[0]
    ? undefined
    : undefined;

  // Payriff stores our internalOrderId in metadata — it comes back in the callback body
  const metadata = (req.body as { payload?: { metadata?: { internalOrderId?: string } } })
    ?.payload?.metadata;
  const orderId = metadata?.internalOrderId;

  if (!orderId) {
    res.status(400).json({ error: 'Missing internalOrderId in callback metadata' });
    return;
  }

  const isPaid = verified.paymentStatus === 'APPROVED';

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, total: true, promoCodeId: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (isPaid && Math.abs(order.total - verified.amount) > 0.01) {
    res.status(400).json({ error: 'Payment amount mismatch' });
    return;
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { orderId },
    select: { status: true },
  });
  const wasAlreadyPaid = existingPayment?.status === 'PAID';

  await prisma.payment.upsert({
    where: { orderId },
    update: {
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId: payriffOrderId,
    },
    create: {
      orderId,
      amount: verified.amount,
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId: payriffOrderId,
    },
  });

  if (isPaid) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
    if (order.promoCodeId && !wasAlreadyPaid) {
      await prisma.promoCode.update({
        where: { id: order.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }
    emitOrderStatus(orderId, 'CONFIRMED');
  }

  res.json({ status: 'ok' });
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
