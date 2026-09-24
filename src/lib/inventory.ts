/**
 * Inventory atomic operations.
 *
 *  - decrementStock: runs `UPDATE … WHERE stock >= qty RETURNING *` so two
 *    concurrent checkouts can never oversell.
 *  - restock: symmetric, used on refunds.
 */

import { prisma } from './prisma';
import { StockError } from './errors';
import type { Prisma } from '@prisma/client';

export interface DecrementInput {
  productId: string;
  quantity: number;
  tx?: Prisma.TransactionClient;
}

/** Throws StockError if not enough stock is available. */
export async function decrementStock({ productId, quantity, tx }: DecrementInput): Promise<void> {
  if (quantity <= 0) return;
  const client = tx ?? prisma;
  // Use $executeRaw for an atomic conditional update. Returns number of rows.
  const rows = await client.$executeRaw`
    UPDATE "Product"
    SET "stock" = "stock" - ${quantity}, "updatedAt" = NOW()
    WHERE "id" = ${productId} AND "stock" >= ${quantity}
  `;
  if (rows === 0) {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    throw new StockError(productId, quantity, current?.stock ?? 0);
  }
}

export async function restock({ productId, quantity, tx }: DecrementInput): Promise<void> {
  if (quantity <= 0) return;
  const client = tx ?? prisma;
  await client.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } },
  });
}