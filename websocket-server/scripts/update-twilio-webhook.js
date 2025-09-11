/*
 Updates the Twilio Incoming Phone Number Voice webhook (voiceUrl) to point
 to the server's current PUBLIC_URL TwiML endpoint (PUBLIC_URL + /twiml).
 Also sets a status callback to PUBLIC_URL + /call-status.

 Usage:
   node scripts/update-twilio-webhook.js [E164_PHONE_NUMBER]

 Env required in websocket-server/.env:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER (fallback if arg not provided)
   - PUBLIC_URL (e.g., https://xxxxx.ngrok-free.app)
*/

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const envPhone = process.env.TWILIO_PHONE_NUMBER;
  const publicUrl = process.env.PUBLIC_URL;
  const argPhone = process.argv[2];

  if (!accountSid || !authToken) {
    console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env');
    process.exit(1);
  }

  if (!publicUrl) {
    console.error('Missing PUBLIC_URL in .env. Start ngrok or set PUBLIC_URL.');
    process.exit(1);
  }

  const phoneNumber = argPhone || envPhone;
  if (!phoneNumber) {
    console.error('Provide a phone number as arg or set TWILIO_PHONE_NUMBER in .env');
    process.exit(1);
  }

  const client = require('twilio')(accountSid, authToken);

  // Build callback URLs
  const twimlUrl = new URL('/twiml', publicUrl).toString();
  const statusCallback = new URL('/call-status', publicUrl).toString();

  console.log('Updating Twilio webhook for number:', phoneNumber);
  console.log('  voiceUrl:', twimlUrl);
  console.log('  statusCallback:', statusCallback);

  try {
    // Find the IncomingPhoneNumber SID by phone number
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber, limit: 20 });
    const match = numbers.find(n => n.phoneNumber === phoneNumber);

    if (!match) {
      console.error('Could not find IncomingPhoneNumber for', phoneNumber);
      if (numbers.length) {
        console.log('Closest matches:');
        numbers.forEach(n => console.log(` - ${n.phoneNumber} (${n.sid})`));
      }
      process.exit(1);
    }

    const updated = await client.incomingPhoneNumbers(match.sid).update({
      voiceUrl: twimlUrl,
      voiceMethod: 'POST',
      statusCallback,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    console.log('✅ Updated webhook successfully.');
    console.log('  SID:', updated.sid);
    console.log('  voiceUrl:', updated.voiceUrl);
    console.log('  statusCallback:', updated.statusCallback);
  } catch (err) {
    console.error('Failed updating Twilio webhook:', err?.message || err);
    process.exit(1);
  }
}

main();


