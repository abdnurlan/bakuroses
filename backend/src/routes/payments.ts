import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { verifyEpointSignature } from '../services/epoint';
import { emitOrderStatus } from '../services/socket';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.post('/callback', asyncHandler(async (req, res) => {
  const { data, signature } = req.body as { data: string; signature: string };

  if (!verifyEpointSignature(data, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  let decoded: { status: string; order_id: string; transaction: string; amount: number };
  try {
    decoded = JSON.parse(Buffer.from(data, 'base64').toString());
  } catch {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const isPaid = decoded.status === '1';
  const order = await prisma.order.findUnique({
    where: { id: decoded.order_id },
    select: { id: true, total: true, promoCodeId: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (Math.abs(order.total - decoded.amount) > 0.01) {
    res.status(400).json({ error: 'Payment amount mismatch' });
    return;
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { orderId: decoded.order_id },
    select: { status: true },
  });
  const wasAlreadyPaid = existingPayment?.status === 'PAID';

  await prisma.payment.upsert({
    where: { orderId: decoded.order_id },
    update: {
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId: decoded.transaction,
    },
    create: {
      orderId: decoded.order_id,
      amount: decoded.amount,
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId: decoded.transaction,
    },
  });

  if (isPaid) {
    await prisma.order.update({
      where: { id: decoded.order_id },
      data: { status: 'CONFIRMED' },
    });
    if (order.promoCodeId && !wasAlreadyPaid) {
      await prisma.promoCode.update({
        where: { id: order.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }
    emitOrderStatus(decoded.order_id, 'CONFIRMED');
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
