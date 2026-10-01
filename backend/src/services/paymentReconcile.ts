import { prisma } from '../lib/prisma';
import { emitOrderStatus } from './socket';
import { getChewickTransactionStatus, type ChewickTransactionStatus } from './chewick';

// Single place where a payment result becomes an order state change, shared by
// the Payriff callback, the Chewick callback and the Chewick poller — so a
// retried callback and a concurrent poll can't double-count a promo code.

export type SettleResult =
  | { ok: true; changed: boolean }
  | { ok: false; reason: string };

export async function settleOrderPayment(opts: {
  orderId: string;
  outcome: 'paid' | 'failed';
  /** Amount actually charged, in AZN. Checked against the order total when known. */
  amount?: number;
  transactionId?: string;
}): Promise<SettleResult> {
  const { orderId, outcome, transactionId } = opts;
  const isPaid = outcome === 'paid';

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, total: true, promoCodeId: true },
  });

  if (!order) return { ok: false, reason: 'Order not found' };

  if (isPaid && opts.amount !== undefined && Math.abs(order.total - opts.amount) > 0.01) {
    return { ok: false, reason: `Amount mismatch: expected ${order.total}, got ${opts.amount}` };
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
      ...(transactionId ? { transactionId } : {}),
    },
    create: {
      orderId: order.id,
      amount: opts.amount ?? order.total,
      status: isPaid ? 'PAID' : 'FAILED',
      transactionId,
    },
  });

  if (!isPaid) return { ok: true, changed: !wasAlreadyPaid };

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED' },
  });

  // Only the first successful settlement burns a promo use.
  if (order.promoCodeId && !wasAlreadyPaid) {
    await prisma.promoCode.update({
      where: { id: order.promoCodeId },
      data: { usedCount: { increment: 1 } },
    });
  }

  emitOrderStatus(order.id, 'CONFIRMED');

  return { ok: true, changed: !wasAlreadyPaid };
}

// ---------------------------------------------------------------------------
// Chewick
// ---------------------------------------------------------------------------

const TERMINAL_FAILURES: ChewickTransactionStatus[] = ['DECLINED', 'EXPIRED', 'FAILED', 'REVERSED'];

/**
 * Asks Chewick what actually happened and applies it.
 *
 * Chewick's callback carries no signature, so a callback body is never trusted
 * as proof of payment — it only tells us *which* order to re-check, and hands
 * us the transaction id. This function does the actual checking against the
 * gateway, and is also what the background poller calls.
 *
 * `knownTransactionId` is the id from a callback: at checkout we only have the
 * link id, and the status endpoint is keyed by transaction id.
 */
export async function reconcileChewickPayment(
  orderId: string,
  knownTransactionId?: string
): Promise<{ status: 'unknown'; reason: string } | { status: ChewickTransactionStatus }> {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: { transactionId: true, linkId: true, status: true },
  });

  if (!payment) return { status: 'unknown', reason: 'No payment row for this order' };

  // Remember the transaction id the callback gave us — without it the poller
  // has nothing but the link id to fall back on.
  if (knownTransactionId && knownTransactionId !== payment.transactionId) {
    await prisma.payment.update({
      where: { orderId },
      data: { transactionId: knownTransactionId },
    });
  }

  if (payment.status === 'PAID') return { status: 'COMPLETED' };

  const lookupId = knownTransactionId ?? payment.transactionId ?? payment.linkId;
  if (!lookupId) {
    return { status: 'unknown', reason: 'No Chewick link or transaction id stored for this order' };
  }

  const tx = await getChewickTransactionStatus(lookupId);
  const transactionId = tx.transactionId || lookupId;

  if (tx.status === 'COMPLETED') {
    const result = await settleOrderPayment({ orderId, outcome: 'paid', transactionId });
    if (!result.ok) {
      console.error(`Chewick settle failed for order ${orderId}: ${result.reason}`);
    }
    return { status: 'COMPLETED' };
  }

  if (TERMINAL_FAILURES.includes(tx.status)) {
    await settleOrderPayment({ orderId, outcome: 'failed', transactionId });
  }

  return { status: tx.status };
}

/**
 * Resolves a Chewick-side id back to our order. A callback quotes both
 * `linkId` (what we stored at checkout) and `transactionId` (what we may have
 * stored on an earlier callback), so either is accepted.
 */
export async function findOrderByChewickIds(ids: {
  linkId?: string;
  transactionId?: string;
}): Promise<string | null> {
  const candidates = [ids.linkId, ids.transactionId].filter((v): v is string => !!v);
  if (!candidates.length) return null;

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ linkId: { in: candidates } }, { transactionId: { in: candidates } }],
    },
    select: { orderId: true },
  });

  return payment?.orderId ?? null;
}
