/**
 * Audit log writer. All admin mutations + webhook-driven order changes go
 * through `writeAudit()` so we can answer "who did what when".
 */

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';

export interface AuditEntry {
  userId?: string | null;
  action: string; // e.g. "order.created", "product.updated"
  entity: string; // e.g. "Order", "Product"
  entityId: string;
  changes?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        changes: entry.changes === undefined ? Prisma.JsonNull : (entry.changes as Prisma.InputJsonValue),
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit failures should never break the user-facing action; log and move on.
    logger.error({ err, entry }, 'audit log write failed');
  }
}

/**
 * Build a JSON diff between two records. Only the keys in `keys` are
 * compared; missing values are treated as nulls.
 */
export function diff(before: Record<string, unknown>, after: Record<string, unknown>, keys: string[]) {
  const result: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of keys) {
    if (before[key] !== after[key]) {
      result[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return result;
}