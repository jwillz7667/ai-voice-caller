import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Initializing database...');
  
  // Create a demo user
  const demoPassword = await hashPassword('demo123');
  
  const demoUser = await prisma.users.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'demo@example.com',
      password: demoPassword,
      name: 'Demo User',
      phone: '+1234567890',
      company: 'Demo Company',
      job_title: 'Developer',
      credits: 1000,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
  });
  
  console.log('✅ Created demo user:', demoUser.email);
  
  // Add some sample credit transactions
  await prisma.credit_transactions.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        amount: 1000,
        balance: 1000,
        transaction_type: 'BONUS',
        description: 'Welcome bonus',
        created_at: new Date()
      },
      {
        id: crypto.randomUUID(),
        user_id: demoUser.id,
        amount: -10,
        balance: 990,
        transaction_type: 'USAGE',
        description: 'Test call - 10 minutes',
        created_at: new Date()
      },
    ],
  });
  
  console.log('✅ Created sample transactions');
  
  // Create a sample call log
  await prisma.call_logs.create({
    data: {
      id: crypto.randomUUID(),
      user_id: demoUser.id,
      session_id: 'sample-session-001',
      phone_number: '+19876543210',
      direction: 'OUTBOUND',
      duration: 600, // 10 minutes
      status: 'COMPLETED',
      credits_used: 10,
      created_at: new Date(),
      updated_at: new Date(),
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