import { z } from 'zod';

export const OrderStatusUpdateSchema = z.object({
  status: z.enum([
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'FAILED',
  ]),
});
export type OrderStatusUpdateInput = z.infer<typeof OrderStatusUpdateSchema>;

export const TrackingUpdateSchema = z.object({
  carrierName: z.string().min(1).max(80),
  trackingNumber: z.string().min(1).max(120),
  trackingUrl: z.string().url().optional(),
});
export type TrackingUpdateInput = z.infer<typeof TrackingUpdateSchema>;

export const RefundCreateSchema = z.object({
  amountCents: z.number().int().min(1),
  reason: z.string().max(500).optional(),
  restock: z.boolean().default(false),
});
export type RefundCreateInput = z.infer<typeof RefundCreateSchema>;

export const UserRoleUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});
export type UserRoleUpdateInput = z.infer<typeof UserRoleUpdateSchema>;