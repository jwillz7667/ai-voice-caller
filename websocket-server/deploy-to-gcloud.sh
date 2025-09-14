#!/bin/bash

# Google Cloud Run Deployment Script for WebSocket Server
# This script deploys the backend to Google Cloud Run

echo "🚀 Starting deployment to Google Cloud Run..."

# Set variables
PROJECT_ID="neural-aquifer-467003-m0"
SERVICE_NAME="ai-voice-caller-public"
REGION="us-central1"

# Check if user is authenticated
echo "📋 Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "📦 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Build and deploy
echo "🔨 Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 3600 \
    --max-instances 100 \
    --min-instances 0 \
    --port 8081 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
    --set-env-vars "TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}" \
    --set-env-vars "TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}" \
    --set-env-vars "TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}" \
    --set-env-vars "ALLOWED_ORIGIN=https://verbio.app" \
    --set-env-vars "WEBAPP_URL=https://verbio.app"

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Service URL: https://$SERVICE_NAME-995705962018.us-central1.run.app"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update Twilio webhook URLs to the new service URL"
    echo "2. Test DTMF functionality with a phone call"
    echo "3. Monitor logs: gcloud run logs read --service=$SERVICE_NAME"
else
    echo "❌ Deployment failed"
    exit 1
fi