/**
 * Test data factories. Each factory returns the created entity (or DTO).
 */

import bcrypt from 'bcryptjs';
import type { PrismaClient, Role, OrderStatus, Order } from '@prisma/client';

let counter = 0;
function uniqueSuffix() {
  counter += 1;
  return `${Date.now()}_${counter}`;
}

export async function makeUser(
  prisma: PrismaClient,
  overrides: { email?: string; role?: Role; name?: string; hashedPassword?: string } = {},
) {
  const email = overrides.email ?? `user-${uniqueSuffix()}@example.com`;
  return prisma.user.create({
    data: {
      email,
      name: overrides.name ?? 'Test User',
      role: overrides.role ?? 'USER',
      hashedPassword: overrides.hashedPassword ?? bcrypt.hashSync('password1234', 4),
    },
  });
}

export async function makeCategory(prisma: PrismaClient, overrides: { name?: string; slug?: string } = {}) {
  return prisma.category.create({
    data: {
      name: overrides.name ?? 'Test Category',
      slug: overrides.slug ?? `test-category-${uniqueSuffix()}`,
    },
  });
}

export async function makeProduct(
  prisma: PrismaClient,
  overrides: { name?: string; slug?: string; priceCents?: number; stock?: number; categoryId?: string } = {},
) {
  return prisma.product.create({
    data: {
      name: overrides.name ?? 'Test Product',
      slug: overrides.slug ?? `test-product-${uniqueSuffix()}`,
      description: 'Test description',
      priceCents: overrides.priceCents ?? 1000,
      stock: overrides.stock ?? 10,
      currency: 'USD',
      categoryId: overrides.categoryId,
    },
  });
}

export async function makeCart(prisma: PrismaClient, userId: string) {
  return prisma.cart.create({ data: { userId } });
}

export async function makeOrder(
  prisma: PrismaClient,
  userId: string,
  overrides: { status?: OrderStatus; totalCents?: number } = {},
): Promise<Order> {
  return prisma.order.create({
    data: {
      orderNumber: `ORD-${uniqueSuffix()}`,
      userId,
      email: 'test@example.com',
      status: overrides.status ?? 'PENDING',
      subtotalCents: 1000,
      totalCents: overrides.totalCents ?? 1000,
      currency: 'USD',
      shippingAddress: { line1: '1 Main St', city: 'NYC', postalCode: '10001', country: 'US' },
      billingAddress: { line1: '1 Main St', city: 'NYC', postalCode: '10001', country: 'US' },
    },
  });
}

export async function makeCoupon(
  prisma: PrismaClient,
  overrides: { code?: string; type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'; value?: number } = {},
) {
  return prisma.coupon.create({
    data: {
      code: overrides.code ?? `T${uniqueSuffix()}`,
      type: overrides.type ?? 'PERCENTAGE',
      value: overrides.value ?? 10,
      isActive: true,
    },
  });
}