/**
 * Review service.
 */

import { prisma } from '../prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors';
import { writeAudit } from '../audit';
import type { ReviewCreateInput } from '../validators/product';

async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}

export async function createReview(userId: string, input: ReviewCreateInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new NotFoundError('Product');
  const review = await prisma.review.upsert({
    where: { userId_productId: { userId, productId: input.productId } },
    update: { rating: input.rating, title: input.title, comment: input.comment },
    create: {
      userId,
      productId: input.productId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      isApproved: false,
    },
  });
  await recomputeProductRating(input.productId);
  return review;
}

export async function updateReview(userId: string, reviewId: string, input: { rating?: number; title?: string; comment?: string }) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review');
  if (review.userId !== userId) throw new ForbiddenError('Not your review');
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { ...input },
  });
  await recomputeProductRating(review.productId);
  return updated;
}

export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review');
  if (review.userId !== userId) throw new ForbiddenError('Not your review');
  await prisma.review.delete({ where: { id: reviewId } });
  await recomputeProductRating(review.productId);
  return { ok: true };
}

export async function listApprovedReviews(productId: string, page = 1, pageSize = 10) {
  return prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function moderateReview(
  reviewId: string,
  approved: boolean,
  actorId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review');
  if (review.isApproved === approved) return review;
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: approved },
  });
  await recomputeProductRating(review.productId);
  await writeAudit({
    userId: actorId,
    action: approved ? 'review.approved' : 'review.rejected',
    entity: 'Review',
    entityId: reviewId,
    ipAddress,
    userAgent,
  });
  return updated;
}