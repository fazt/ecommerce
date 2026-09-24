/**
 * User + profile service.
 */

import { prisma } from '../prisma';
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors';
import { writeAudit } from '../audit';
import bcrypt from 'bcryptjs';
import { AddressInputSchema, type AddressInput } from '../validators/address';
import type { UpdateProfileInput } from '../validators/auth';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: { orderBy: { isDefault: 'desc' } } },
  });
  if (!user) throw new NotFoundError('User');
  const { hashedPassword: _omit, ...safe } = user;
  return safe;
}

export async function updateProfile(userId: string, input: UpdateProfileInput, ipAddress?: string, userAgent?: string) {
  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) throw new NotFoundError('User');
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      preferredCurrency: input.preferredCurrency,
      preferredLocale: input.preferredLocale,
    },
  });
  await writeAudit({
    userId,
    action: 'user.profile_updated',
    entity: 'User',
    entityId: userId,
    changes: { before, after: updated },
    ipAddress,
    userAgent,
  });
  return updated;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.hashedPassword) throw new UnauthorizedError('No password set');
  const ok = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!ok) throw new UnauthorizedError('Wrong current password');
  await prisma.user.update({
    where: { id: userId },
    data: { hashedPassword: bcrypt.hashSync(newPassword, 10) },
  });
  await writeAudit({
    userId,
    action: 'user.password_changed',
    entity: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  });
  return { ok: true };
}

export async function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
}

export async function createAddress(userId: string, input: AddressInput) {
  const parsed = AddressInputSchema.parse(input);
  if (parsed.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({
    data: {
      userId,
      label: parsed.label,
      type: parsed.type,
      line1: parsed.line1,
      line2: parsed.line2,
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postalCode,
      country: parsed.country,
      phone: parsed.phone,
      isDefault: parsed.isDefault,
    },
  });
}

export async function updateAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) throw new NotFoundError('Address');
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId, NOT: { id: addressId } }, data: { isDefault: false } });
  }
  return prisma.address.update({ where: { id: addressId }, data: input });
}

export async function deleteAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) throw new NotFoundError('Address');
  await prisma.address.delete({ where: { id: addressId } });
  return { ok: true };
}

export async function registerUser(input: { email: string; password: string; name?: string }) {
  if (!input.email || !input.password) throw new ValidationError('Email and password required');
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ValidationError('Email already registered');
  const created = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      hashedPassword: bcrypt.hashSync(input.password, 10),
    },
  });
  return { id: created.id, email: created.email, name: created.name };
}