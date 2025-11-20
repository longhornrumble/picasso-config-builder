#!/bin/bash

# Picasso Config Builder Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environment: production (default)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
AWS_PROFILE=${AWS_PROFILE:-chris-admin}
AWS_REGION="us-east-1"

# Production infrastructure
PROD_S3_BUCKET="picasso-config-builder-prod"
PROD_URL="http://picasso-config-builder-prod.s3-website-us-east-1.amazonaws.com"
PROD_LAMBDA="picasso-config-api"
PROD_API_URL="https://56mwo4zatkiqzpancrkkzqr43e0nkrui.lambda-url.us-east-1.on.aws"

# Set environment-specific variables
case $ENVIRONMENT in
  production)
    S3_BUCKET=$PROD_S3_BUCKET
    DEPLOYMENT_URL=$PROD_URL
    LAMBDA_FUNCTION=$PROD_LAMBDA
    API_ENDPOINT=$PROD_API_URL
    ;;
  *)
    echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
    echo "Usage: ./scripts/deploy.sh [production]"
    exit 1
    ;;
esac

echo -e "${BLUE}🚀 Picasso Config Builder Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo ""
echo -e "Environment:    ${GREEN}$ENVIRONMENT${NC}"
echo -e "S3 Bucket:      ${GREEN}$S3_BUCKET${NC}"
echo -e "AWS Profile:    ${GREEN}$AWS_PROFILE${NC}"
echo -e "AWS Region:     ${GREEN}$AWS_REGION${NC}"
echo -e "Deployment URL: ${GREEN}$DEPLOYMENT_URL${NC}"
echo ""

# Confirmation prompt for production
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${YELLOW}⚠️  WARNING: Deploying to PRODUCTION${NC}"
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
  fi
fi

# Step 1: Run tests
echo -e "${BLUE}📋 Step 1: Running tests...${NC}"
npm run test:run --silent || {
  echo -e "${RED}❌ Tests failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ Tests passed${NC}"
echo ""

# Step 2: Type check
echo -e "${BLUE}📋 Step 2: Type checking...${NC}"
npm run typecheck --silent || {
  echo -e "${RED}❌ Type check failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ Type check passed${NC}"
echo ""

# Step 3: Build for production
echo -e "${BLUE}📦 Step 3: Building for $ENVIRONMENT...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
  npm run build:production || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
  }
else
  npm run build:staging || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
  }
fi
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Step 4: Verify build output
echo -e "${BLUE}📋 Step 4: Verifying build output...${NC}"
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ dist/ directory not found${NC}"
  exit 1
fi

if [ ! -f "dist/index.html" ]; then
  echo -e "${RED}❌ dist/index.html not found${NC}"
  exit 1
fi

if [ ! -f "dist/main.js" ]; then
  echo -e "${RED}❌ dist/main.js not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build output verified${NC}"
echo ""

# Step 5: Deploy to S3
echo -e "${BLUE}☁️  Step 5: Deploying to S3...${NC}"

# Upload all files except index.html with long cache
echo "Uploading assets with cache headers..."
AWS_PROFILE=$AWS_PROFILE aws s3 sync dist/ s3://$S3_BUCKET/ \
  --region $AWS_REGION \
  --delete \
  --exclude "index.html" \
  --exclude "*.map" \
  --cache-control "public,max-age=31536000,immutable" \
  --content-type "text/css" \
  --exclude "*" \
  --include "*.css"

AWS_PROFILE=$AWS_PROFILE aws s3 sync dist/ s3://$S3_BUCKET/ \
  --region $AWS_REGION \
  --delete \
  --exclude "index.html" \
  --exclude "*.map" \
  --cache-control "public,max-age=31536000,immutable" \
  --content-type "application/javascript" \
  --exclude "*" \
  --include "*.js"

# Upload index.html with no cache
echo "Uploading index.html with no-cache..."
AWS_PROFILE=$AWS_PROFILE aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --region $AWS_REGION \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo -e "${GREEN}✅ Deployment to S3 completed${NC}"
echo ""

# Step 6: Verify deployment
echo -e "${BLUE}🔍 Step 6: Verifying deployment...${NC}"
AWS_PROFILE=$AWS_PROFILE aws s3 ls s3://$S3_BUCKET/ --region $AWS_REGION || {
  echo -e "${RED}❌ Failed to verify deployment${NC}"
  exit 1
}
echo -e "${GREEN}✅ Deployment verified${NC}"
echo ""

# Step 7: Print summary
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}"
echo ""
echo -e "Frontend URL:  ${BLUE}$DEPLOYMENT_URL${NC}"
echo -e "API Endpoint:  ${BLUE}$API_ENDPOINT${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test the deployment URL"
echo "2. Verify API connectivity"
echo "3. Test tenant config loading"
echo "4. Create a deployment tag in git"
echo ""
echo -e "${BLUE}Git tagging example:${NC}"
echo "git tag -a v0.1.0-$(date +%Y%m%d) -m 'Production deployment $(date +%Y-%m-%d)'"
echo "git push origin --tags"
echo ""
