import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { adminGuard } from '../middleware/adminGuard';
import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  hasAdminSession,
  setAdminSessionCookie,
  verifyAdminPassword,
} from '../services/adminSession';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || !verifyAdminPassword(password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  setAdminSessionCookie(res, createAdminSessionToken());
  res.json({ ok: true });
});

router.post('/logout', (_req, res) => {
  clearAdminSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ authed: hasAdminSession(req) });
});

router.use(adminGuard);

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const [
    totalOrders,
    revenueResult,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { not: 'PENDING_PAYMENT' } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ['CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'] } },
    }),
    prisma.order.findMany({
      take: 10,
      where: { status: { not: 'PENDING_PAYMENT' } },
      orderBy: { createdAt: 'desc' },
      include: { zone: true, items: { include: { product: true } } },
    }),
  ]);

  res.json({
    totalOrders,
    totalRevenue: revenueResult._sum.total ?? 0,
    recentOrders,
  });
}));

export default router;
