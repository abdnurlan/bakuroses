import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.use(adminGuard);

router.get('/dashboard', async (_req, res) => {
  const [
    totalOrders,
    activeDeliveries,
    revenueResult,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.delivery.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ['CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'] } },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { zone: true, items: { include: { product: true } } },
    }),
  ]);

  res.json({
    totalOrders,
    activeDeliveries,
    totalRevenue: revenueResult._sum.total ?? 0,
    recentOrders,
  });
});

export default router;
