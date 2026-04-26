import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'categories');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) { cb(new Error('Only images allowed')); return; }
    cb(null, true);
  },
});

const ImageUrlSchema = z.string().min(1).refine((v) => {
  if (v.startsWith('/uploads/')) return true;
  return z.string().url().safeParse(v).success;
}, 'Must be an uploaded path or valid URL');

const CategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: ImageUrlSchema.optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const CategoryUpdateSchema = CategorySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

router.post('/upload-image', adminGuard, imageUpload.single('image'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'Image required' }); return; }
  res.status(201).json({ imageUrl: `/uploads/categories/${req.file.filename}` });
});

router.get('/', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  res.json(categories);
}));

router.get('/all', adminGuard, asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json(category);
}));

router.post('/', adminGuard, validate(CategorySchema), asyncHandler(async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json(category);
}));

router.put('/:id', adminGuard, validate(CategoryUpdateSchema), asyncHandler(async (req, res) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(category);
}));

router.delete('/:id', adminGuard, asyncHandler(async (req, res) => {
  await prisma.category.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ ok: true });
}));

export default router;
