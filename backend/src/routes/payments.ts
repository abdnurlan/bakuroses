import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { adminGuard } from '../middleware/adminGuard';
import {
  settleOrderPayment,
  reconcileChewickPayment,
  findOrderByChewickIds,
} from '../services/paymentReconcile';

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

  const order = await prisma.order.findUnique({
    where: { code: codeMatch[0] },
    select: { id: true },
  });

  if (!order) {
    console.error('Order not found for code:', codeMatch[0]);
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const result = await settleOrderPayment({
    orderId: order.id,
    outcome: payload.orderStatus === 'APPROVED' ? 'paid' : 'failed',
    amount: payload.purchaseAmountScr ?? 0,
    transactionId: payload.orderID,
  });

  if (!result.ok) {
    console.error('Payriff callback rejected:', result.reason);
    res.status(400).json({ error: result.reason });
    return;
  }

  res.json({ status: 'ok' });
}));

// Chewick POSTs here when a transaction changes state. Callbacks are enabled by
// asking Chewick to register this URL — there is no per-request callbackUrl
// field, so the URL carries no order context and the body is all we get:
//
//   { transactionId, linkId, amount, order, terminal, currency,
//     approvalId, rrn, datetime, status, statusDescription }
//
// The payload is unsigned, so it is never treated as proof of payment — it
// tells us *which* order to re-check and supplies the transaction id that the
// status endpoint needs. The verdict always comes from
// GET /v1/payment/transactions/{id}/status, which also means a forged callback
// is harmless and a missing one is covered by the poller.
router.post('/chewick/callback', asyncHandler(async (req, res) => {
  const ids = extractChewickIds(req.body);

  if (!ids.linkId && !ids.transactionId) {
    console.warn('Chewick callback without linkId/transactionId:', JSON.stringify(req.body)?.slice(0, 500));
    res.status(400).json({ error: 'Cannot determine transaction' });
    return;
  }

  const orderId = await findOrderByChewickIds(ids);
  if (!orderId) {
    console.warn('Chewick callback for unknown transaction:', JSON.stringify(ids));
    res.status(404).json({ error: 'Unknown transaction' });
    return;
  }

  try {
    const result = await reconcileChewickPayment(orderId, ids.transactionId);
    res.json({ status: 'ok', paymentStatus: result.status });
  } catch (err) {
    // Acknowledge anyway: the poller will retry, and a 5xx may make Chewick
    // replay the callback indefinitely.
    console.error('Chewick reconcile failed on callback:', (err as Error).message);
    res.json({ status: 'ok', paymentStatus: 'deferred' });
  }
}));

/**
 * Pulls the two ids we can match on out of a callback body or redirect query.
 * `order` is Chewick's own reference, not ours, so it is deliberately ignored.
 */
function extractChewickIds(body: unknown): { linkId?: string; transactionId?: string } {
  if (!body || typeof body !== 'object') return {};
  const root = body as Record<string, unknown>;
  // Tolerate a { data: {...} } wrapper in case the shape ever changes.
  const src = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>;

  const str = (key: string): string | undefined => {
    const value = src[key] ?? root[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };

  return { linkId: str('linkId'), transactionId: str('transactionId') };
}

// Gateways redirect the customer's browser here after payment (GET).
// The status itself is settled by the POST callback / poller; this only sets a
// short-lived one-time cookie so the success page can verify the visit came
// from a real payment redirect (not someone typing /success in the address bar).
function paymentRedirect(req: Request, res: Response): void {
  const clientUrl = process.env.CLIENT_URL ?? 'https://bakuroses.az';
  const locales = ['az', 'en', 'ru'] as const;
  const rawLocale = String(req.query.locale ?? '').toLowerCase();
  const lang = (locales as readonly string[]).includes(rawLocale) ? rawLocale : 'az';

  res.cookie('br_paid', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
  });

  res.redirect(`${clientUrl}/${lang}/success`);
}

router.get('/callback', paymentRedirect);

router.get('/chewick/callback', (req, res) => {
  // Returning from the Chewick app — nudge the status check so the success page
  // reflects reality without waiting for the next poll tick.
  const ids = extractChewickIds(req.query);
  if (ids.linkId || ids.transactionId) {
    void findOrderByChewickIds(ids)
      .then((orderId) => (orderId ? reconcileChewickPayment(orderId, ids.transactionId) : null))
      .catch((err) => console.error('Chewick redirect reconcile failed:', (err as Error).message));
  }

  paymentRedirect(req, res);
});

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
