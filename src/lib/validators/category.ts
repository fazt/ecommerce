import { z } from 'zod';

export const CategoryCreateSchema = z.object({
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().cuid().optional(),
});
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = CategoryCreateSchema.partial();