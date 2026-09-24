/**
 * Wishlist service.
 */

import { prisma } from '../prisma';
import { NotFoundError } from '../errors';

export async function listWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: { images: { orderBy: { position: 'asc' }, take: 1 } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
  return { ok: true };
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem
    .delete({ where: { userId_productId: { userId, productId } } })
    .catch(() => undefined);
  return { ok: true };
}