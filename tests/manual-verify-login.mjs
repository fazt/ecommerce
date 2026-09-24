import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const u = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  console.log('User found:', !!u);
  console.log('Role:', u?.role);
  console.log('Hash prefix:', u?.hashedPassword?.slice(0, 7));
  console.log('Hash length:', u?.hashedPassword?.length);
  if (u?.hashedPassword) {
    const ok = await bcrypt.compare('admin1234', u.hashedPassword);
    console.log('admin1234 valid:', ok);
    const ok2 = await bcrypt.compare('admin', u.hashedPassword);
    console.log('admin (no number) valid:', ok2);
  }
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});