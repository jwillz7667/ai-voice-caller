const bcrypt = require('bcryptjs');

async function testPassword() {
  const plainPassword = 'demo123';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  console.log('Plain password:', plainPassword);
  console.log('Hashed password:', hashedPassword);
  
  const isValid = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Password valid:', isValid);
  
  // Test with the hash from the database
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.users.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (user) {
      console.log('\nDatabase user found:', user.email);
      console.log('Database password hash:', user.password);
      
      const dbValid = await bcrypt.compare(plainPassword, user.password);
      console.log('Password matches database:', dbValid);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();