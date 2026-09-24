/**
 * Test Prisma client. Uses a pglite in-memory Postgres for fast tests.
 * Switch to testcontainers-postgres via INTEGRATION_USE_DOCKER=1 if pglite
 * lacks an extension your tests need.
 */

import { PGlite } from '@electric-sql/pglite';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __pglite: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __testPrisma: PrismaClient | undefined;
}

let pgliteInstance = globalThis.__pglite;
let testPrisma = globalThis.__testPrisma;

/** Active Prisma client for integration tests. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!testPrisma) {
      testPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
          },
        },
      });
      globalThis.__testPrisma = testPrisma;
    }
    return Reflect.get(testPrisma, prop);
  },
});

export async function getTestPrisma(): Promise<PrismaClient> {
  if (testPrisma) return testPrisma;
  if (!pgliteInstance) {
    pgliteInstance = new PGlite();
    await pgliteInstance.waitReady;
    globalThis.__pglite = pgliteInstance;
  }
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '' } },
    });
    globalThis.__testPrisma = testPrisma;
  }
  return testPrisma;
}

export async function resetTestDb() {
  if (!testPrisma) return;
  await testPrisma.$transaction([
    testPrisma.auditLog.deleteMany(),
    testPrisma.refund.deleteMany(),
    testPrisma.orderItem.deleteMany(),
    testPrisma.order.deleteMany(),
    testPrisma.cartItem.deleteMany(),
    testPrisma.cart.deleteMany(),
    testPrisma.wishlistItem.deleteMany(),
    testPrisma.review.deleteMany(),
    testPrisma.address.deleteMany(),
    testPrisma.productImage.deleteMany(),
    testPrisma.product.deleteMany(),
    testPrisma.category.deleteMany(),
    testPrisma.coupon.deleteMany(),
    testPrisma.shippingRate.deleteMany(),
    testPrisma.shippingZone.deleteMany(),
    testPrisma.session.deleteMany(),
    testPrisma.account.deleteMany(),
    testPrisma.user.deleteMany(),
    testPrisma.stripeEvent.deleteMany(),
  ]);
}

export const testPrismaInstance = () => testPrisma;
export const pgliteInstance_ = () => pgliteInstance;
void pgliteInstance_;