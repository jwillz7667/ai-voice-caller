const twilio = require('twilio');

// Load environment variables
require('dotenv').config({ path: './websocket-server/.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const CLOUD_RUN_URL = 'https://verbio.app';

async function updateWebhooks() {
  try {
    console.log('Fetching phone number configuration...');

    // Get the phone number's current configuration
    const phoneNumbers = await client.incomingPhoneNumbers
      .list({ phoneNumber: phoneNumber });

    if (phoneNumbers.length === 0) {
      console.error('Phone number not found:', phoneNumber);
      return;
    }

    const phoneNumberSid = phoneNumbers[0].sid;
    console.log('Phone Number SID:', phoneNumberSid);

    // Update the phone number's webhook URLs
    const updatedNumber = await client.incomingPhoneNumbers(phoneNumberSid)
      .update({
        voiceUrl: `${CLOUD_RUN_URL}/twiml`,
        voiceMethod: 'POST',
        statusCallback: `${CLOUD_RUN_URL}/call-status`,
        statusCallbackMethod: 'POST',
      });

    console.log('✅ Successfully updated Twilio webhooks:');
    console.log('   Voice URL:', updatedNumber.voiceUrl);
    console.log('   Voice Method:', updatedNumber.voiceMethod);
    console.log('   Status Callback:', updatedNumber.statusCallback);
    console.log('   Status Callback Method:', updatedNumber.statusCallbackMethod);

  } catch (error) {
    console.error('Error updating webhooks:', error);
  }
}

updateWebhooks();