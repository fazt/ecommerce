import { z } from 'zod';

export const ProductCreateSchema = z.object({
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(10_000),
  shortDescription: z.string().max(500).optional(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'MXN']).default('USD'),
  sku: z.string().max(64).optional(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weightGrams: z.number().int().min(0).optional(),
  taxCode: z.string().max(64).optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string().max(40)).max(20).default([]),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(200).optional(),
        position: z.number().int().min(0).default(0),
      }),
    )
    .max(10)
    .default([]),
});
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = ProductCreateSchema.partial();
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;

export const ProductFilterSchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).default('newest'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(96).default(24),
});
export type ProductFilter = z.infer<typeof ProductFilterSchema>;

export const ReviewCreateSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});
export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;

export const ReviewUpdateSchema = ReviewCreateSchema.partial().omit({ productId: true });