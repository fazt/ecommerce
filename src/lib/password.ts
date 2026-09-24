/**
 * Password hashing helpers. Centralised so tests + signup endpoint share the
 * same implementation.
 */

import bcrypt from 'bcryptjs';

const COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}