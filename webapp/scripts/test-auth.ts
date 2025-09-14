import bcrypt from 'bcryptjs';

// Test password hashing
async function testAuth() {
  const testPassword = 'Admin@123456';

  // Hash the password
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  console.log('Test password:', testPassword);
  console.log('Hashed password:', hashedPassword);

  // Test comparison
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log('Password validation test:', isValid);

  // Test with stored hash from database (this is the admin user's password hash)
  const storedHash = '$2a$10$vPXKH0xX9xFqmQANhvxeYeT4rMCDHOgzCQX/GzxY4IQD/VLFeL0kS';
  const isValidStored = await bcrypt.compare(testPassword, storedHash);
  console.log('Validation against stored hash:', isValidStored);
}

testAuth();