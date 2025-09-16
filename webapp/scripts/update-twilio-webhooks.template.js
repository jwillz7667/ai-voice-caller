#!/usr/bin/env node

/**
 * Update Twilio Phone Number Webhooks
 * This script updates your Twilio phone number to use the Cloud Run production URLs
 * 
 * USAGE:
 * 1. Copy this file to update-twilio-webhooks.js
 * 2. Set your Twilio credentials in .env file
 * 3. Run: node scripts/update-twilio-webhooks.js
 */

const twilio = require('twilio');
require('dotenv').config({ path: './.env' });

// Configuration - Load from environment variables
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (!ACCOUNT_SID || !AUTH_TOKEN || !PHONE_NUMBER) {
  console.error('❌ Missing required environment variables');
  console.error('Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file');
  process.exit(1);
}

// Cloud Run Production URL
const CLOUD_RUN_URL = 'https://ai-voice-caller-public-995705962018.us-central1.run.app';

// Initialize Twilio client
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

async function updatePhoneNumber() {
  try {
    console.log('🔄 Updating Twilio webhooks for phone number:', PHONE_NUMBER);
    console.log('📡 Using Cloud Run URL:', CLOUD_RUN_URL);
    
    // Find the phone number resource
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phone_number: PHONE_NUMBER
    });
    
    if (phoneNumbers.length === 0) {
      console.error('❌ Phone number not found:', PHONE_NUMBER);
      process.exit(1);
    }
    
    const phoneNumberSid = phoneNumbers[0].sid;
    console.log('✅ Found phone number SID:', phoneNumberSid);
    
    // Update the phone number configuration
    const updatedNumber = await client.incomingPhoneNumbers(phoneNumberSid)
      .update({
        // Voice configuration
        voiceUrl: `${CLOUD_RUN_URL}/incoming-call`,
        voiceMethod: 'POST',
        voiceFallbackUrl: `${CLOUD_RUN_URL}/incoming-call`,
        voiceFallbackMethod: 'POST',
        
        // Status callback for call events
        statusCallback: `${CLOUD_RUN_URL}/call-status`,
        statusCallbackMethod: 'POST',
        
        // SMS configuration (if needed)
        smsUrl: `${CLOUD_RUN_URL}/sms`,
        smsMethod: 'POST',
        smsFallbackUrl: `${CLOUD_RUN_URL}/sms`,
        smsFallbackMethod: 'POST'
      });
    
    console.log('\n✅ Successfully updated Twilio webhooks!');
    console.log('\n📞 Phone Number Configuration:');
    console.log('   Number:', updatedNumber.phoneNumber);
    console.log('   Voice URL:', updatedNumber.voiceUrl);
    console.log('   Voice Method:', updatedNumber.voiceMethod);
    console.log('   Status Callback:', updatedNumber.statusCallback);
    console.log('   Status Method:', updatedNumber.statusCallbackMethod);
    
    // Test the webhooks
    console.log('\n🧪 Testing webhook endpoints...');
    
    // Test incoming-call endpoint
    try {
      const response = await fetch(`${CLOUD_RUN_URL}/incoming-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'CallSid=TEST123&From=+1234567890&To=' + PHONE_NUMBER
      });
      
      if (response.ok) {
        console.log('   ✅ /incoming-call endpoint is responding');
      } else {
        console.log('   ⚠️  /incoming-call returned status:', response.status);
      }
    } catch (error) {
      console.log('   ❌ /incoming-call endpoint test failed:', error.message);
    }
    
    // Test call-status endpoint
    try {
      const response = await fetch(`${CLOUD_RUN_URL}/call-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'CallSid=TEST123&CallStatus=completed'
      });
      
      if (response.ok) {
        console.log('   ✅ /call-status endpoint is responding');
      } else {
        console.log('   ⚠️  /call-status returned status:', response.status);
      }
    } catch (error) {
      console.log('   ❌ /call-status endpoint test failed:', error.message);
    }
    
    console.log('\n🎉 Twilio webhook update complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make a test call to', PHONE_NUMBER);
    console.log('   2. Check the Cloud Run logs for activity');
    console.log('   3. Monitor the webapp for real-time updates');
    
  } catch (error) {
    console.error('\n❌ Error updating Twilio webhooks:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

// Additional function to list all phone numbers (useful for debugging)
async function listAllPhoneNumbers() {
  try {
    console.log('\n📋 Listing all Twilio phone numbers on account:');
    const numbers = await client.incomingPhoneNumbers.list();
    
    numbers.forEach((number, index) => {
      console.log(`\n${index + 1}. ${number.phone_number}`);
      console.log('   SID:', number.sid);
      console.log('   Voice URL:', number.voiceUrl || 'Not set');
      console.log('   Status Callback:', number.statusCallback || 'Not set');
    });
  } catch (error) {
    console.error('Error listing phone numbers:', error.message);
  }
}

// Check for command line arguments
const args = process.argv.slice(2);

if (args.includes('--list')) {
  // List all phone numbers
  listAllPhoneNumbers();
} else if (args.includes('--help')) {
  // Show help
  console.log(`
📞 Twilio Webhook Updater

Usage:
  node update-twilio-webhooks.js        Update webhooks to Cloud Run URLs
  node update-twilio-webhooks.js --list List all phone numbers
  node update-twilio-webhooks.js --help Show this help message

Environment Variables (set in .env file):
  TWILIO_ACCOUNT_SID   Your Twilio Account SID
  TWILIO_AUTH_TOKEN    Your Twilio Auth Token
  TWILIO_PHONE_NUMBER  The phone number to update

Current Configuration:
  Cloud Run URL: ${CLOUD_RUN_URL}
  `);
} else {
  // Default: Update webhooks
  updatePhoneNumber();
}