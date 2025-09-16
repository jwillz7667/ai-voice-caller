# Google OAuth Setup Guide

## Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Select project: `neural-aquifer-467003-m0`
3. Click "CREATE CREDENTIALS" → "OAuth client ID"
4. Application type: "Web application"
5. Name: "Jingle AI Voice Caller"
6. Authorized JavaScript origins:
   - http://localhost:3000 (development)
   - https://verbio.app (production)
7. Authorized redirect URIs:
   - http://localhost:3000/api/auth/google/callback (development)
   - https://verbio.app/api/auth/google/callback (production)
8. Click "CREATE"
9. Copy the Client ID and Client Secret

## Step 2: Configure OAuth Consent Screen

1. Go to https://console.cloud.google.com/apis/credentials/consent
2. Select "External" user type
3. Fill in application details:
   - App name: Verbio
   - User support email: support@verbio.app
   - App logo: Upload your logo
   - App domain: https://verbio.app
   - Privacy policy: https://verbio.app/privacy
   - Terms of service: https://verbio.app/terms
4. Add scopes:
   - .../auth/userinfo.email
   - .../auth/userinfo.profile
5. Add test users if in testing mode
6. Submit for review (for production)

## Step 3: Add Environment Variables

Add these to your `.env.local` file in the webapp:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

For production, update the redirect URI:
```env
GOOGLE_REDIRECT_URI=https://verbio.app/api/auth/google/callback
```

## Step 4: Update Database Schema

Run the following commands to update your database:

```bash
cd webapp
npm run db:push  # Push schema changes
# OR
npm run db:migrate  # Create and apply migration
```

## Step 5: Test the Integration

1. Start the development server:
   ```bash
   cd webapp
   npm run dev
   ```

2. Navigate to http://localhost:3000/signin

3. Click "Continue with Google"

4. Complete the OAuth flow

5. Verify user is created in database:
   ```bash
   npm run db:studio
   ```

## Backend Integration

The WebSocket server has been successfully deployed to:
- URL: https://ai-voice-caller-websocket-995705962018.us-central1.run.app

Update your Twilio webhooks (COMPLETED):
- Voice webhook: https://verbio.app/twiml
- Status callback: https://verbio.app/call-status
- Recording callback: https://verbio.app/recording-status

## Frontend WebSocket Connection

Update your frontend environment:
```env
NEXT_PUBLIC_WEBSOCKET_URL=wss://ai-voice-caller-websocket-995705962018.us-central1.run.app
```

## Troubleshooting

### "Redirect URI mismatch" error
- Ensure the redirect URI in Google Console exactly matches your app's callback URL
- Check for trailing slashes
- Verify protocol (http vs https)

### "Access blocked" error
- Make sure OAuth consent screen is configured
- For production, submit app for verification
- Add test users while in development

### User not created in database
- Check database connection string
- Verify Prisma schema is up to date
- Check server logs for errors

## Security Best Practices

1. Never commit OAuth credentials to version control
2. Use different credentials for development and production
3. Regularly rotate client secrets
4. Implement rate limiting on OAuth endpoints
5. Log all authentication attempts
6. Use HTTPS in production