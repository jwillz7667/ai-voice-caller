import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Initializing database...');
  
  // Create a demo user
  const demoPassword = await hashPassword('demo123');
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: demoPassword,
      name: 'Demo User',
      phone: '+1234567890',
      company: 'Demo Company',
      jobTitle: 'Developer',
      credits: 1000,
      emailVerified: true,
    },
  });
  
  console.log('✅ Created demo user:', demoUser.email);
  
  // Add some sample credit transactions
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: demoUser.id,
        amount: 1000,
        transactionType: 'BONUS',
        description: 'Welcome bonus',
      },
      {
        userId: demoUser.id,
        amount: -10,
        transactionType: 'USAGE',
        description: 'Test call - 10 minutes',
      },
    ],
  });
  
  console.log('✅ Created sample transactions');
  
  // Create a sample call log
  await prisma.callLog.create({
    data: {
      userId: demoUser.id,
      sessionId: 'sample-session-001',
      phoneNumber: '+19876543210',
      direction: 'OUTBOUND',
      duration: 600, // 10 minutes
      status: 'COMPLETED',
      creditsUsed: 10,
      transcript: {
        messages: [
          { role: 'assistant', content: 'Hello, how can I help you today?' },
          { role: 'user', content: 'I need help with my account.' },
        ],
      },
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      endedAt: new Date(Date.now() - 3000000), // 50 minutes ago
    },
  });
  
  console.log('✅ Created sample call log');
  
  console.log('\n📋 Database initialized successfully!');
  console.log('\n🔑 Demo credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: demo123');
  console.log('   Credits: 990 (after test usage)');
}

main()
  .catch((e) => {
    console.error('❌ Error initializing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });