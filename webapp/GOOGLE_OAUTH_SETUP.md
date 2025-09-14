# Google OAuth Setup Instructions

## Quick Setup Checklist

### 1. Google Cloud Console URLs
- Console: https://console.cloud.google.com
- OAuth Consent: https://console.cloud.google.com/apis/credentials/consent
- Credentials: https://console.cloud.google.com/apis/credentials

### 2. Required Redirect URIs (EXACT - Copy & Paste These)

#### Production:
```
https://verbio.app/api/auth/callback/google
```

#### Development:
```
http://localhost:3000/api/auth/callback/google
```

### 3. Required Authorized JavaScript Origins

#### Production:
```
https://verbio.app
```

#### Development:
```
http://localhost:3000
```

### 4. Environment Variables to Update

After getting your credentials from Google, update these files:

#### `.env.local` (Development)
```bash
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
```

#### `.env.production` (Production)
```bash
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
```

#### `.env.production.local` (Production - Local Copy)
```bash
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
```

### 5. Testing Your Setup

1. **Development Testing:**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:3000/login
   Click "Sign in with Google"

2. **Production Testing:**
   After deployment, visit: https://verbio.app/login
   Click "Sign in with Google"

### 6. Common Issues & Solutions

#### "Redirect URI mismatch" Error
- Double-check the redirect URI is EXACTLY: `/api/auth/callback/google`
- Ensure no trailing slashes
- Check both http (dev) and https (prod) versions are added

#### "Access blocked" Error
- Make sure OAuth consent screen is configured
- Verify domain ownership if requested
- Check that app is published (not in testing mode) for production

#### "Invalid client" Error
- Verify CLIENT_ID and CLIENT_SECRET are correctly copied
- Check no extra spaces or quotes in env variables
- Restart your server after updating env files

### 7. Publishing Your App (For Production)

1. Go to OAuth consent screen
2. Click "PUBLISH APP" button
3. Confirm publication
4. Your app is now available to all Google users

### 8. Security Best Practices

- Never commit CLIENT_SECRET to git
- Use different credentials for dev/staging/production
- Regularly rotate your client secret
- Monitor usage in Google Cloud Console

## Need Help?

- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- NextAuth Google Provider: https://next-auth.js.org/providers/google
- Google Cloud Support: https://cloud.google.com/support

## Your Credentials (Fill these in after setup)

```bash
# Copy from Google Cloud Console
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Remember to add these to:
1. Vercel/Netlify environment variables
2. Local .env files
3. Any CI/CD pipelines