import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const PromoSchema = z.object({
  code: z.string().min(2).max(32).toUpperCase(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const CreatePromoSchema = PromoSchema.refine((data) => data.discountType !== 'percent' || data.discountValue <= 100, {
  path: ['discountValue'],
  message: 'Percent discount cannot exceed 100',
});

const UpdatePromoSchema = PromoSchema.omit({ code: true }).partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
).refine((data) => data.discountType !== 'percent' || data.discountValue === undefined || data.discountValue <= 100, {
  path: ['discountValue'],
  message: 'Percent discount cannot exceed 100',
});

const PromoValidateSchema = z.object({
  code: z.string().min(2).max(32),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
});

// Public: validate a promo code against server-side product prices
router.post('/validate', validate(PromoValidateSchema), asyncHandler(async (req, res) => {
  const { code, items } = req.body as { code: string; items: { productId: string; quantity: number }[] };

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

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) }, isActive: true },
    select: { id: true, price: true },
  });

  const requestedProductIds = new Set(items.map((item) => item.productId));
  if (products.length !== requestedProductIds.size) {
    res.status(400).json({ error: 'One or more products are unavailable' });
    return;
  }

  const subtotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  if (promo.minOrderAmount !== null && subtotal < promo.minOrderAmount) {
    res.status(400).json({
      error: `Minimum sifariş məbləği ${promo.minOrderAmount} ₼ olmalıdır`,
    });
    return;
  }

  const discount =
    promo.discountType === 'percent'
      ? Math.min((subtotal * promo.discountValue) / 100, subtotal)
      : Math.min(promo.discountValue, subtotal);

  res.json({
    valid: true,
    promoCodeId: promo.id,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount: parseFloat(discount.toFixed(2)),
    finalTotal: parseFloat((subtotal - discount).toFixed(2)),
  });
}));

// Admin: list all promo codes
router.get('/', adminGuard, asyncHandler(async (_req, res) => {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(promos);
}));

// Admin: create promo code
router.post('/', adminGuard, validate(CreatePromoSchema), asyncHandler(async (req, res) => {
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
}));

// Admin: update promo code
router.put('/:id', adminGuard, validate(UpdatePromoSchema), asyncHandler(async (req, res) => {
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
}));

// Admin: delete promo code
router.delete('/:id', adminGuard, asyncHandler(async (req, res) => {
  await prisma.promoCode.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

export default router;
