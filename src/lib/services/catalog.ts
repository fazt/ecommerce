/**
 * Catalog service: search, filter, paginate, retrieve product details.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import type { ProductFilter } from '../validators/product';

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  stock: number;
  averageRating: number;
  reviewCount: number;
  image: string | null;
  categorySlug: string | null;
  categoryName: string | null;
}

export interface CatalogResult {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
}

function toItem(p: Prisma.ProductGetPayload<{ include: { images: true; category: true } }>): CatalogItem {
  const firstImage = [...p.images].sort((a, b) => a.position - b.position)[0];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    currency: p.currency,
    stock: p.stock,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    image: firstImage?.url ?? null,
    categorySlug: p.category?.slug ?? null,
    categoryName: p.category?.name ?? null,
  };
}

export async function getCatalog(filter: ProductFilter): Promise<CatalogResult> {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
      { tags: { has: filter.search } },
    ];
  }
  if (filter.category) {
    where.category = { slug: filter.category };
  }
  if (filter.minPrice != null || filter.maxPrice != null) {
    where.priceCents = {
      ...(filter.minPrice != null ? { gte: filter.minPrice } : {}),
      ...(filter.maxPrice != null ? { lte: filter.maxPrice } : {}),
    };
  }
  if (filter.tags && filter.tags.length) {
    where.tags = { hasEvery: filter.tags };
  }
  if (filter.inStock) {
    where.stock = { gt: 0 };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filter.sort === 'price_asc'
      ? { priceCents: 'asc' }
      : filter.sort === 'price_desc'
        ? { priceCents: 'desc' }
        : filter.sort === 'popular'
          ? { reviewCount: 'desc' }
          : { createdAt: 'desc' };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
      include: { images: true, category: true },
    }),
  ]);

  return {
    items: rows.map(toItem),
    total,
    page: filter.page,
    pageSize: filter.pageSize,
  };
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  stock: number;
  lowStockThreshold: number;
  weightGrams: number | null;
  sku: string | null;
  averageRating: number;
  reviewCount: number;
  category: { id: string; slug: string; name: string } | null;
  images: Array<{ url: string; alt: string | null; position: number }>;
  related: Array<{ id: string; slug: string; name: string; priceCents: number; image: string | null }>;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: 'asc' } }, category: true },
  });
  if (!p || !p.isActive) return null;

  const related = p.categoryId
    ? await prisma.product.findMany({
        where: { categoryId: p.categoryId, isActive: true, NOT: { id: p.id } },
        take: 4,
        include: { images: { orderBy: { position: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    shortDescription: p.shortDescription,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    currency: p.currency,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    weightGrams: p.weightGrams,
    sku: p.sku,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    category: p.category ? { id: p.category.id, slug: p.category.slug, name: p.category.name } : null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position })),
    related: related.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      priceCents: r.priceCents,
      image: r.images[0]?.url ?? null,
    })),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<CatalogItem[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: limit,
    include: { images: { orderBy: { position: 'asc' }, take: 1 }, category: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toItem);
}

export async function getCategoriesWithCounts() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}