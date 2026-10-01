import { prisma } from '../lib/prisma';
import { activeProvider, chewickConfig } from '../config/payment';
import { reconcileChewickPayment } from './paymentReconcile';

// The Chewick spec has no signed callback and no documented callback payload,
// but it does document polling: "Poll etmək lazımdır". So confirmation runs on
// a timer — a callback, if one arrives, just triggers an early poll.
//
// Only orders still awaiting payment and younger than pollMaxAgeMinutes are
// checked, so this stays a handful of requests per tick even on a busy day.

let timer: NodeJS.Timeout | null = null;
let running = false;

async function tick(maxAgeMinutes: number): Promise<void> {
  if (running) return; // A slow tick must not stack on the next one.
  running = true;

  try {
    const since = new Date(Date.now() - maxAgeMinutes * 60_000);

    const pending = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        paymentType: 'chewick',
        createdAt: { gte: since },
        payment: {
          status: 'PENDING',
          OR: [{ transactionId: { not: null } }, { linkId: { not: null } }],
        },
      },
      select: { id: true, code: true },
      take: 100,
    });

    for (const order of pending) {
      try {
        const result = await reconcileChewickPayment(order.id);
        if (result.status === 'COMPLETED') {
          console.log(`✅ Chewick payment confirmed for order ${order.code}`);
        }
      } catch (err) {
        console.error(`Chewick poll failed for order ${order.code}:`, (err as Error).message);
      }
    }
  } catch (err) {
    console.error('Chewick poller tick failed:', (err as Error).message);
  } finally {
    running = false;
  }
}

export function startChewickPoller(): void {
  if (activeProvider() !== 'chewick' || timer) return;

  const cfg = chewickConfig();
  timer = setInterval(() => void tick(cfg.pollMaxAgeMinutes), cfg.pollIntervalSeconds * 1000);
  timer.unref();

  console.log(`🔁 Chewick status poller running every ${cfg.pollIntervalSeconds}s`);
}

export function stopChewickPoller(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
