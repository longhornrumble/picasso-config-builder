# CLAUDE.md

This file provides guidance to Claude Code when working with the Picasso Config Builder project.

---

## 🚨 MANDATORY: Development Process

**All development work MUST follow the Standard Operating Procedure.**

📚 **Required Reading for All Agents:**
- **[SOP: Development Workflow](docs/SOP_DEVELOPMENT_WORKFLOW.md)** - Complete workflow from requirements to production with phase-based agent orchestration
- **[Agent Responsibility Matrix](docs/AGENT_RESPONSIBILITY_MATRIX.md)** - Agent selection guide, capabilities, and collaboration patterns

**For Orchestrator Agents:**
- Follow phase-based workflow (Phase 0-5) defined in SOP
- Use agent invocation templates for consistency
- Track phase gates and validation checkpoints
- Manage handoffs between agents with explicit input/output artifacts
- See "Standard Task Workflow" section in SOP for detailed agent workflows

**For Individual Specialized Agents:**
- Refer to your specific responsibilities in the Agent Responsibility Matrix
- Follow invocation templates when deployed
- Deliver artifacts specified in phase workflows
- Validate deliverables against success criteria

**Quick Command:** Type `/follow-sop` to load SOP context

---

## Project Overview

The Picasso Config Builder is a web-based internal operations tool for managing conversational forms, CTAs, conversation branches, and content showcase configurations for the Picasso chat widget. It allows non-technical team members to configure forms-enabled tenants without manual JSON editing.

## Key Features

- **Forms Management**: Create and edit conversational forms with field builders (text, email, phone, select, multi-select, date, number, composite fields)
- **CTA Configuration**: Define call-to-action buttons with conditional prompts and explicit routing
- **Branch Editor**: Configure conversation flow with priority-based branching
- **Program Management**: Manage programs and their relationships
- **Content Showcase**: Create responsive content cards with rich media and CTAs
- **Action Chips**: Define explicit routing for action chips with 3-tier hierarchy
- **Visual Flow Diagram**: Interactive dashboard showing hierarchical relationships between all config entities with validation status indicators
- **Validation**: Real-time validation with dependency checking and pre-deployment validation
- **S3 Integration**: Direct deployment to tenant configuration storage with backup/rollback

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build System**: ESBuild (custom config in `esbuild.config.mjs`)
- **UI Framework**: shadcn/ui components (Radix UI primitives)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS (green theme matching analytics dashboard)
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Backend**: AWS Lambda (Node.js 20.x) + API Gateway
- **Storage**: S3 (`myrecruiter-picasso` bucket)

## Project Structure

```
picasso-config-builder/
├── src/
│   ├── components/
│   │   ├── editors/          # Main editors (Forms, CTAs, Branches, Programs, etc.)
│   │   │   ├── ActionChipsEditor/
│   │   │   ├── BranchesEditor/
│   │   │   ├── CTAsEditor/
│   │   │   ├── ProgramsEditor/
│   │   │   └── ShowcaseEditor/
│   │   ├── dashboard/        # Flow diagram components
│   │   │   ├── FlowDiagram.tsx
│   │   │   ├── EntityNode.tsx
│   │   │   ├── EntityList.tsx
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   ├── layout/           # Layout components (Header, Sidebar, etc.)
│   │   ├── modals/           # Modal dialogs
│   │   ├── ui/               # shadcn/ui components
│   │   └── settings/         # Settings components
│   ├── hooks/
│   │   ├── useConfig.ts      # Main config hook
│   │   ├── useAutoSave.ts    # Auto-save functionality
│   │   └── crud/             # CRUD operation hooks
│   ├── lib/
│   │   ├── api/              # API client and config operations
│   │   │   ├── client.ts
│   │   │   ├── config-operations.ts
│   │   │   ├── localDevServer.ts     # Mock dev server
│   │   │   └── localDevServerS3.ts   # S3-backed dev server
│   │   ├── schemas/          # Zod schemas for validation
│   │   │   ├── tenant.schema.ts
│   │   │   ├── form.schema.ts
│   │   │   ├── cta.schema.ts
│   │   │   ├── branch.schema.ts
│   │   │   └── program.schema.ts
│   │   ├── validation/       # Validation logic
│   │   │   ├── formValidation.ts
│   │   │   ├── ctaValidation.ts
│   │   │   ├── branchValidation.ts
│   │   │   ├── dependencyTracking.ts
│   │   │   ├── preDeploymentValidation.ts
│   │   │   └── runtimeValidation.ts
│   │   └── utils/            # Utility functions
│   ├── store/
│   │   ├── index.ts          # Main Zustand store
│   │   ├── slices/           # Store slices
│   │   │   ├── config.ts
│   │   │   ├── forms.ts
│   │   │   ├── ctas.ts
│   │   │   ├── branches.ts
│   │   │   ├── programs.ts
│   │   │   ├── contentShowcase.ts
│   │   │   ├── validation.ts
│   │   │   └── ui.ts
│   │   └── selectors/        # Computed selectors
│   ├── types/
│   │   ├── config.ts         # Main config types
│   │   ├── validation.ts     # Validation types
│   │   ├── api.ts            # API types
│   │   └── ui.ts             # UI types
│   ├── pages/                # Page components
│   │   ├── DashboardPage.tsx # Visual flow diagram dashboard
│   └── main.tsx              # Application entry point
├── lambda/                   # AWS Lambda function (production)
│   ├── index.mjs             # Lambda handler
│   └── README.md
├── mock-s3/                  # Local dev tenant configs
│   ├── TEST001.json
│   └── TEST002.json
├── e2e/                      # Playwright E2E tests
├── tests/                    # Additional test files
├── docs/                     # Comprehensive documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── KEYBOARD_SHORTCUTS.md
│   ├── TENANT_CONFIG_SCHEMA.md
│   ├── TYPE_SYSTEM_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   ├── VALIDATION_CHECKLIST.md
│   └── WEB_CONFIG_BUILDER_PRD.md
└── esbuild.config.mjs        # Custom ESBuild configuration
```

## Commands

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev                    # Runs on http://localhost:3000
# Start API dev server
npm run server:dev             # S3-backed dev server on http://localhost:3001
# Start mock API server
npm run server:dev:mock        # Mock dev server (no S3 access)
# Start production server
npm run server:prod
```

### Building

```bash
# Build for production
npm run build                         # Build for production
# Build for development
npm run build:dev                     # Build for development
# Build for staging
npm run build:staging                 # Build for staging
# Build for production
npm run build:production              # Explicit production build
# Build with bundle analysis
npm run build:analyze                 # Build with bundle analysis
```

### Testing

```bash
# Unit/Integration tests (Vitest)
npm test                          # Run tests in watch mode
npm run test:ui                       # Run tests with Vitest UI
npm run test:run                      # Run tests once
npm run test:coverage                 # Generate coverage report
npm run test:all                      # Run all tests

# E2E tests (Playwright)
npm run test:e2e                      # Run all E2E tests
npm run test:e2e:headed               # Run E2E tests with browser visible
npm run test:e2e:ui                   # Run E2E tests with Playwright UI
npm run test:e2e:chromium             # Run E2E tests in Chromium only
npm run test:e2e:firefox              # Run E2E tests in Firefox only
npm run test:e2e:webkit               # Run E2E tests in WebKit only
npm run test:e2e:report               # Show E2E test report

# All tests
npm run test:all               # Run all tests (unit + E2E)
```

### Validation

```bash
npm run typecheck                     # TypeScript type checking only
npm run validate                      # Full validation (TypeCheck + Production build)
npm run validate:quick                # Quick validation (TypeCheck + Dev build)
npm run validate:phase2               # Validate Phase 2 components
npm run validate:phase3               # Validate Phase 3 components
npm run validate:phase5               # Validate Phase 5 S3 integration
```

### Code Quality

```bash
npm run lint                          # ESLint code checking
npm run format                        # Format code with Prettier
```

### Documentation Maintenance

```bash
# CLAUDE.md automation
npm run docs:update                   # Update CLAUDE.md automatically
npm run docs:update:dry-run           # Preview CLAUDE.md changes
npm run docs:validate                 # Validate CLAUDE.md accuracy

# Git hooks setup
npm run setup:hooks                   # Install pre-commit hooks for CLAUDE.md
```


## Configuration Schema Versions

The Config Builder supports Picasso tenant config schema v1.4.1 (latest):

- **v1.4.1** (2025-10-30): Action Chips Explicit Routing with 3-tier hierarchy
- **v1.4** (2025-10-29): Composite field types (address, name, phone+email)
- **v1.3** (2025-10-15): Conversational forms

### Key Schema Sections

- `programs`: Program definitions with metadata and relationships
- `conversational_forms`: Form definitions with fields and validation
- `form_settings`: Global form behavior configuration
- `conversation_branches`: Priority-based routing with context_type matching
- `action_chips`: Explicit routing configuration with 3-tier hierarchy
- `content_showcase`: Content cards with rich media and CTAs
- `card_inventory`: Extracted actions, requirements, programs (legacy)

## Path Aliases

The project uses path aliases configured in `esbuild.config.mjs`:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@lib/` → `src/lib/`
- `@hooks/` → `src/hooks/`
- `@types/` → `src/types/`

## Environment Variables

Create a `.env.local` file for local development:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# AWS Configuration
VITE_S3_BUCKET=myrecruiter-picasso
VITE_AWS_REGION=us-east-1

# Dev Server Configuration
DEV_SERVER_PORT=3001
NODE_ENV=development
```

## Development Workflow

### Standard Development Flow

1. Start the API server: `npm run server:dev`
2. In a separate terminal, start the frontend: `npm run dev`
3. Navigate to http://localhost:3000
4. Load a tenant config (e.g., TEST001)
5. Make changes using the editors
6. Changes auto-save to local state
7. Use "Deploy to S3" to save to backend
8. Validate before deployment with pre-deployment checks

### Working with Tenant Configs

1. **Loading**: Select tenant from dropdown or create new
2. **Editing**: Use tab-based editors (Forms, CTAs, Branches, Programs, etc.)
3. **Validation**: Real-time validation with dependency tracking
4. **Deployment**: Deploy to S3 with automatic backup creation
5. **Rollback**: Restore from previous backups if needed

### Testing Workflow

1. Write tests in `src/**/__tests__/` (unit/integration) or `e2e/` (E2E)
2. Run tests: `npm test` (unit) or `npm run test:e2e` (E2E)
3. Check coverage: `npm run test:coverage`
4. Fix any failing tests before committing

## Key Concepts

### Dependency Tracking

The validation system tracks relationships between entities:

- Forms can reference Programs
- CTAs can reference Forms and Programs
- Branches can reference CTAs, Forms, and Programs
- Deleting an entity triggers cascade warnings
- Validation ensures no broken references

### Composite Fields

Forms support composite field types that group related fields:

- `address`: Street, City, State, ZIP
- `full_name`: First Name, Last Name
- `phone_and_email`: Phone, Email

### Action Chips Routing

3-tier hierarchy for routing:

1. **action_chips.explicit_routes**: Highest priority (exact match)
2. **action_chips.smart_routing**: Medium priority (keyword/pattern match)
3. **conversation_branches**: Lowest priority (fallback)

### Content Showcase

Rich content cards with:

- Title, description, category tags
- Image URL with alt text
- Multiple CTAs per card
- Conditional visibility
- Responsive layout

## Dashboard (Flow Diagram)

The Dashboard page (`/dashboard`) provides a visual representation of the configuration structure:

### Sections

1. **Programs Hierarchy**
   - Tree view: Programs → Forms → CTAs → Branches
   - Shows nested relationships
   - Expandable/collapsible nodes
   - Initial state: Programs visible, forms collapsed

2. **Action Chips**
   - Flat list of all action chips
   - Shows routing configuration
   - Validation status indicators

3. **Content Showcase**
   - Flat list of showcase items
   - Shows referenced CTAs
   - Category and visibility information

### Features

- **Color Coding**: Each entity type has a distinct color (blue=programs, green=forms, purple=CTAs, orange=branches, cyan=action chips, pink=showcase)
- **Validation Indicators**: Red (errors), yellow (warnings), green (success), gray (not validated)
- **Navigation**: Click any node to navigate to its editor with auto-selection
- **Expand/Collapse**: Chevron icons for nodes with children
- **Entity Counts**: Badge showing number of child entities
- **Responsive Design**: Mobile-friendly with horizontal scroll for deep nesting

### Usage

1. Navigate to `/dashboard` or click "Dashboard" in sidebar
2. View entity count summary at top
3. Expand programs to see forms, CTAs, and branches
4. Click any entity to navigate to its editor
5. Check validation status at a glance

## Important Files

### Configuration

- `esbuild.config.mjs`: Build configuration with path aliases
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `vitest.config.ts`: Vitest test configuration
- `playwright.config.ts`: Playwright E2E test configuration

### State Management

- `src/store/index.ts`: Main Zustand store with all slices
- `src/store/slices/*.ts`: Individual state slices
- `src/store/selectors/*.ts`: Computed selectors

### Validation

- `src/lib/validation/index.ts`: Main validation entry point
- `src/lib/validation/preDeploymentValidation.ts`: Pre-deployment checks
- `src/lib/validation/runtimeValidation.ts`: Real-time validation
- `src/lib/validation/dependencyTracking.ts`: Relationship tracking

### API Integration

- `src/lib/api/client.ts`: API client with retry logic
- `src/lib/api/config-operations.ts`: Config CRUD operations
- `src/lib/api/mergeStrategy.ts`: Config merge logic
- `lambda/index.mjs`: Production Lambda handler

## Testing Guidelines

### Unit Tests

- Test individual components and functions
- Use Vitest + React Testing Library
- Mock external dependencies
- Aim for high coverage on validation logic

### Integration Tests

- Test component interactions
- Test state management flows
- Test API integration
- Located in `src/__tests__/integration/`

### E2E Tests

- Test complete user workflows
- Use Playwright
- Test across browsers (Chromium, Firefox, WebKit)
- Located in `e2e/`

## Common Development Tasks

### Working with the Dashboard

The Dashboard uses a custom tree visualization:

1. **Tree Building**: `buildTreeStructure()` in `src/components/dashboard/utils.ts`
   - Creates hierarchical nodes from flat entity lists
   - Links entities via ID references
   - Integrates validation status
   - Handles circular references

2. **Entity Nodes**: Color-coded cards with expand/collapse
   - `EntityNode.tsx`: Individual node component
   - `EntityList.tsx`: Recursive list renderer
   - React.memo for performance optimization

3. **Navigation**: Click-to-navigate pattern
   - Routes to entity editor with `?selected={id}` query param
   - Editors should support auto-selection via query param

4. **Validation Integration**: Real-time status updates
   - Retrieves validation errors/warnings from Zustand store
   - Calculates status per entity
   - Displays count badges

### Adding a New Form Field Type

1. Update `src/types/config.ts` with new field type
2. Add Zod schema in `src/lib/schemas/form.schema.ts`
3. Update form editor UI in `src/components/editors/`
4. Add validation rules in `src/lib/validation/formValidation.ts`
5. Write tests for new field type
6. Update documentation

### Adding a New Validation Rule

1. Update validation logic in `src/lib/validation/`
2. Update validation types in `src/types/validation.ts`
3. Update validation slice in `src/store/slices/validation.ts`
4. Write tests for validation rule
5. Update validation checklist in docs

### Modifying the API

1. Update Lambda handler in `lambda/index.mjs`
2. Update API client in `src/lib/api/client.ts`
3. Update API types in `src/types/api.ts`
4. Update local dev server if needed
5. Test with both mock and real S3
6. Update API documentation

## Troubleshooting

### Port Already in Use

Change ports in `.env.local`:

```env
DEV_SERVER_PORT=3002
VITE_API_URL=http://localhost:3002
```

### Cannot Find Module Errors

```bash
npm install
```

### CORS Errors

Ensure both dev server and frontend are running on expected ports.

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build:dev
```

### Test Failures

```bash
# Run tests with verbose output
npm run test:run -- --reporter=verbose

# Run specific test file
npm test -- path/to/test.test.ts
```

### S3 Access Issues

Ensure AWS credentials are configured:

```bash
aws configure
aws s3 ls s3://myrecruiter-picasso/
```

## Documentation

- **[API Documentation](docs/API_DOCUMENTATION.md)**: API endpoints and usage
- **[Architecture](docs/ARCHITECTURE.md)**: System architecture overview
- **[User Guide](docs/USER_GUIDE.md)**: End-user documentation
- **[Keyboard Shortcuts](docs/KEYBOARD_SHORTCUTS.md)**: Keyboard shortcuts
- **[Type System](docs/TYPE_SYSTEM_DOCUMENTATION.md)**: TypeScript type system
- **[Validation Checklist](docs/VALIDATION_CHECKLIST.md)**: Pre-deployment checklist
- **[Tenant Config Schema](docs/TENANT_CONFIG_SCHEMA.md)**: Config schema v1.4.1

## Related Systems

- **Picasso Widget** (`/Picasso`): Consumes configs from S3
- **deploy_tenant_stack Lambda**: Creates base tenant configs
- **Bubble.io**: Handles notification/integration routing (separate from forms)

## Deployment

### Frontend Deployment

Deploy to S3 + CloudFront for private internal access:

```bash
npm run build:production
# Upload dist/ to S3 bucket
```

### Lambda Deployment

Package and deploy via AWS SAM or CDK:

```bash
cd lambda
npm ci --production
npm run package
aws lambda update-function-code --function-name config-api --zip-file fileb://deployment.zip
```

## Support

For questions or issues:

1. Check documentation in `/docs`
2. Review validation checklist
3. Check test output for errors
4. Review API logs in Lambda CloudWatch

## CLAUDE.md Maintenance

This CLAUDE.md file is automatically maintained using automation scripts.

### Automatic Updates

The following are automatically synced from source files:

- **Commands section**: Synced from package.json scripts
- **Version number**: Synced from package.json version
- **Last Updated date**: Auto-updated on changes

### Maintenance Commands

```bash
# Update CLAUDE.md with latest project info
npm run docs:update

# Preview changes without applying
npm run docs:update:dry-run

# Validate CLAUDE.md accuracy
npm run docs:validate

# Install git hooks for automatic reminders
npm run setup:hooks
```

### Git Hooks

After running `npm run setup:hooks`, a pre-commit hook will:

1. Detect changes to package.json, esbuild.config.mjs, etc.
2. Remind you to update CLAUDE.md if needed
3. Validate CLAUDE.md if included in commit
4. Allow you to proceed or abort

**Bypass hook for a single commit:**

```bash
git commit --no-verify -m "message"
```

### Manual Updates

Some sections require manual updates:

- **Project Overview**: Update when project scope changes
- **Key Features**: Add new features as implemented
- **Key Concepts**: Document new architectural patterns
- **Common Development Tasks**: Add new workflows
- **Troubleshooting**: Add solutions to recurring issues
- **Documentation**: Add new documentation files

### When to Update

**Always update:**

- After adding/removing npm scripts → Run `npm run docs:update`
- Before version releases → Run `npm run docs:update`
- When adding new features → Manually update Key Features
- When changing architecture → Manually update relevant sections

**Best practice:** Update CLAUDE.md in the **same commit** as the change it documents.

### Validation

Before committing CLAUDE.md changes:

```bash
npm run docs:validate
```

This checks for:

- Missing or undocumented npm scripts
- Version mismatches
- Broken documentation links
- Missing required sections
- Stale documentation (>90 days old)

See `scripts/README.md` for detailed automation documentation.

## Status

- **Version**: 0.1.0
- **Status**: Active Development
- **Last Updated**: 2025-11-06
- **Schema Version**: v1.4.1
