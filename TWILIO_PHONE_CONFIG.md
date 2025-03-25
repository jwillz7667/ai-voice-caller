# Twilio Phone Number Configuration

You need to add your Twilio phone number to the environment variables to fix the current error: "No 'From' number is specified"

## Steps to Add Twilio Phone Number

1. Open your `webapp/.env` file and add the following line:
```
TWILIO_PHONE_NUMBER=+1234567890
```
Replace `+1234567890` with your actual Twilio phone number. Make sure it includes the country code (e.g., +1 for US numbers).

2. For the websocket server, open `websocket-server/.env` and add:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

3. Restart your servers after making these changes.

## Finding Your Twilio Phone Number

If you're unsure about your Twilio phone number:
1. Go to the [Twilio Console](https://console.twilio.com)
2. Navigate to "Phone Numbers" > "Manage" > "Active numbers"
3. Your phone number will be listed there. Make sure to include the country code when copying it.

## Important Notes

- The phone number must be formatted with a "+" and the country code (e.g., +12125551234)
- The phone number must be capable of making outgoing calls (check your Twilio console to verify)
- If you're using a trial account, you may only be able to call verified numbers
