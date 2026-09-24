import { z } from 'zod';

export const CouponCreateSchema = z.object({
  code: z.string().min(1).max(40).regex(/^[A-Z0-9_-]+$/),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().int().min(0),
  minOrderCents: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(0).optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});
export type CouponCreateInput = z.infer<typeof CouponCreateSchema>;

export const CouponUpdateSchema = CouponCreateSchema.partial();
export type CouponUpdateInput = z.infer<typeof CouponUpdateSchema>;

export const ApplyCouponSchema = z.object({
  code: z.string().min(1).max(40),
});