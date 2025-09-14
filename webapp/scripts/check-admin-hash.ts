import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminHash() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@verbio.ai' }
  });

  if (admin && admin.password) {
    console.log('Admin password hash:', admin.password);
    console.log('Hash length:', admin.password.length);

    const testPassword = 'Admin@123456';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log('Password "Admin@123456" is valid:', isValid);
  }

  await prisma.$disconnect();
}

checkAdminHash();