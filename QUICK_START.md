# Quick Start Guide - Picasso Config Builder

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start API Server

```bash
npm run server:dev
```

The API server will run on `http://localhost:3001`

### 3. Start Frontend (in separate terminal)

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Testing the API

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "picasso-config-manager-local",
  "timestamp": "2025-10-15T12:00:00.000Z",
  "mode": "development"
}
```

### List Tenants

```bash
curl http://localhost:3001/config/tenants
```

### Load Tenant Config

```bash
# Full config
curl http://localhost:3001/config/TEST001

# Editable sections only
curl "http://localhost:3001/config/TEST001?editable_only=true"
```

### Save Tenant Config

```bash
curl -X PUT http://localhost:3001/config/TEST001 \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "programs": {},
      "conversational_forms": {}
    },
    "merge": true,
    "create_backup": true
  }'
```

## Validation

Run validation to ensure everything is set up correctly:

```bash
npm run validate:phase5
```

Expected output: ✅ All checks passed!

## Sample Tenant Configs

Two sample configs are available for testing:

- **TEST001** - Test Company HR Assistant
  - Employee Referral Program
  - Tuition Reimbursement
  - Employee referral form

- **TEST002** - Acme Corp Recruiting
  - Signing Bonus Program
  - Relocation Assistance
  - Contact recruiter form

## Project Structure

```
picasso-config-builder/
├── lambda/                 # AWS Lambda function (production)
├── mock-s3/                # Local dev configs
├── src/
│   ├── components/         # React components
│   ├── lib/
│   │   └── api/
│   │       ├── client.ts              # API client
│   │       └── localDevServer.ts      # Dev server
│   └── pages/              # Page components
└── docs/                   # Documentation
```

## Common Commands

```bash
# Development
npm run dev                  # Start frontend dev server
npm run server:dev           # Start API dev server

# Building
npm run build                # Build for production
npm run build:dev            # Build for development

# Validation
npm run validate:phase2      # Validate Phase 2
npm run validate:phase3      # Validate Phase 3
npm run validate:phase5      # Validate Phase 5
npm run validate             # Full validation

# Code Quality
npm run typecheck            # TypeScript type checking
npm run lint                 # Lint code
npm run format               # Format code
```

## Environment Configuration

Create `.env.local` if it doesn't exist:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# Dev Server Configuration
DEV_SERVER_PORT=3001
NODE_ENV=development
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in `.env.local`:

```bash
DEV_SERVER_PORT=3002
VITE_API_URL=http://localhost:3002
```

### Cannot Find Module Errors

Run:
```bash
npm install
```

### CORS Errors

Ensure both dev server and frontend are running on the expected ports.

## Next Steps

1. Explore the sample configs in `mock-s3/`
2. Read the full documentation in `docs/PHASE_5_S3_INTEGRATION.md`
3. Try creating a new tenant config
4. Modify existing configs and see backups being created

## Documentation

- **Phase 5 Guide:** `docs/PHASE_5_S3_INTEGRATION.md`
- **Lambda README:** `lambda/README.md`
- **Completion Summary:** `PHASE_5_COMPLETION_SUMMARY.md`

## Support

For issues or questions, refer to:
1. Documentation in `docs/`
2. Validation scripts output
3. API server logs (in terminal)
4. Browser console (for frontend issues)
