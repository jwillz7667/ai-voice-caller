# Google Cloud Run Production Deployment Guide

This guide explains how to deploy the AI Voice Caller application to Google Cloud Run for production use without ngrok.

## Architecture Overview

### Production Setup
- **Frontend**: Vercel or Cloud Run
- **WebSocket Server**: Google Cloud Run with session affinity
- **Database**: Cloud SQL (PostgreSQL) or Supabase
- **Domain/SSL**: Automatic with Cloud Run URLs or custom domain

### Why Google Cloud Run?

1. **WebSocket Support**: Full support with session affinity
2. **Auto-scaling**: Scales to zero and up to 1000 instances
3. **Managed SSL**: Automatic HTTPS certificates
4. **Cost-effective**: Pay only for what you use
5. **Global**: Deploy close to users for low latency

## Prerequisites

1. Google Cloud Platform account
2. `gcloud` CLI installed and authenticated
3. Docker installed locally
4. Domain name (optional)

## Step-by-Step Deployment

### 1. Initial Setup

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Configure gcloud
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com
```

### 2. Set Up Cloud SQL Database

```bash
# Create Cloud SQL instance
gcloud sql instances create ai-voice-caller-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION

# Create database
gcloud sql databases create aivoicecaller \
  --instance=ai-voice-caller-db

# Create user
gcloud sql users create dbuser \
  --instance=ai-voice-caller-db \
  --password=your-secure-password
```

### 3. Store Secrets in Secret Manager

```bash
# Create secrets
echo -n "your-openai-api-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-twilio-auth-token" | gcloud secrets create twilio-auth-token --data-file=-
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
```

### 4. Deploy WebSocket Server

```bash
cd websocket-server

# Build and push Docker image
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/websocket-server \
  --dockerfile Dockerfile.cloudrun

# Deploy to Cloud Run
gcloud run deploy websocket-server \
  --image gcr.io/$PROJECT_ID/websocket-server \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 2 \
  --memory 2Gi \
  --min-instances 1 \
  --max-instances 100 \
  --concurrency 1000 \
  --session-affinity \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest" \
  --set-env-vars TWILIO_ACCOUNT_SID=your-sid,TWILIO_PHONE_NUMBER=your-number
```

### 5. Get WebSocket Server URL

```bash
# Get the service URL
WEBSOCKET_URL=$(gcloud run services describe websocket-server \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo "WebSocket Server URL: $WEBSOCKET_URL"
```

### 6. Update Twilio Configuration

Update your Twilio phone number with these webhook URLs:

- **Voice Webhook**: `https://websocket-server-xxxxx-uc.a.run.app/incoming-call`
- **Status Callback**: `https://websocket-server-xxxxx-uc.a.run.app/call-status`
- **Recording Status**: `https://websocket-server-xxxxx-uc.a.run.app/recording-status`

### 7. Deploy Frontend (Option A: Vercel - Recommended)

```bash
cd webapp

# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_WEBSOCKET_URL`: Your Cloud Run WebSocket URL
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `DATABASE_URL`: Your database connection string

### 7. Deploy Frontend (Option B: Cloud Run)

```bash
cd webapp

# Create production Dockerfile
cat > Dockerfile.production << 'EOF'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Build and deploy
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/webapp \
  --dockerfile Dockerfile.production

gcloud run deploy webapp \
  --image gcr.io/$PROJECT_ID/webapp \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NEXT_PUBLIC_WEBSOCKET_URL=$WEBSOCKET_URL
```

## Using Terraform (Alternative)

For infrastructure as code approach:

```bash
cd terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
project_id = "your-project-id"
region = "us-central1"
openai_api_key = "your-openai-key"
twilio_account_sid = "your-twilio-sid"
twilio_auth_token = "your-twilio-token"
twilio_phone_number = "+1234567890"
supabase_url = "your-supabase-url"
supabase_anon_key = "your-supabase-key"
EOF

# Plan and apply
terraform plan
terraform apply
```

## Custom Domain Setup

### For Cloud Run services:

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service websocket-server \
  --domain api.yourdomain.com \
  --region $REGION

# Follow the instructions to update DNS records
```

## Monitoring and Maintenance

### View logs:
```bash
gcloud run services logs read websocket-server --region $REGION
```

### Monitor metrics:
```bash
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

### Update deployment:
```bash
# Build new image
gcloud builds submit --tag gcr.io/$PROJECT_ID/websocket-server:v2

# Deploy new version
gcloud run deploy websocket-server \
  --image gcr.io/$PROJECT_ID/websocket-server:v2 \
  --region $REGION
```

## Cost Optimization

1. **Set minimum instances to 0** for development environments
2. **Use Cloud SQL proxy** for local development
3. **Configure auto-scaling** based on actual usage patterns
4. **Use Cloud CDN** for static assets
5. **Implement caching** strategies

## Security Best Practices

1. **Never expose secrets** in environment variables for build time
2. **Use Secret Manager** for all sensitive data
3. **Enable Cloud Armor** for DDoS protection
4. **Implement rate limiting** at application level
5. **Use VPC connector** for database access
6. **Enable audit logging**

## Troubleshooting

### WebSocket Connection Issues
- Ensure session affinity is enabled
- Check CORS configuration matches frontend URL
- Verify WebSocket upgrade headers are allowed

### High Latency
- Deploy to region closest to users
- Enable Cloud CDN for static content
- Optimize cold start times with minimum instances

### Database Connection
- Use Cloud SQL proxy for secure connections
- Configure connection pooling
- Set proper timeout values

## Rollback Strategy

```bash
# List revisions
gcloud run revisions list --service websocket-server --region $REGION

# Rollback to previous revision
gcloud run services update-traffic websocket-server \
  --to-revisions=websocket-server-00001-abc=100 \
  --region $REGION
```

## Performance Tuning

### Cloud Run Configuration
- **CPU**: 2-4 vCPUs for WebSocket server
- **Memory**: 2-4 GB for optimal performance
- **Concurrency**: 1000 for WebSocket connections
- **Min Instances**: 1-2 to avoid cold starts
- **Max Instances**: Based on expected load

### Database Optimization
- Use connection pooling
- Implement read replicas for scaling
- Regular maintenance and indexing

## Next Steps

1. Set up CI/CD with Cloud Build
2. Implement monitoring and alerting
3. Configure backup strategies
4. Set up staging environment
5. Implement A/B testing capabilities