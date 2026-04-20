import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { haversineDistance } from '../services/maps';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const ZoneSchema = z.object({
  name: z.string().min(1),
  centerLat: z.number(),
  centerLng: z.number(),
  radiusKm: z.number().positive(),
  deliveryFee: z.number().min(0).optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', async (_req, res) => {
  const zones = await prisma.zone.findMany({
    where: { isActive: true },
    orderBy: { radiusKm: 'asc' },
  });
  res.json(zones);
});

router.get('/all', adminGuard, async (_req, res) => {
  const zones = await prisma.zone.findMany({ orderBy: { radiusKm: 'asc' } });
  res.json(zones);
});

router.post('/check-coverage', async (req, res) => {
  const { lat, lng } = req.body as { lat: number; lng: number };
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    res.status(400).json({ error: 'lat and lng are required numbers' });
    return;
  }

  // Order by smallest radius first so the tightest matching zone wins
  const zones = await prisma.zone.findMany({
    where: { isActive: true },
    orderBy: { radiusKm: 'asc' },
  });

  // Find the smallest zone that covers the point
  const matchedZone = zones.find(
    (zone) => haversineDistance(lat, lng, zone.centerLat, zone.centerLng) <= zone.radiusKm
  );

  if (!matchedZone) {
    res.json({ covered: false, zone: null, distanceKm: null, deliveryFee: null });
    return;
  }

  const actualDistance = haversineDistance(lat, lng, matchedZone.centerLat, matchedZone.centerLng);

  res.json({
    covered: true,
    zone: matchedZone,
    distanceKm: parseFloat(actualDistance.toFixed(2)),
    deliveryFee: matchedZone.deliveryFee,
  });
});

router.post('/', adminGuard, validate(ZoneSchema), async (req, res) => {
  const zone = await prisma.zone.create({ data: req.body });
  res.status(201).json(zone);
});

router.put('/:id', adminGuard, async (req, res) => {
  const zone = await prisma.zone.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(zone);
});

router.delete('/:id', adminGuard, async (req, res) => {
  await prisma.zone.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
