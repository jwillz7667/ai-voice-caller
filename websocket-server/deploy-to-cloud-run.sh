#!/bin/bash

# Deploy WebSocket Server to Google Cloud Run

set -e

PROJECT_ID="neural-aquifer-467003-m0"
SERVICE_NAME="ai-voice-caller-websocket"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting deployment to Google Cloud Run..."

# Build the Docker image for linux/amd64 platform
echo "📦 Building Docker image for linux/amd64..."
docker buildx build --platform linux/amd64 -t ${IMAGE_NAME} -f Dockerfile.cloudrun . --load

# Push to Google Container Registry
echo "⬆️ Pushing image to GCR..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 60 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --project ${PROJECT_ID}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)' \
  --project ${PROJECT_ID})

echo "✅ Deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "📝 Next steps:"
echo "1. Update PUBLIC_URL environment variable in Cloud Run with: ${SERVICE_URL}"
echo "2. Update Twilio webhook URLs to use: ${SERVICE_URL}/incoming-call"
echo "3. Update frontend NEXT_PUBLIC_WEBSOCKET_URL to: wss://${SERVICE_URL#https://}"