import { z } from 'zod';

export const AddCartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
});
export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;

export const MergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(50),
});
export type MergeCartInput = z.infer<typeof MergeCartSchema>;