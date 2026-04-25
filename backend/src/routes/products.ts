import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const ProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().optional(),
  stemNote: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url(),
  category: z.string().min(1),
  categorySlug: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', async (req, res) => {
  const showAll = req.headers['x-admin-token'] === process.env.ADMIN_PASSWORD;
  const { category, search, minPrice, maxPrice, sort } = req.query;

  const where: Prisma.ProductWhereInput = showAll ? {} : { isActive: true };

  if (search && typeof search === 'string') {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { subtitle: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  if (category && typeof category === 'string') {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { categorySlug: category },
          { category: { equals: category, mode: 'insensitive' } },
        ],
      },
    ];
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    };
  }

  let orderBy: Record<string, string> = { createdAt: 'asc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  else if (sort === 'price_desc') orderBy = { price: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const products = await prisma.product.findMany({ where, orderBy });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
});

router.post('/', adminGuard, validate(ProductSchema), async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json(product);
});

router.put('/:id', adminGuard, async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(product);
});

router.delete('/:id', adminGuard, async (req, res) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ ok: true });
});

export default router;
