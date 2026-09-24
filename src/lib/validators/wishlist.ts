import { z } from 'zod';

export const WishlistAddSchema = z.object({
  productId: z.string().cuid(),
});