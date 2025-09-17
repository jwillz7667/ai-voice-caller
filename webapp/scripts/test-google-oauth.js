#!/usr/bin/env node

const { OAuth2Client } = require('google-auth-library');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Testing Google OAuth Configuration...\n');

// Check if environment variables are set
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

console.log('Environment Variables:');
console.log('----------------------');
console.log(`GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Not set'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Not set'}`);
console.log(`GOOGLE_REDIRECT_URI: ${redirectUri}`);

if (!clientId || !clientSecret) {
  console.error('\n❌ Missing required environment variables!');
  process.exit(1);
}

// Test OAuth2Client initialization
try {
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent',
  });

  console.log('\n✅ OAuth2Client initialized successfully!');
  console.log('\nGenerated Auth URL:');
  console.log('-------------------');
  console.log(authUrl);

  console.log('\n📋 Instructions:');
  console.log('1. Open the auth URL above in your browser');
  console.log('2. Sign in with your Google account');
  console.log('3. It should redirect to: ' + redirectUri);
  console.log('4. Check if the callback route handles the code parameter');

} catch (error) {
  console.error('\n❌ Error initializing OAuth2Client:', error.message);
  process.exit(1);
}

console.log('\n✅ Google OAuth configuration appears to be correct!');