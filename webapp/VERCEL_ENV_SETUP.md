# Vercel Environment Variables Setup

## 🚀 Quick Setup for verbio.app on Vercel

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your `verbio.app` project
3. Click on **"Settings"** tab
4. Navigate to **"Environment Variables"** in the left sidebar

### Step 2: Add Production Environment Variables

Add each of these variables for **Production** environment:

#### 🔐 Authentication & Security
```
NEXTAUTH_URL = https://verbio.app
NEXTAUTH_SECRET = L42bGm9hna+Nb8XNKjlft7z/w1/n7fIC8GcwxrRFO/4=
```

#### 🗄️ Database (Supabase)
```
DATABASE_URL = postgresql://postgres:9GbpMWwKByPdVkQJ@db.gsceoewpgbporbkhgpww.supabase.co:5432/postgres
DIRECT_DATABASE_URL = postgresql://postgres:9GbpMWwKByPdVkQJ@db.gsceoewpgbporbkhgpww.supabase.co:5432/postgres
```

#### 🔑 Supabase Keys
```
NEXT_PUBLIC_SUPABASE_URL = https://gsceoewpgbporbkhgpww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY2VvZXdwZ2Jwb3Jia2hncHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTk5MTIsImV4cCI6MjA3MDE3NTkxMn0.dwq24-ofzR-wVB701fC98QzxIIgeKng20jnC7nPIfTQ
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY2VvZXdwZ2Jwb3Jia2hncHd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU5OTkxMiwiZXhwIjoyMDcwMTc1OTEyfQ.AK-WWbxT7s40DbRedrVBRCvJgactm3sqTWKojySljHE
```

#### 🔐 Google OAuth
```
GOOGLE_CLIENT_ID = [YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET = [YOUR_GOOGLE_CLIENT_SECRET]
```

#### 📞 Twilio
```
TWILIO_ACCOUNT_SID = [YOUR_TWILIO_ACCOUNT_SID]
TWILIO_AUTH_TOKEN = [YOUR_TWILIO_AUTH_TOKEN]
TWILIO_PHONE_NUMBER = [YOUR_TWILIO_PHONE_NUMBER]
```

#### 🤖 OpenAI
```
OPENAI_API_KEY = [YOUR_OPENAI_API_KEY]
```

#### 🌐 Application URLs
```
NEXT_PUBLIC_APP_URL = https://verbio.app
NEXT_PUBLIC_WEBSOCKET_URL = wss://ai-voice-caller-public-995705962018.us-central1.run.app
```

#### 📧 Email (Optional - Add when ready)
```
EMAIL_FROM = noreply@verbio.app
SENDGRID_API_KEY = (add when you have SendGrid set up)
```

### Step 3: How to Add Variables in Vercel

For each variable:

1. Click **"Add New"** button
2. Enter the **Key** (variable name)
3. Enter the **Value** (the actual value)
4. Select **Environment**:
   - ✅ Production
   - ✅ Preview (optional)
   - ❌ Development (use local .env for dev)
5. Click **"Save"**

### Step 4: Important Notes

#### Variables Starting with `NEXT_PUBLIC_`
These are exposed to the browser and included in the JavaScript bundle. Make sure they don't contain sensitive data.

#### Sensitive Variables (Keep Secret!)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_KEY`
- `TWILIO_AUTH_TOKEN`
- `OPENAI_API_KEY`
- `SENDGRID_API_KEY`
- Database passwords

### Step 5: Verify Deployment

After adding all variables:

1. Click **"Redeploy"** from the Deployments tab
2. Select **"Redeploy with existing Build Cache"**
3. Wait for deployment to complete
4. Test OAuth login at https://verbio.app/login

### Step 6: Troubleshooting

#### If OAuth login fails:
- Check `NEXTAUTH_URL` is exactly `https://verbio.app`
- Verify Google OAuth redirect URI in Google Cloud Console
- Check Vercel function logs for errors

#### If database connection fails:
- Verify `DATABASE_URL` is using direct connection (not pooler)
- Check Supabase dashboard for connection issues

#### View Logs:
1. Go to Vercel Dashboard
2. Click on **"Functions"** tab
3. Check logs for any API route errors

### 🎯 Quick Copy-Paste List

Here's all the environment variables in one block for easy copying:

```env
NEXTAUTH_URL=https://verbio.app
NEXTAUTH_SECRET=L42bGm9hna+Nb8XNKjlft7z/w1/n7fIC8GcwxrRFO/4=
DATABASE_URL=postgresql://postgres:9GbpMWwKByPdVkQJ@db.gsceoewpgbporbkhgpww.supabase.co:5432/postgres
DIRECT_DATABASE_URL=postgresql://postgres:9GbpMWwKByPdVkQJ@db.gsceoewpgbporbkhgpww.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://gsceoewpgbporbkhgpww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY2VvZXdwZ2Jwb3Jia2hncHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTk5MTIsImV4cCI6MjA3MDE3NTkxMn0.dwq24-ofzR-wVB701fC98QzxIIgeKng20jnC7nPIfTQ
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY2VvZXdwZ2Jwb3Jia2hncHd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU5OTkxMiwiZXhwIjoyMDcwMTc1OTEyfQ.AK-WWbxT7s40DbRedrVBRCvJgactm3sqTWKojySljHE
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
TWILIO_ACCOUNT_SID=[YOUR_TWILIO_ACCOUNT_SID]
TWILIO_AUTH_TOKEN=[YOUR_TWILIO_AUTH_TOKEN]
TWILIO_PHONE_NUMBER=[YOUR_TWILIO_PHONE_NUMBER]
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
NEXT_PUBLIC_APP_URL=https://verbio.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://ai-voice-caller-public-995705962018.us-central1.run.app
EMAIL_FROM=noreply@verbio.app
```

### 🚨 Security Reminder

**NEVER** share or commit these values to GitHub:
- API Keys
- Client Secrets
- Database passwords
- Auth tokens

Always use environment variables for sensitive data!