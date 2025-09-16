import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLogin(email: string, password: string) {
  console.log(`\nTesting login for: ${email}`);
  console.log('Password:', password);

  try {
    // Find user
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    console.log('✅ User found');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);

    // Check password
    if (!user.password) {
      console.log('❌ User has no password (OAuth only)');
      return false;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log(`   Password valid: ${isValid ? '✅' : '❌'}`);

    if (isValid) {
      // Update last login
      await prisma.users.update({
        where: { id: user.id },
        data: {
          last_login_at: new Date(),
          login_count: { increment: 1 }
        }
      });
      console.log('✅ Login successful - updated last login time');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error during login:', error);
    return false;
  }
}

async function main() {
  console.log('=== Testing Authentication System ===\n');

  // Test admin login
  await testLogin('admin@verbio.ai', 'Admin@123456');

  // Test demo user login
  await testLogin('john.doe@example.com', 'Demo@123456');

  // Test wrong password
  await testLogin('admin@verbio.ai', 'WrongPassword');

  // Test non-existent user
  await testLogin('nonexistent@example.com', 'password');

  await prisma.$disconnect();
}

main();