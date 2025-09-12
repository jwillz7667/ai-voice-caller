#!/bin/bash

echo "🚀 Deploying AI Voice Caller Frontend to Vercel"
echo "================================================"
echo ""

# Check if already logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo "📝 Please log in to Vercel first:"
    echo "   Run: vercel login"
    echo "   Choose your preferred login method (GitHub recommended)"
    echo ""
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Check for required environment variables
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ] || [ -z "$TWILIO_PHONE_NUMBER" ]; then
    echo "⚠️  Missing Twilio credentials in environment"
    echo "   Please set the following environment variables:"
    echo "   - TWILIO_ACCOUNT_SID"
    echo "   - TWILIO_AUTH_TOKEN"
    echo "   - TWILIO_PHONE_NUMBER"
    echo ""
    echo "   You can set them in your .env file or export them:"
    echo "   export TWILIO_ACCOUNT_SID='your-account-sid'"
    echo "   export TWILIO_AUTH_TOKEN='your-auth-token'"
    echo "   export TWILIO_PHONE_NUMBER='+1234567890'"
    echo ""
    exit 1
fi

# Production URLs
WEBSOCKET_URL="wss://ai-voice-caller-public-995705962018.us-central1.run.app"
BACKEND_URL="https://ai-voice-caller-public-995705962018.us-central1.run.app"
PUBLIC_URL="https://ai-voice-caller-public-995705962018.us-central1.run.app"

echo "📦 Setting up production environment variables..."
echo ""
echo "   WebSocket URL: $WEBSOCKET_URL"
echo "   Backend URL: $BACKEND_URL"
echo "   Public URL: $PUBLIC_URL"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy with production flag and environment variables
vercel --prod \
  --env NEXT_PUBLIC_WEBSOCKET_URL="$WEBSOCKET_URL" \
  --env BACKEND_URL="$BACKEND_URL" \
  --env PUBLIC_URL="$PUBLIC_URL" \
  --env NEXT_PUBLIC_AUTH_BYPASS="true" \
  --env TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" \
  --env TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \
  --env TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"

echo ""
echo "================================================"
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Your app will be available at the URL shown above"
echo "2. Update the DATABASE_URL in Vercel dashboard with your production database"
echo "3. Generate a new JWT_SECRET for production"
echo "4. Test the deployment by visiting the URL"
echo ""
echo "To manage environment variables:"
echo "   Visit: https://vercel.com/dashboard"
echo "   Go to your project → Settings → Environment Variables"
echo ""