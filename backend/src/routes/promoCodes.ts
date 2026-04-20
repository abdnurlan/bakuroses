import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const CreatePromoSchema = z.object({
  code: z.string().min(2).max(32).toUpperCase(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Public: validate a promo code against a cart total
router.post('/validate', async (req, res) => {
  const { code, cartTotal } = req.body as { code: string; cartTotal: number };

  if (!code || typeof cartTotal !== 'number') {
    res.status(400).json({ error: 'code and cartTotal required' });
    return;
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!promo || !promo.isActive) {
    res.status(404).json({ error: 'Promokod tapılmadı və ya aktiv deyil' });
    return;
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    res.status(400).json({ error: 'Promokodun müddəti bitib' });
    return;
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    res.status(400).json({ error: 'Promokodun istifadə limiti dolub' });
    return;
  }

  if (promo.minOrderAmount !== null && cartTotal < promo.minOrderAmount) {
    res.status(400).json({
      error: `Minimum sifariş məbləği ${promo.minOrderAmount} ₼ olmalıdır`,
    });
    return;
  }

  const discount =
    promo.discountType === 'percent'
      ? Math.min((cartTotal * promo.discountValue) / 100, cartTotal)
      : Math.min(promo.discountValue, cartTotal);

  res.json({
    valid: true,
    promoCodeId: promo.id,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount: parseFloat(discount.toFixed(2)),
    finalTotal: parseFloat((cartTotal - discount).toFixed(2)),
  });
});

// Admin: list all promo codes
router.get('/', adminGuard, async (_req, res) => {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(promos);
});

// Admin: create promo code
router.post('/', adminGuard, validate(CreatePromoSchema), async (req, res) => {
  const data = req.body;
  const existing = await prisma.promoCode.findUnique({ where: { code: data.code } });
  if (existing) {
    res.status(409).json({ error: 'Bu kod artıq mövcuddur' });
    return;
  }
  const promo = await prisma.promoCode.create({
    data: {
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount ?? null,
      maxUses: data.maxUses ?? null,
      isActive: data.isActive ?? true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  res.status(201).json(promo);
});

// Admin: update promo code
router.put('/:id', adminGuard, async (req, res) => {
  const { isActive, expiresAt, maxUses, minOrderAmount, discountValue, discountType } = req.body;
  const promo = await prisma.promoCode.update({
    where: { id: req.params.id },
    data: {
      ...(discountType !== undefined && { discountType }),
      ...(discountValue !== undefined && { discountValue }),
      ...(minOrderAmount !== undefined && { minOrderAmount }),
      ...(maxUses !== undefined && { maxUses }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    },
  });
  res.json(promo);
});

// Admin: delete promo code
router.delete('/:id', adminGuard, async (req, res) => {
  await prisma.promoCode.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
