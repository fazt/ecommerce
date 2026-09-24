import { z } from 'zod';

export const ShippingZoneCreateSchema = z.object({
  name: z.string().min(1).max(120),
  countries: z.array(z.string().length(2)).min(1).max(250),
  isActive: z.boolean().default(true),
});
export type ShippingZoneCreateInput = z.infer<typeof ShippingZoneCreateSchema>;

export const ShippingRateCreateSchema = z.object({
  zoneId: z.string().cuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(200).optional(),
  basePriceCents: z.number().int().min(0),
  perKgCents: z.number().int().min(0).default(0),
  minSubtotalCents: z.number().int().min(0).optional(),
  maxSubtotalCents: z.number().int().min(0).optional(),
  minWeightGrams: z.number().int().min(0).optional(),
  maxWeightGrams: z.number().int().min(0).optional(),
  deliveryDaysMin: z.number().int().min(0).optional(),
  deliveryDaysMax: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});
export type ShippingRateCreateInput = z.infer<typeof ShippingRateCreateSchema>;

export const ShippingRateUpdateSchema = ShippingRateCreateSchema.partial().omit({ zoneId: true });