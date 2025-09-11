# Public Access Workaround for Cloud Run

Your Cloud Run service is deployed and working, but organization policies prevent direct public access. Here are your options:

## Current Status
- ✅ Service is deployed and running
- ✅ Service works with authentication
- ❌ Direct public access is blocked by organization policy

## Option 1: Use Authentication Token (Current Setup)

The service is accessible with authentication. Twilio can use this by:

1. Generate a long-lived service account key:
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=public-invoker@neural-aquifer-467003-m0.iam.gserviceaccount.com
```

2. Use the key to authenticate requests from Twilio

## Option 2: Deploy to Firebase Hosting

Firebase allows public access even when Cloud Run doesn't:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Configure rewrites in firebase.json
{
  "hosting": {
    "rewrites": [{
      "source": "**",
      "run": {
        "serviceId": "ai-voice-caller-websocket",
        "region": "us-central1"
      }
    }]
  }
}

# Deploy
firebase deploy
```

## Option 3: Use a Different Project

Create a new GCP project without organization restrictions:

```bash
gcloud projects create ai-voice-caller-public --name="AI Voice Caller Public"
gcloud config set project ai-voice-caller-public
# Redeploy the service
```

## Option 4: Request Organization Policy Exception

Contact your Google Cloud administrator to:
1. Add an exception for project `neural-aquifer-467003-m0`
2. Or disable the `iam.allowedPolicyMemberDomains` constraint

## Testing with Authentication

For now, you can test the service with:

```bash
# Get token
TOKEN=$(gcloud auth print-identity-token)

# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://ai-voice-caller-websocket-995705962018.us-central1.run.app/health
```

## For Twilio Integration

Since Twilio can't use Google authentication, you'll need to:

1. **Use Firebase Hosting** (recommended) - This bypasses the restriction
2. **Deploy to a different cloud provider** (Heroku, Railway, Render)
3. **Use a reverse proxy** on a VPS that handles authentication

## Service URLs (Requires Authentication)

- Primary: `https://ai-voice-caller-websocket-995705962018.us-central1.run.app`
- Alternative: `https://ai-voice-caller-websocket-vfjab4lzxq-uc.a.run.app`

The service is fully functional and will auto-scale as needed. You just need to resolve the public access issue using one of the methods above.