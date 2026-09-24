import { z } from 'zod';

export const CheckoutSessionSchema = z.object({
  shippingAddressId: z.string().cuid().optional(),
  billingAddressId: z.string().cuid().optional(),
  shippingRateId: z.string().cuid(),
  couponCode: z.string().min(1).max(40).optional(),
});
export type CheckoutSessionInput = z.infer<typeof CheckoutSessionSchema>;

export const AddressInputSchema = z.object({
  label: z.string().max(40).optional(),
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']).default('SHIPPING'),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  state: z.string().max(120).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2),
  phone: z.string().max(40).optional(),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof AddressInputSchema>;