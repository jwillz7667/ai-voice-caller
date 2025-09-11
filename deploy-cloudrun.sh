#!/bin/bash

# Google Cloud Run Deployment Script
# Prerequisites: gcloud CLI installed and authenticated

set -e

# Configuration
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="ai-voice-caller-websocket"
WEBAPP_NAME="ai-voice-caller-webapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Google Cloud Run deployment...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}Setting GCP project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required Google Cloud APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com

# Build and deploy WebSocket server
echo -e "${GREEN}Building WebSocket server Docker image...${NC}"
cd websocket-server
gcloud builds submit \
    --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --dockerfile Dockerfile.cloudrun

echo -e "${GREEN}Deploying WebSocket server to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --cpu 2 \
    --memory 2Gi \
    --min-instances 1 \
    --max-instances 100 \
    --concurrency 1000 \
    --session-affinity \
    --set-env-vars "NODE_ENV=production" \
    --update-env-vars "PORT=8080"

# Get the WebSocket server URL
WEBSOCKET_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo -e "${GREEN}WebSocket server deployed at: ${WEBSOCKET_URL}${NC}"

# Update Twilio webhooks
echo -e "${YELLOW}Please update your Twilio phone number webhooks to:${NC}"
echo -e "  Voice Webhook: ${WEBSOCKET_URL}/incoming-call"
echo -e "  Status Callback: ${WEBSOCKET_URL}/call-status"
echo -e "  Recording Status: ${WEBSOCKET_URL}/recording-status"

# Deploy frontend (optional - if not using Vercel)
read -p "Deploy frontend to Cloud Run? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd ../webapp
    
    # Create Dockerfile for Next.js
    cat > Dockerfile.cloudrun << 'EOF'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_WEBSOCKET_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
EOF

    echo -e "${GREEN}Building webapp Docker image...${NC}"
    gcloud builds submit \
        --tag gcr.io/${PROJECT_ID}/${WEBAPP_NAME} \
        --dockerfile Dockerfile.cloudrun \
        --substitutions="_WEBSOCKET_URL=${WEBSOCKET_URL}"

    echo -e "${GREEN}Deploying webapp to Cloud Run...${NC}"
    gcloud run deploy ${WEBAPP_NAME} \
        --image gcr.io/${PROJECT_ID}/${WEBAPP_NAME} \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --port 3000 \
        --cpu 1 \
        --memory 1Gi \
        --min-instances 0 \
        --max-instances 50
    
    WEBAPP_URL=$(gcloud run services describe ${WEBAPP_NAME} \
        --platform managed \
        --region ${REGION} \
        --format 'value(status.url)')
    
    echo -e "${GREEN}Webapp deployed at: ${WEBAPP_URL}${NC}"
fi

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up environment variables in Cloud Run console"
echo "2. Update Twilio webhook URLs"
echo "3. Configure custom domain (optional)"
echo "4. Set up Cloud SQL for production database"