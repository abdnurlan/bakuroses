import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';
import { hasAdminSession } from '../services/adminSession';

const router = Router();
const PRODUCT_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'products');

fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PRODUCT_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const ImageUrlSchema = z.string().min(1).refine((value) => {
  if (value.startsWith('/uploads/products/')) return true;
  return z.string().url().safeParse(value).success;
}, 'Image must be an uploaded file path or a valid URL');

const ProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().optional(),
  stemNote: z.string().optional(),
  price: z.number().positive(),
  imageUrl: ImageUrlSchema,
  category: z.string().min(1),
  categorySlug: z.string().optional(),
  isActive: z.boolean().optional(),
});

const ProductUpdateSchema = ProductSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

router.get('/', asyncHandler(async (req, res) => {
  const wantsAdminView = req.query.admin === '1';
  const showAll = wantsAdminView && hasAdminSession(req);
  if (wantsAdminView && !showAll) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
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
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
}));

router.post('/upload-image', adminGuard, imageUpload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Image file is required' });
    return;
  }

  res.status(201).json({ imageUrl: `/uploads/products/${req.file.filename}` });
});

router.post('/', adminGuard, validate(ProductSchema), asyncHandler(async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json(product);
}));

router.put('/:id', adminGuard, validate(ProductUpdateSchema), asyncHandler(async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(product);
}));

router.delete('/:id', adminGuard, asyncHandler(async (req, res) => {
  const orderItemCount = await prisma.orderItem.count({
    where: { productId: req.params.id },
  });

  if (orderItemCount > 0) {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ ok: true, softDeleted: true });
  } else {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true, softDeleted: false });
  }
}));

export default router;
