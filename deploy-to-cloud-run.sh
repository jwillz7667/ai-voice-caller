#!/bin/bash

# AI Voice Caller - Google Cloud Run Deployment Script
# This script deploys the WebSocket server to Google Cloud Run

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="neural-aquifer-467003-m0"
REGION="us-central1"
SERVICE_NAME="ai-voice-caller-websocket"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   AI Voice Caller - Cloud Run Deployment      ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Step 1: Authenticate if needed
echo -e "${YELLOW}Step 1: Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}No active authentication found.${NC}"
    echo -e "${YELLOW}Please run: gcloud auth login${NC}"
    echo -e "${YELLOW}Then re-run this script.${NC}"
    exit 1
else
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    echo -e "${GREEN}✓ Authenticated as: ${ACTIVE_ACCOUNT}${NC}"
fi

# Step 2: Set project
echo -e "${YELLOW}Step 2: Setting project...${NC}"
gcloud config set project ${PROJECT_ID}
echo -e "${GREEN}✓ Project set to: ${PROJECT_ID}${NC}"

# Step 3: Enable required APIs
echo -e "${YELLOW}Step 3: Enabling required APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    --quiet

echo -e "${GREEN}✓ APIs enabled${NC}"

# Step 4: Check for environment variables
echo -e "${YELLOW}Step 4: Checking environment configuration...${NC}"
if [ ! -f websocket-server/.env ]; then
    echo -e "${RED}Error: websocket-server/.env file not found${NC}"
    echo -e "${YELLOW}Please create websocket-server/.env with your configuration${NC}"
    exit 1
fi

# Load environment variables from .env file
source websocket-server/.env

# Validate required variables
REQUIRED_VARS=("OPENAI_API_KEY" "TWILIO_ACCOUNT_SID" "TWILIO_AUTH_TOKEN" "TWILIO_PHONE_NUMBER")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=($var)
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo -e "${YELLOW}Please add these to websocket-server/.env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configuration valid${NC}"

# Step 5: Build Docker image
echo -e "${YELLOW}Step 5: Building Docker image...${NC}"
cd websocket-server

# Check if Dockerfile.cloudrun exists, if not use the regular Dockerfile
if [ -f "Dockerfile.cloudrun" ]; then
    DOCKERFILE="Dockerfile.cloudrun"
else
    DOCKERFILE="Dockerfile"
fi

echo -e "${BLUE}Using ${DOCKERFILE} for build...${NC}"

# Build using Cloud Build
gcloud builds submit \
    --tag ${IMAGE_NAME} \
    --timeout=20m \
    --machine-type=E2_HIGHCPU_8 \
    --dockerfile ${DOCKERFILE} \
    .

echo -e "${GREEN}✓ Docker image built and pushed${NC}"

# Step 6: Create secrets in Secret Manager (if they don't exist)
echo -e "${YELLOW}Step 6: Managing secrets...${NC}"

# Function to create or update secret
create_or_update_secret() {
    SECRET_NAME=$1
    SECRET_VALUE=$2
    
    if gcloud secrets describe ${SECRET_NAME} --project=${PROJECT_ID} >/dev/null 2>&1; then
        echo -e "${BLUE}Updating secret: ${SECRET_NAME}${NC}"
        echo -n "${SECRET_VALUE}" | gcloud secrets versions add ${SECRET_NAME} --data-file=-
    else
        echo -e "${BLUE}Creating secret: ${SECRET_NAME}${NC}"
        echo -n "${SECRET_VALUE}" | gcloud secrets create ${SECRET_NAME} --data-file=- --replication-policy="automatic"
    fi
}

create_or_update_secret "openai-api-key" "${OPENAI_API_KEY}"
create_or_update_secret "twilio-auth-token" "${TWILIO_AUTH_TOKEN}"

echo -e "${GREEN}✓ Secrets configured${NC}"

# Step 7: Deploy to Cloud Run
echo -e "${YELLOW}Step 7: Deploying to Cloud Run...${NC}"

# Deploy the service
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --cpu 2 \
    --memory 2Gi \
    --min-instances 1 \
    --max-instances 100 \
    --concurrency 1000 \
    --timeout 3600 \
    --set-env-vars "NODE_ENV=production,PORT=8080,TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID},TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}" \
    --update-secrets "OPENAI_API_KEY=openai-api-key:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest" \
    --service-account "${PROJECT_ID}@appspot.gserviceaccount.com" \
    --no-cpu-throttling

echo -e "${GREEN}✓ Service deployed to Cloud Run${NC}"

# Step 8: Get service URL
echo -e "${YELLOW}Step 8: Retrieving service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo -e "${GREEN}✓ Service deployed successfully!${NC}"

# Step 9: Display deployment information
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}         DEPLOYMENT COMPLETE! 🎉               ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}WebSocket Server URL:${NC}"
echo -e "${YELLOW}${SERVICE_URL}${NC}"
echo ""
echo -e "${GREEN}Twilio Webhook URLs:${NC}"
echo -e "${YELLOW}Voice Webhook:     ${SERVICE_URL}/incoming-call${NC}"
echo -e "${YELLOW}Status Callback:   ${SERVICE_URL}/call-status${NC}"
echo -e "${YELLOW}Recording Status:  ${SERVICE_URL}/recording-status${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Update your Twilio phone number with the webhook URLs above"
echo -e "2. Update webapp/.env.local with:"
echo -e "   NEXT_PUBLIC_WEBSOCKET_URL=${SERVICE_URL}"
echo -e "3. Deploy your frontend to Vercel or Cloud Run"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo -e "gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo ""
echo -e "${YELLOW}To update the deployment:${NC}"
echo -e "Run this script again after making changes"
echo ""

# Save the URL to a file for reference
echo "${SERVICE_URL}" > ../CLOUD_RUN_URL.txt
echo -e "${BLUE}Service URL saved to CLOUD_RUN_URL.txt${NC}"

cd ..