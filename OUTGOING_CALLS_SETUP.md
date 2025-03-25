# Outgoing Calls Configuration

This project has been updated to support outgoing calls using Twilio. Follow these steps to configure outgoing calls:

## Configuration Requirements

1. Make sure you have the following environment variables set in both the `webapp/.env` and `websocket-server/.env` files:

```
# Required Twilio credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

2. Your Twilio phone number must be capable of making outgoing calls. Check your Twilio console to ensure your phone number has voice capabilities enabled.

3. The `PUBLIC_URL` environment variable in `websocket-server/.env` should be set to the publicly accessible URL of your deployment (or use ngrok for local development).

## Making Outgoing Calls

1. Enter a phone number in the new "Make Outgoing Call" panel
2. Click the "Call" button
3. The call will be connected and you'll see a confirmation when successful

## Implementation Details

- The outgoing call uses the same TwiML endpoint that's used for incoming calls
- The OpenAI and Twilio realtime audio streams are connected the same way as incoming calls
- All the existing AI functionality works the same for outgoing calls as it does for incoming calls

## Troubleshooting

If you encounter issues with outgoing calls:

1. Check your Twilio logs in the [Twilio Console](https://www.twilio.com/console)
2. Verify that your phone number has outgoing call capabilities
3. Ensure your TWILIO_PHONE_NUMBER is formatted correctly with country code (e.g., +12345678900)
4. Make sure the destination phone number is also formatted correctly
