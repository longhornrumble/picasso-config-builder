# Phase 5: S3 Integration - Implementation Guide

## Overview

This document describes the S3 integration implementation for the Picasso Config Builder, including both production-ready Lambda functions and local development server setup.

## Architecture

The implementation follows a **hybrid approach**:

1. **Lambda Functions** - Production-ready AWS Lambda code for S3 operations
2. **Local Dev Server** - Express server that mimics Lambda behavior using local file system
3. **Shared Logic** - Common merge strategies and validation rules

This allows for rapid local development while maintaining production deployment readiness.

## Directory Structure

```
picasso-config-builder/
├── lambda/                          # AWS Lambda function code
│   ├── package.json                 # Lambda dependencies
│   ├── index.mjs                    # Main Lambda handler
│   ├── s3Operations.mjs             # S3 CRUD operations
│   └── mergeStrategy.mjs            # Config merge logic
├── mock-s3/                         # Local development configs
│   ├── TEST001-config.json          # Sample tenant config
│   ├── TEST002-config.json          # Sample tenant config
│   └── backups/                     # Backup directory
│       └── .gitkeep
└── src/lib/api/
    ├── client.ts                    # API client (Phase 2)
    └── localDevServer.ts            # Local dev server
```

## Components

### 1. Lambda Function (`lambda/index.mjs`)

**Runtime:** Node.js 20.x
**Handler:** `index.handler`

Main Lambda handler that processes HTTP requests via API Gateway proxy integration.

**Supported Routes:**
- `GET /health` - Health check
- `GET /config/tenants` - List all tenant configs
- `GET /config/{tenantId}` - Load full tenant config
- `GET /config/{tenantId}/metadata` - Get tenant metadata only
- `GET /config/{tenantId}/backups` - List backups
- `PUT /config/{tenantId}` - Save tenant config
- `DELETE /config/{tenantId}` - Delete tenant config
- `GET /sections` - Get section information

**Environment Variables:**
- `S3_BUCKET` - S3 bucket name (default: `myrecruiter-picasso`)
- `AWS_REGION` - AWS region (default: `us-east-1`)
- `NODE_ENV` - Environment mode (development/staging/production)

### 2. S3 Operations Module (`lambda/s3Operations.mjs`)

Encapsulates all S3 interactions using AWS SDK v3.

**Key Functions:**
- `listTenantConfigs()` - List all tenant configs in bucket
- `loadConfig(tenantId)` - Load config from S3
- `getTenantMetadata(tenantId)` - Get metadata without full config
- `saveConfig(tenantId, config, createBackup)` - Save config with optional backup
- `createConfigBackup(tenantId, config)` - Create timestamped backup
- `deleteConfig(tenantId)` - Delete config (creates backup first)
- `listBackups(tenantId)` - List all backups for tenant

**S3 Bucket Structure:**
```
myrecruiter-picasso/
├── TENANT001-config.json
├── TENANT002-config.json
└── backups/
    ├── TENANT001-2025-10-15T10-30-00-000Z.json
    └── TENANT002-2025-10-14T15-45-00-000Z.json
```

### 3. Merge Strategy Module (`lambda/mergeStrategy.mjs`)

Implements section-based editing to preserve read-only configuration sections.

**Editable Sections:**
- `programs` - Program definitions
- `conversational_forms` - Form definitions
- `cta_definitions` - CTA button definitions
- `conversation_branches` - Branch routing rules

**Read-Only Sections:**
- `branding` - Visual styling (managed elsewhere)
- `features` - Feature flags
- `quick_help` - Quick help prompts
- `action_chips` - Action chip definitions
- `widget_behavior` - Widget settings
- `aws` - AWS infrastructure config
- `card_inventory` - Extracted smart cards

**Key Functions:**
- `mergeConfigSections(baseConfig, editedSections)` - Merge edited sections into base config
- `extractEditableSections(fullConfig)` - Extract only editable sections
- `validateEditedSections(editedSections)` - Validate edited sections
- `generateConfigDiff(oldConfig, newConfig)` - Generate change diff
- `isEditableSection(sectionName)` - Check if section is editable
- `isReadOnlySection(sectionName)` - Check if section is read-only

**Merge Workflow:**
1. Load full config from S3
2. Extract edited sections from request
3. Validate edited sections (reject read-only modifications)
4. Merge edited sections into full config
5. Add/update metadata (last_updated, tenant_id)
6. Save merged config back to S3

### 4. Local Development Server (`src/lib/api/localDevServer.ts`)

Express server that mimics Lambda behavior for local development.

**Features:**
- Same API endpoints as Lambda
- Uses local file system (`mock-s3/`) instead of S3
- CORS support for frontend development
- Request logging
- Error handling

**Starting the Server:**
```bash
npm run server:dev
```

Server runs on `http://localhost:3001` (configurable via `DEV_SERVER_PORT` env var).

## Local Development Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies (includes express, tsx, etc.)
npm install

# Install Lambda dependencies (for local testing)
cd lambda
npm install
cd ..
```

### 2. Configure Environment

Create or update `.env.local`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# S3 Configuration (for Lambda)
S3_BUCKET=myrecruiter-picasso
AWS_REGION=us-east-1

# Dev Server Configuration
DEV_SERVER_PORT=3001
NODE_ENV=development
```

### 3. Start Development Servers

**Terminal 1 - API Server:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

### 4. Test the Setup

```bash
# Health check
curl http://localhost:3001/health

# List tenants
curl http://localhost:3001/config/tenants

# Load tenant config
curl http://localhost:3001/config/TEST001

# Load editable sections only
curl "http://localhost:3001/config/TEST001?editable_only=true"

# Get tenant metadata
curl http://localhost:3001/config/TEST001/metadata
```

## Sample Tenant Configs

Two sample tenant configs are provided in `mock-s3/`:

### TEST001 - Test Company HR Assistant
- Employee Referral Program
- Tuition Reimbursement Program
- Employee referral form
- Benefits inquiry branch

### TEST002 - Acme Corp Recruiting
- Signing Bonus Program
- Relocation Assistance Program
- Contact recruiter form
- Job search branch

## API Usage Examples

### List All Tenants

```javascript
const response = await fetch('http://localhost:3001/config/tenants');
const { tenants } = await response.json();

// Response:
// {
//   "tenants": [
//     {
//       "tenantId": "TEST001",
//       "key": "TEST001-config.json",
//       "lastModified": "2025-10-15T10:00:00.000Z",
//       "size": 5234
//     },
//     ...
//   ]
// }
```

### Load Tenant Config

```javascript
// Full config
const response = await fetch('http://localhost:3001/config/TEST001');
const { config } = await response.json();

// Editable sections only
const response = await fetch('http://localhost:3001/config/TEST001?editable_only=true');
const { config } = await response.json();
```

### Save Tenant Config

```javascript
const response = await fetch('http://localhost:3001/config/TEST001', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      programs: { /* updated programs */ },
      conversational_forms: { /* updated forms */ },
      // ... other editable sections
    },
    merge: true,           // Merge with existing config
    create_backup: true,   // Create backup before saving
  })
});

const result = await response.json();
// { success: true, tenantId: "TEST001", timestamp: "..." }
```

### Validate Without Saving

```javascript
const response = await fetch('http://localhost:3001/config/TEST001', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: { /* edited sections */ },
    validate_only: true,
  })
});

const result = await response.json();
// { valid: true, message: "Configuration is valid" }
```

### Delete Tenant Config

```javascript
const response = await fetch('http://localhost:3001/config/TEST001', {
  method: 'DELETE',
});

const result = await response.json();
// {
//   success: true,
//   tenantId: "TEST001",
//   deletedKey: "TEST001-config.json",
//   backupKey: "backups/TEST001-2025-10-15T..."
// }
```

## Lambda Deployment

### 1. Package Lambda Function

```bash
cd lambda
npm ci --production
npm run package
```

This creates `deployment.zip` with all dependencies.

### 2. Deploy to AWS Lambda

**Option A: Using AWS CLI**
```bash
aws lambda update-function-code \
  --function-name Picasso_Config_Manager \
  --zip-file fileb://deployment.zip
```

**Option B: Using AWS Console**
1. Navigate to Lambda service
2. Select `Picasso_Config_Manager` function
3. Upload `deployment.zip`
4. Set handler to `index.handler`
5. Set runtime to Node.js 20.x

### 3. Configure Lambda

**Environment Variables:**
- `S3_BUCKET` = `myrecruiter-picasso`
- `AWS_REGION` = `us-east-1`
- `NODE_ENV` = `production`

**IAM Role Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::myrecruiter-picasso",
        "arn:aws:s3:::myrecruiter-picasso/*"
      ]
    }
  ]
}
```

**API Gateway Integration:**
- Type: Lambda Proxy Integration
- Method: ANY
- Path: /{proxy+}
- Enable CORS

### 4. Update Frontend Configuration

Update `.env.production`:
```bash
VITE_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

## Section-Based Editing Strategy

### Why Section-Based?

1. **Safety** - Prevents accidental modification of infrastructure config
2. **Separation of Concerns** - UI/branding managed separately from business logic
3. **Auditability** - Clear tracking of what changed
4. **Multi-Admin** - Different teams can manage different sections

### How It Works

When saving a config:

1. **Frontend** sends only edited sections:
   ```json
   {
     "config": {
       "programs": { /* updated programs */ },
       "conversational_forms": { /* updated forms */ }
     },
     "merge": true
   }
   ```

2. **Backend** loads full config from S3:
   ```json
   {
     "tenant_id": "TEST001",
     "programs": { /* old programs */ },
     "conversational_forms": { /* old forms */ },
     "branding": { /* unchanged */ },
     "aws": { /* unchanged */ },
     ...
   }
   ```

3. **Merge Strategy** overlays edited sections:
   ```json
   {
     "tenant_id": "TEST001",
     "programs": { /* NEW programs */ },
     "conversational_forms": { /* NEW forms */ },
     "branding": { /* PRESERVED */ },
     "aws": { /* PRESERVED */ },
     "last_updated": "2025-10-15T12:00:00.000Z"
   }
   ```

4. **Validation** ensures no read-only sections were modified

5. **Backup** creates timestamped backup of old config

6. **Save** writes merged config back to S3

## Testing

### Unit Testing (Lambda Functions)

```bash
cd lambda
npm test
```

### Integration Testing (Local Dev Server)

```bash
# Start server
npm run server:dev

# Run tests
npm run test:integration
```

### Manual Testing

Use the provided sample configs and curl commands to verify:

1. List tenants
2. Load configs
3. Save configs (with merge)
4. Create backups
5. Delete configs
6. Error handling (404, validation errors)

## Troubleshooting

### Server won't start

**Error:** `Cannot find module 'express'`
**Solution:** Run `npm install`

**Error:** `Port 3001 already in use`
**Solution:** Change `DEV_SERVER_PORT` in `.env.local` or kill the process using port 3001

### Can't load tenant config

**Error:** `Config not found for tenant: TEST001`
**Solution:** Ensure `mock-s3/TEST001-config.json` exists

### CORS errors in browser

**Solution:** Ensure dev server is running and CORS headers are enabled (already configured in localDevServer.ts)

### Lambda deployment fails

**Error:** `Module not found`
**Solution:** Ensure `npm ci --production` was run before packaging

## Next Steps

1. **Phase 6: Testing & Validation**
   - Implement comprehensive test suite
   - Add integration tests
   - Test merge strategy edge cases

2. **Phase 7: Production Deployment**
   - Deploy Lambda to AWS
   - Configure API Gateway
   - Set up monitoring and logging

3. **Phase 8: UI Integration**
   - Connect frontend to API
   - Implement save/load workflows
   - Add loading states and error handling

## References

- [AWS Lambda Node.js Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Express.js Documentation](https://expressjs.com/)
- [Tenant Config Schema](./TENANT_CONFIG_SCHEMA.md)
