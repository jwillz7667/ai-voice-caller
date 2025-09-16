import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking database users...\n');

    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        email_verified: true,
        credit_balance: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.log(`Found ${users.length} users:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Email Verified: ${user.email_verified}`);
        console.log(`   Credits: ${user.credit_balance}`);
        console.log(`   Created: ${user.created_at.toISOString()}\n`);
      });
    }

    // Check if admin user exists
    const adminUser = await prisma.users.findUnique({
      where: { email: 'admin@verbio.ai' }
    });

    if (adminUser) {
      console.log('✅ Admin user exists');
      console.log('   Password is hashed:', adminUser.password ? 'Yes' : 'No');
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();