# LegalEase AI - Google Cloud Deployment Guide

## Prerequisites

1. **Google Cloud Account**: Create a Google Cloud account and enable billing
2. **Google Cloud CLI**: Install and configure the gcloud CLI
3. **Node.js**: Install Node.js 18+ for local development
4. **Gemini API Key**: Get your Gemini API key from Google AI Studio

## Required Google Cloud Services

### 1. Enable Required APIs
\`\`\`bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable translate.googleapis.com
gcloud services enable texttospeech.googleapis.com
gcloud services enable documentai.googleapis.com
\`\`\`

### 2. Set Up Firestore Database
\`\`\`bash
# Create Firestore database
gcloud firestore databases create --region=us-central1
\`\`\`

### 3. Create Cloud Storage Bucket
\`\`\`bash
# Replace YOUR_PROJECT_ID with your actual project ID
gsutil mb gs://legalease-documents-YOUR_PROJECT_ID
\`\`\`

## Environment Variables Setup

Create a `.env.local` file in your project root:

\`\`\`env
# Gemini AI API Key (you'll provide this)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_REGION=us-central1

# Firestore Configuration
FIRESTORE_PROJECT_ID=your_project_id

# Cloud Storage Configuration
STORAGE_BUCKET=legalease-documents-your_project_id

# Cloud Translation API
GOOGLE_TRANSLATE_API_KEY=auto_generated_by_gcloud

# Cloud Text-to-Speech API
GOOGLE_TTS_API_KEY=auto_generated_by_gcloud

# Document AI API
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=auto_generated_processor_id

# Next.js Configuration
NEXTAUTH_URL=https://your-app-name.run.app
NEXTAUTH_SECRET=your_nextauth_secret_here
\`\`\`

## Deployment Steps

### 1. Build and Deploy to Cloud Run

Create `cloudbuild.yaml`:
\`\`\`yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/legalease-ai', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/legalease-ai']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
    - 'run'
    - 'deploy'
    - 'legalease-ai'
    - '--image'
    - 'gcr.io/$PROJECT_ID/legalease-ai'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
    - '--set-env-vars'
    - 'GEMINI_API_KEY=${_GEMINI_API_KEY}'

substitutions:
  _GEMINI_API_KEY: 'your_gemini_api_key_here'
\`\`\`

Create `Dockerfile`:
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
\`\`\`

### 2. Deploy with Cloud Build
\`\`\`bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions _GEMINI_API_KEY=your_actual_api_key
\`\`\`

### 3. Set Up Custom Domain (Optional)
\`\`\`bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create --service legalease-ai --domain your-domain.com --region us-central1
\`\`\`

## Database Setup Scripts

The application includes SQL scripts in the `/scripts` folder that will automatically create the necessary Firestore collections:

- `users` - User profiles and authentication data
- `documents` - Uploaded document metadata
- `clauses` - Individual clause analysis results
- `analytics` - Usage analytics and risk trends

## Chrome Extension Deployment

### 1. Update Extension Configuration
Update `chrome-extension/manifest.json` with your deployed API URL:
\`\`\`json
{
  "host_permissions": [
    "https://your-app-name.run.app/*"
  ]
}
\`\`\`

### 2. Package Extension
\`\`\`bash
# Create extension package
cd chrome-extension
zip -r legalease-extension.zip .
\`\`\`

### 3. Publish to Chrome Web Store
1. Go to Chrome Web Store Developer Dashboard
2. Upload the `legalease-extension.zip` file
3. Fill in store listing details
4. Submit for review

## Monitoring and Logging

### 1. Set Up Cloud Monitoring
\`\`\`bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com
\`\`\`

### 2. View Logs
\`\`\`bash
# View Cloud Run logs
gcloud logs read --service legalease-ai --region us-central1
\`\`\`

## Security Configuration

### 1. Set Up IAM Roles
\`\`\`bash
# Create service account for the application
gcloud iam service-accounts create legalease-ai-service

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:legalease-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/firestore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:legalease-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
\`\`\`

### 2. Configure CORS for Chrome Extension
Add CORS configuration to your Cloud Run service to allow requests from the Chrome extension.

## Cost Optimization

1. **Cloud Run**: Automatically scales to zero when not in use
2. **Firestore**: Pay per operation, optimize queries
3. **Cloud Storage**: Use lifecycle policies for old documents
4. **APIs**: Monitor usage and set quotas

## Maintenance

### 1. Update Dependencies
\`\`\`bash
npm update
\`\`\`

### 2. Redeploy
\`\`\`bash
gcloud builds submit --config cloudbuild.yaml
\`\`\`

### 3. Monitor Performance
- Use Cloud Monitoring dashboards
- Set up alerts for high error rates
- Monitor API quotas and usage

## Support

For issues with deployment:
1. Check Cloud Run logs: `gcloud logs read --service legalease-ai`
2. Verify environment variables are set correctly
3. Ensure all required APIs are enabled
4. Check IAM permissions

## Estimated Costs

- **Cloud Run**: ~$5-20/month for moderate usage
- **Firestore**: ~$1-10/month depending on document volume
- **Cloud Storage**: ~$1-5/month for document storage
- **Translation API**: ~$20 per 1M characters
- **Text-to-Speech**: ~$4 per 1M characters
- **Document AI**: ~$1.50 per 1,000 pages

Total estimated cost: $30-60/month for moderate usage (1000 documents/month)
