import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { emitCourierLocation } from '../services/socket';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().min(0).max(360).optional().default(0),
});

router.post('/:id/location', validate(LocationSchema), async (req, res) => {
  const { lat, lng, heading } = req.body as { lat: number; lng: number; heading: number };

  const delivery = await prisma.delivery.update({
    where: { id: req.params.id },
    data: { currentLat: lat, currentLng: lng, heading },
    select: { orderId: true },
  });

  emitCourierLocation(delivery.orderId, lat, lng, heading);
  res.json({ ok: true });
});

router.post('/order/:orderId', adminGuard, async (req, res) => {
  const delivery = await prisma.delivery.upsert({
    where: { orderId: req.params.orderId },
    update: {},
    create: { orderId: req.params.orderId },
  });
  res.status(201).json(delivery);
});

router.get('/', adminGuard, async (_req, res) => {
  const deliveries = await prisma.delivery.findMany({
    include: { order: true },
  });
  res.json(deliveries);
});

router.get('/:id', async (req, res) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id },
    include: { order: true },
  });

  if (!delivery) {
    res.status(404).json({ error: 'Delivery not found' });
    return;
  }

  res.json(delivery);
});

export default router;
