const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const users = await prisma.users.findMany();
    console.log('Connection successful!');
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.credits} credits)`);
    });
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();