# Picasso Config Builder - API Documentation

**Version**: 1.3
**Last Updated**: 2025-10-19
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [S3 Operations API](#s3-operations-api)
3. [Configuration Schema v1.3](#configuration-schema-v13)
4. [Validation Engine](#validation-engine)
5. [Code Examples](#code-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Overview

The Picasso Config Builder API provides a type-safe, validated interface for managing tenant configurations stored in S3. The API abstracts away the complexity of S3 operations, configuration merging, and validation, providing a simple set of operations for loading, editing, and deploying tenant configurations.

### Architecture

The API uses a **Lambda Proxy Pattern** where all S3 operations are performed server-side through HTTP API Gateway endpoints. This provides:

- Enhanced security (no client-side AWS credentials)
- Built-in retry logic with exponential backoff
- Automatic backup creation before destructive operations
- Real-time validation before deployment

### Key Components

- **Config Operations** (`src/lib/api/config-operations.ts`) - High-level API functions
- **API Client** (`src/lib/api/client.ts`) - HTTP client with retry logic
- **Error Handling** (`src/lib/api/errors.ts`) - Type-safe error codes
- **Merge Strategy** (`src/lib/api/mergeStrategy.ts`) - Section-based editing
- **Validation Engine** (`src/lib/validation/`) - Comprehensive validation rules

---

## S3 Operations API

### Authentication

All API endpoints require authentication through the Lambda proxy. The API expects requests to include proper authentication headers configured in your environment.

```typescript
// Environment configuration
VITE_API_URL=https://api.yourapi.com/api
```

### Available Operations

#### 1. List Tenants

Retrieves a list of all tenant configurations from S3.

**Function**: `listTenants()`

**Returns**: `Promise<TenantListItem[]>`

**TypeScript Signature**:
```typescript
interface TenantListItem {
  tenantId: string;        // Unique tenant identifier
  tenantName: string;      // Display name from config
  lastModified: number;    // Unix timestamp of last modification
  version: string;         // Current config version (e.g., "1.3")
  tier: string;            // Subscription tier (Free, Standard, Premium, Enterprise)
}
```

**Example Request**:
```typescript
import { listTenants } from '@/lib/api/config-operations';

const tenants = await listTenants();
console.log(`Found ${tenants.length} tenants`);
```

**HTTP Endpoint**: `GET /config/tenants`

**Response Format**:
```json
{
  "tenants": [
    {
      "tenantId": "MYR384719",
      "tenantName": "Miriam's Kitchen",
      "lastModified": 1729353600000,
      "version": "1.3",
      "tier": "Premium"
    }
  ]
}
```

**Error Codes**:
- `FETCH_FAILED` - Network request failed
- `NETWORK_ERROR` - Network connectivity issue
- `UNAUTHORIZED` - Missing or invalid authentication
- `SERVER_ERROR` - S3 or Lambda error

---

#### 2. Get Tenant Metadata

Retrieves metadata for a specific tenant without loading the full configuration. Useful for checking tenant existence and basic info.

**Function**: `getTenantMetadata(tenantId: string)`

**Parameters**:
- `tenantId` (required) - Tenant identifier (alphanumeric, hyphens, underscores)

**Returns**: `Promise<TenantMetadata>`

**TypeScript Signature**:
```typescript
interface TenantMetadata {
  tenantId: string;
  tenantName: string;
  lastModified: number;    // Unix timestamp
  configVersion: string;
  size?: number;           // File size in bytes
  etag?: string;           // S3 ETag for version tracking
}
```

**Example**:
```typescript
import { getTenantMetadata } from '@/lib/api/config-operations';

const metadata = await getTenantMetadata('MYR384719');
console.log(`Last modified: ${new Date(metadata.lastModified)}`);
```

**HTTP Endpoint**: `GET /config/{tenantId}/metadata`

**Error Codes**:
- `INVALID_TENANT_ID` - Empty or invalid tenant ID format
- `TENANT_NOT_FOUND` - Tenant does not exist in S3
- `CONFIG_NOT_FOUND` - Configuration file not found

---

#### 3. Load Configuration

Loads the complete tenant configuration from S3 with basic structure validation.

**Function**: `loadConfig(tenantId: string)`

**Parameters**:
- `tenantId` (required) - Tenant identifier

**Returns**: `Promise<LoadConfigResponse>`

**TypeScript Signature**:
```typescript
interface LoadConfigResponse {
  config: TenantConfig;       // Full tenant configuration
  metadata: TenantMetadata;   // File metadata
}
```

**Example**:
```typescript
import { loadConfig } from '@/lib/api/config-operations';

const { config, metadata } = await loadConfig('MYR384719');

console.log(`Loaded config v${config.version}`);
console.log(`Programs: ${Object.keys(config.programs || {}).length}`);
console.log(`Forms: ${Object.keys(config.conversational_forms).length}`);
console.log(`CTAs: ${Object.keys(config.cta_definitions).length}`);
```

**HTTP Endpoint**: `GET /config/{tenantId}`

**Response Validation**:
The function performs basic structure validation:
- Ensures `config.tenant_id` is present
- Ensures `config.version` is present
- Throws `INVALID_CONFIG` if structure is malformed

**Error Codes**:
- `INVALID_TENANT_ID` - Empty or invalid tenant ID
- `CONFIG_NOT_FOUND` - Configuration file not found
- `INVALID_CONFIG` - Malformed or corrupted configuration
- `PARSE_ERROR` - JSON parsing failed

---

#### 4. Save Configuration

Saves tenant configuration to S3 with automatic versioning and optional backup creation.

**Function**: `saveConfig(tenantId: string, config: TenantConfig, options?: { createBackup?: boolean })`

**Parameters**:
- `tenantId` (required) - Tenant identifier
- `config` (required) - Complete tenant configuration object
- `options` (optional):
  - `createBackup` (default: `true`) - Create backup before saving

**Returns**: `Promise<void>`

**Automatic Updates**:
The function automatically:
1. Updates `config.tenant_id` to match the request
2. Updates `config.generated_at` to current timestamp
3. Increments `config.version` (e.g., "1.3" → "1.4")

**Example**:
```typescript
import { loadConfig, saveConfig } from '@/lib/api/config-operations';

// Load existing config
const { config } = await loadConfig('MYR384719');

// Make changes
config.conversational_forms['new_form'] = {
  enabled: true,
  form_id: 'new_form',
  program: 'volunteer_program',
  title: 'Volunteer Application',
  description: 'Apply to volunteer',
  trigger_phrases: ['volunteer', 'apply'],
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      prompt: 'What is your full name?',
      required: true
    }
  ]
};

// Save with backup (default)
await saveConfig('MYR384719', config);

// Save without backup (not recommended)
await saveConfig('MYR384719', config, { createBackup: false });
```

**HTTP Endpoint**: `PUT /config/{tenantId}`

**Request Body**:
```json
{
  "config": { /* full tenant config */ },
  "createBackup": true
}
```

**Error Codes**:
- `INVALID_TENANT_ID` - Empty or invalid tenant ID
- `VALIDATION_ERROR` - Config is null/undefined or tenant_id mismatch
- `SAVE_FAILED` - S3 write operation failed
- `STORAGE_ERROR` - S3 storage error (quota, permissions)

**Retry Behavior**:
- Maximum retries: 2 (fewer than read operations)
- Exponential backoff: 1s, 2s
- Only retries on network/timeout errors

---

#### 5. Deploy Configuration

Deploys tenant configuration to production. Identical to `saveConfig` but semantically indicates a production deployment and always creates a backup.

**Function**: `deployConfig(tenantId: string, config: TenantConfig)`

**Parameters**:
- `tenantId` (required) - Tenant identifier
- `config` (required) - Validated configuration object

**Returns**: `Promise<void>`

**Behavior**:
- Always creates a backup before deployment
- Updates version and timestamp
- Performs the same validation as `saveConfig`

**Example**:
```typescript
import { deployConfig, validatePreDeployment } from '@/lib/api';
import { useStore } from '@/store';

async function deployTenantConfig(tenantId: string) {
  const state = useStore.getState();

  // Run pre-deployment validation
  const validation = validatePreDeployment(
    state.programs.programs,
    state.forms.forms,
    state.ctas.ctas,
    state.branches.branches
  );

  if (!validation.valid) {
    throw new Error(`Cannot deploy: ${validation.errors.length} errors`);
  }

  // Merge edited sections into full config
  const config = prepareConfigForDeployment(
    state.config.baseConfig,
    {
      programs: state.programs.programs,
      forms: state.forms.forms,
      ctas: state.ctas.ctas,
      branches: state.branches.branches
    }
  );

  // Deploy to S3
  await deployConfig(tenantId, config.config);

  console.log('✅ Deployment successful');
}
```

**HTTP Endpoint**: `PUT /config/{tenantId}` (same as save)

**Best Practice**: Always run validation before calling `deployConfig`:
```typescript
// ❌ Bad - no validation
await deployConfig(tenantId, config);

// ✅ Good - validate first
const validation = validatePreDeployment(...);
if (validation.valid) {
  await deployConfig(tenantId, config);
}
```

---

#### 6. Delete Configuration

Deletes a tenant configuration from S3. This is an admin operation that cannot be undone unless a backup exists.

**Function**: `deleteConfig(tenantId: string)`

**Parameters**:
- `tenantId` (required) - Tenant identifier

**Returns**: `Promise<void>`

**Example**:
```typescript
import { deleteConfig } from '@/lib/api/config-operations';

// Confirm before deleting
if (confirm(`Delete config for ${tenantId}? This cannot be undone!`)) {
  await deleteConfig(tenantId);
  console.log('Configuration deleted');
}
```

**HTTP Endpoint**: `DELETE /config/{tenantId}`

**Error Codes**:
- `INVALID_TENANT_ID` - Empty or invalid tenant ID
- `TENANT_NOT_FOUND` - Tenant does not exist
- `FORBIDDEN` - Insufficient permissions

**Retry Behavior**:
- Maximum retries: 1 (delete operations should not retry multiple times)
- Use with extreme caution in production

---

#### 7. Health Check

Checks if the API is available and responding.

**Function**: `checkAPIHealth()`

**Returns**: `Promise<boolean>`

**Example**:
```typescript
import { checkAPIHealth } from '@/lib/api/config-operations';

const isHealthy = await checkAPIHealth();
if (!isHealthy) {
  console.error('API is unavailable');
}
```

**HTTP Endpoint**: `GET /health`

**Note**: Returns `false` on any error (no exceptions thrown)

---

### Retry Logic

All read operations use automatic retry with exponential backoff:

**Default Settings**:
- Max retries: 3
- Initial delay: 1000ms
- Max delay: 10000ms
- Backoff factor: 2x

**Retry Schedule**:
1. Attempt 1: Immediate
2. Attempt 2: Wait 1s
3. Attempt 3: Wait 2s
4. Attempt 4: Wait 4s

**Retryable Errors**:
- `FETCH_FAILED` - Network request failed
- `NETWORK_ERROR` - Connection error
- `TIMEOUT` - Request timeout
- `SERVER_ERROR` - 5xx errors

**Non-Retryable Errors**:
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `CONFIG_NOT_FOUND` - 404
- `VALIDATION_ERROR` - 422

**Custom Retry**:
```typescript
import { fetchWithRetry } from '@/lib/api/retry';

const result = await fetchWithRetry(
  async () => {
    // Your async operation
    return await someApiCall();
  },
  {
    maxRetries: 5,
    initialDelayMs: 500,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}: ${error.message}`);
    }
  }
);
```

---

### Utility Functions

#### Version Increment

```typescript
// Internal function (not exported)
// "1.0" → "1.1"
// "1.9" → "1.10"
// "2.5.3" → "2.5.4"
```

#### Tenant ID Validation

```typescript
import { isValidTenantId, sanitizeTenantId } from '@/lib/api/config-operations';

isValidTenantId('MYR384719');        // true
isValidTenantId('tenant-123');       // true
isValidTenantId('tenant_test');      // true
isValidTenantId('invalid tenant');   // false (contains space)
isValidTenantId('tenant@123');       // false (contains @)

sanitizeTenantId(' myr384719 ');     // 'MYR384719'
sanitizeTenantId('test-tenant');     // 'TEST-TENANT'
```

**Allowed Characters**: `a-z`, `A-Z`, `0-9`, `-`, `_`

---

## Configuration Schema v1.3

### Overview

Tenant configurations follow a hierarchical structure with three categories:

1. **Editable Sections** - Can be modified through Config Builder
2. **Read-Only Sections** - Preserved during merge (branding, features, AWS)
3. **Metadata Fields** - Auto-updated (version, generated_at)

### Full Schema Structure

```typescript
interface TenantConfig {
  // === METADATA (Auto-managed) ===
  tenant_id: string;                    // e.g., "MYR384719"
  tenant_hash: string;                  // SHA-256 hash for security
  version: string;                      // e.g., "1.3"
  generated_at: number;                 // Unix timestamp
  subscription_tier: 'Free' | 'Standard' | 'Premium' | 'Enterprise';

  // === CORE IDENTITY ===
  chat_title: string;                   // e.g., "Miriam's Kitchen"
  tone_prompt: string;                  // AI personality instructions
  welcome_message: string;              // Initial greeting
  model_id?: string;                    // Bedrock model ID

  // === EDITABLE SECTIONS ===
  programs?: Record<string, Program>;
  conversational_forms: Record<string, ConversationalForm>;
  cta_definitions: Record<string, CTADefinition>;
  conversation_branches: Record<string, ConversationBranch>;
  content_showcase?: ShowcaseItem[];

  // === READ-ONLY SECTIONS ===
  branding: BrandingConfig;
  features: FeaturesConfig;
  quick_help?: QuickHelpConfig;
  action_chips?: ActionChipsConfig;
  widget_behavior?: WidgetBehaviorConfig;
  aws: AWSConfig;
  card_inventory?: CardInventory;       // Deprecated - use content_showcase
}
```

---

### Entity Types

#### 1. Programs

Programs represent organizational services or initiatives. Forms must reference a program.

**TypeScript Type**:
```typescript
interface Program {
  program_id: string;        // Unique identifier (e.g., "volunteer_program")
  program_name: string;      // Display name (e.g., "Volunteer Program")
  description?: string;      // Optional description
}
```

**JSON Example**:
```json
{
  "volunteer_program": {
    "program_id": "volunteer_program",
    "program_name": "Volunteer Program",
    "description": "Join our volunteer team"
  },
  "lovebox_program": {
    "program_id": "lovebox_program",
    "program_name": "Love Box",
    "description": "Monthly care packages for foster families"
  }
}
```

**Validation Rules**:
- ✅ `program_id` required, must be unique
- ✅ `program_name` required, 1-100 characters
- ⚠️ Warning if program is not referenced by any form
- ⚠️ Warning before deletion if used by forms/CTAs

---

#### 2. Conversational Forms

Forms collect user information through conversational field prompts.

**TypeScript Type**:
```typescript
interface ConversationalForm {
  enabled: boolean;
  form_id: string;
  program: string;                      // Required in v1.3+
  title: string;
  description: string;
  cta_text?: string;
  trigger_phrases: string[];
  fields: FormField[];
  post_submission?: PostSubmissionConfig;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'date';
  label: string;                        // UI label
  prompt: string;                       // Conversational prompt
  hint?: string;                        // Help text
  required: boolean;
  options?: FormFieldOption[];          // For 'select' type
  eligibility_gate?: boolean;           // Blocks form on failure
  failure_message?: string;             // Shown if eligibility fails
}

interface FormFieldOption {
  value: string;
  label: string;
}

interface PostSubmissionConfig {
  confirmation_message: string;
  next_steps?: string[];
  actions?: PostSubmissionAction[];
  fulfillment?: Fulfillment;
}

interface PostSubmissionAction {
  id: string;
  label: string;
  action: 'end_conversation' | 'continue_conversation' | 'start_form' | 'external_link';
  formId?: string;                      // For 'start_form'
  url?: string;                         // For 'external_link'
}

interface Fulfillment {
  method: 'email' | 'webhook' | 'dynamodb' | 'sheets';
  recipients?: string[];                // For email
  cc?: string[];
  webhook_url?: string;                 // For webhook
  subject_template?: string;
  notification_enabled?: boolean;
}
```

**JSON Example**:
```json
{
  "volunteer_application": {
    "enabled": true,
    "form_id": "volunteer_application",
    "program": "volunteer_program",
    "title": "Volunteer Application",
    "description": "Apply to join our volunteer team",
    "cta_text": "Apply Now",
    "trigger_phrases": [
      "volunteer",
      "apply to volunteer",
      "join the team"
    ],
    "fields": [
      {
        "id": "full_name",
        "type": "text",
        "label": "Full Name",
        "prompt": "What is your full name?",
        "required": true
      },
      {
        "id": "email",
        "type": "email",
        "label": "Email Address",
        "prompt": "What email address should we use to contact you?",
        "hint": "We'll never share your email",
        "required": true
      },
      {
        "id": "phone",
        "type": "phone",
        "label": "Phone Number",
        "prompt": "What's the best phone number to reach you?",
        "required": false
      },
      {
        "id": "availability",
        "type": "select",
        "label": "Availability",
        "prompt": "How many hours per week can you volunteer?",
        "required": true,
        "options": [
          { "value": "1-5", "label": "1-5 hours" },
          { "value": "6-10", "label": "6-10 hours" },
          { "value": "11+", "label": "11+ hours" }
        ]
      },
      {
        "id": "background_check",
        "type": "select",
        "label": "Background Check",
        "prompt": "Can you pass a background check?",
        "required": true,
        "eligibility_gate": true,
        "failure_message": "Unfortunately, a background check is required for this position.",
        "options": [
          { "value": "yes", "label": "Yes" },
          { "value": "no", "label": "No" }
        ]
      }
    ],
    "post_submission": {
      "confirmation_message": "Thank you for applying! We'll review your application and get back to you within 3-5 business days.",
      "next_steps": [
        "Check your email for confirmation",
        "We'll contact you for an interview",
        "Background check will be initiated"
      ],
      "actions": [
        {
          "id": "explore_programs",
          "label": "Explore Other Programs",
          "action": "continue_conversation"
        }
      ],
      "fulfillment": {
        "method": "email",
        "recipients": ["volunteers@example.org"],
        "subject_template": "New Volunteer Application: {{full_name}}",
        "notification_enabled": true
      }
    }
  }
}
```

**Validation Rules**:
- ✅ `form_id` required and unique
- ✅ `program` required in v1.3+, must reference existing program
- ✅ `title` required, 1-100 characters
- ✅ `fields` must have at least 1 field
- ✅ No duplicate field IDs
- ✅ `select` fields must have at least 1 option
- ✅ Eligibility gates must have `failure_message`
- ⚠️ Warning if no trigger phrases (only accessible via CTA)
- ⚠️ Warning if too many fields (>10 reduces completion rates)
- ⚠️ Warning if no required fields

---

#### 3. CTAs (Call-to-Actions)

CTAs are actionable buttons that trigger forms, links, or informational responses.

**TypeScript Type**:
```typescript
interface CTADefinition {
  label: string;                        // Button text
  action: 'start_form' | 'external_link' | 'send_query' | 'show_info';
  type: 'form_trigger' | 'external_link' | 'bedrock_query' | 'info_request';
  style: 'primary' | 'secondary' | 'info';

  // Conditional fields based on action type
  formId?: string;                      // Required if action = 'start_form'
  url?: string;                         // Required if action = 'external_link'
  query?: string;                       // Required if action = 'send_query'
  prompt?: string;                      // Required if action = 'show_info'

  text?: string;                        // Legacy field (use 'label' instead)
}
```

**Action Types**:

1. **start_form** - Launches a conversational form
   - Requires: `formId` (must reference existing form)

2. **external_link** - Opens external URL
   - Requires: `url` (must use https://)

3. **send_query** - Sends pre-filled query to Bedrock
   - Requires: `query` (the question to send)

4. **show_info** - Displays informational response
   - Requires: `prompt` (specific question/request)

**JSON Examples**:

```json
{
  "volunteer_apply_cta": {
    "label": "Apply to Volunteer",
    "action": "start_form",
    "type": "form_trigger",
    "style": "primary",
    "formId": "volunteer_application"
  },

  "volunteer_info_cta": {
    "label": "Learn About Volunteer Opportunities",
    "action": "external_link",
    "type": "external_link",
    "style": "secondary",
    "url": "https://example.org/volunteer"
  },

  "volunteer_requirements_cta": {
    "label": "What are the requirements?",
    "action": "show_info",
    "type": "info_request",
    "style": "info",
    "prompt": "Tell me about volunteer requirements and time commitments"
  }
}
```

**Validation Rules**:
- ✅ `label` required, 1-50 characters
- ✅ `action` must be valid type
- ✅ Action-specific fields required:
  - `start_form` → `formId` must exist
  - `external_link` → `url` must use https://
  - `send_query` → `query` required
  - `show_info` → `prompt` required
- ⚠️ Warning if label is generic ("Click Here", "Learn More", "Submit")
- ⚠️ Warning if referenced form has no program assigned
- ⚠️ Warning if `show_info` prompt is vague

---

#### 4. Conversation Branches

Branches route conversations based on keyword detection in Bedrock responses.

**TypeScript Type**:
```typescript
interface ConversationBranch {
  detection_keywords: string[];
  available_ctas: {
    primary: string;                    // CTA ID
    secondary: string[];                // Array of CTA IDs
  };
}
```

**JSON Example**:
```json
{
  "volunteer_discussion": {
    "detection_keywords": [
      "volunteer",
      "volunteering",
      "volunteer opportunities",
      "help out",
      "give time"
    ],
    "available_ctas": {
      "primary": "volunteer_apply_cta",
      "secondary": [
        "volunteer_info_cta",
        "volunteer_requirements_cta"
      ]
    }
  },

  "lovebox_discussion": {
    "detection_keywords": [
      "love box",
      "lovebox",
      "foster families",
      "care packages"
    ],
    "available_ctas": {
      "primary": "lovebox_apply_cta",
      "secondary": ["lovebox_info_cta"]
    }
  }
}
```

**Validation Rules**:
- ✅ Must have at least 1 keyword
- ✅ `primary` CTA required and must exist
- ✅ All `secondary` CTAs must exist
- ⚠️ Warning if total CTAs > 3 (runtime limits to 3)
- ⚠️ Warning if keywords contain question words ("what", "how", "why")
  - Keywords should match Bedrock **responses**, not user queries
- ⚠️ Warning if keywords overlap significantly with other branches

**Best Practices**:
- Keywords should be **topic-based**, not question-based
- Use phrases that Bedrock would include in responses
- Avoid overly broad keywords that match multiple branches
- Use priority/sorting to control which branch takes precedence

---

#### 5. Content Showcase

Rich visual cards displayed based on keyword matching (ad inventory model).

**TypeScript Type**:
```typescript
interface ShowcaseItem {
  id: string;
  type: 'program' | 'event' | 'initiative' | 'campaign';
  enabled: boolean;

  // Content
  name: string;
  tagline: string;
  description: string;
  image_url?: string;

  // Supporting details
  stats?: string;                       // e.g., "2-3 hours/month"
  testimonial?: string;                 // e.g., "Best experience! - Sarah M."
  highlights?: string[];                // Array of bullet points

  // Targeting
  keywords: string[];                   // Trigger keywords

  // Action
  action?: ShowcaseItemAction;
}

interface ShowcaseItemAction {
  type: 'prompt' | 'url' | 'cta';
  label: string;

  prompt?: string;                      // For 'prompt' - sends to Bedrock
  url?: string;                         // For 'url' - external link
  open_in_new_tab?: boolean;
  cta_id?: string;                      // For 'cta' - triggers existing CTA
}
```

**JSON Example**:
```json
{
  "content_showcase": [
    {
      "id": "lovebox_card",
      "type": "program",
      "enabled": true,
      "name": "Love Box",
      "tagline": "Support foster families with monthly care packages",
      "description": "Love Box volunteers pack and distribute monthly care packages to local foster families, providing essential items and a message of hope.",
      "image_url": "https://example.org/images/lovebox.jpg",
      "stats": "2-3 hours per month",
      "testimonial": "The most rewarding volunteer experience I've had! - Sarah M.",
      "highlights": [
        "Flexible monthly commitment",
        "Work with a team",
        "Make a direct impact"
      ],
      "keywords": [
        "love box",
        "lovebox",
        "foster families",
        "care packages"
      ],
      "action": {
        "type": "cta",
        "label": "Apply for Love Box",
        "cta_id": "lovebox_apply_cta"
      }
    }
  ]
}
```

**Validation Rules**:
- ✅ `type` must be one of: program, event, initiative, campaign
- ✅ `name`, `tagline`, `description` required
- ✅ At least 1 keyword required
- ✅ If `action.type = 'cta'`, `cta_id` must reference existing CTA
- ✅ If `action.type = 'url'`, `url` required
- ⚠️ Warning if no action defined

---

### Read-Only Sections

These sections are **not editable** through the Config Builder and are preserved during config merges.

#### Branding

```typescript
interface BrandingConfig {
  logo_background_color?: string;       // Hex color
  primary_color: string;                // Hex color
  avatar_background_color?: string;
  header_text_color?: string;
  widget_icon_color?: string;
  font_family: string;
  logo_url?: string;
  avatar_url?: string;
}
```

#### Features

```typescript
interface FeaturesConfig {
  uploads: boolean;
  photo_uploads: boolean;
  voice_input: boolean;
  streaming: boolean;
  conversational_forms: boolean;
  smart_cards: boolean;
  callout: {
    enabled: boolean;
    text?: string;
    auto_dismiss: boolean;
  };
}
```

#### AWS Configuration

```typescript
interface AWSConfig {
  knowledge_base_id: string;            // Bedrock KB ID
  aws_region: string;                   // e.g., "us-east-1"
}
```

#### Quick Help

```typescript
interface QuickHelpConfig {
  enabled: boolean;
  title: string;
  toggle_text: string;
  close_after_selection: boolean;
  prompts: string[];
}
```

#### Widget Behavior

```typescript
interface WidgetBehaviorConfig {
  start_open: boolean;
  remember_state: boolean;
  persist_conversations: boolean;
  session_timeout_minutes: number;
}
```

---

### Merge Strategy

The Config Builder uses **section-based editing** to preserve read-only sections when deploying changes.

**Editable Sections**:
- `programs`
- `conversational_forms`
- `cta_definitions`
- `conversation_branches`
- `content_showcase`

**Read-Only Sections** (preserved):
- `branding`
- `features`
- `quick_help`
- `action_chips`
- `widget_behavior`
- `aws`
- `card_inventory` (deprecated)

**Auto-Updated Metadata**:
- `tenant_id` - Preserved from base config
- `version` - Auto-incremented on save
- `generated_at` - Updated to current timestamp

**Merge Function**:
```typescript
import { mergeConfigSections, prepareConfigForDeployment } from '@/lib/api/mergeStrategy';

// Example: Merge edited sections into base config
const baseConfig = await loadConfig('MYR384719');

const editedSections = {
  programs: { /* updated programs */ },
  conversational_forms: { /* updated forms */ },
  cta_definitions: { /* updated CTAs */ },
  conversation_branches: { /* updated branches */ }
};

const merged = mergeConfigSections(baseConfig.config, editedSections);
// merged.branding is preserved from baseConfig
// merged.version is incremented
// merged.generated_at is updated
```

---

## Validation Engine

The validation engine provides comprehensive validation with clear error messages and actionable suggestions.

### Validation Levels

**Error** (blocks deployment):
- ❌ Missing required fields
- ❌ Invalid references (form/CTA/program doesn't exist)
- ❌ Type mismatches

**Warning** (informational, doesn't block):
- ⚠️ Quality issues (generic labels, no trigger phrases)
- ⚠️ Best practice violations (too many fields, keyword overlap)
- ⚠️ Potential runtime issues (too many CTAs)

**Info** (suggestions):
- ℹ️ Optimization suggestions
- ℹ️ Usage tips

### Validation API

#### Validate Full Configuration

```typescript
import { validateConfig } from '@/lib/validation';

const result = validateConfig(
  programs,      // Record<string, Program>
  forms,         // Record<string, ConversationalForm>
  ctas,          // Record<string, CTADefinition>
  branches,      // Record<string, ConversationBranch>
  cardInventory  // CardInventory | null (optional)
);

// Result structure
interface ConfigValidationResult {
  valid: boolean;                       // false if any errors
  errors: ValidationError[];            // Blocking issues
  warnings: ValidationWarning[];        // Non-blocking issues
  entityResults: EntityValidationResult[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    entitiesWithErrors: number;
    entitiesWithWarnings: number;
  };
}
```

#### Validate from Store State

```typescript
import { validateConfigFromStore } from '@/lib/validation';
import { useStore } from '@/store';

const state = useStore.getState();
const result = validateConfigFromStore(state);

console.log(`Valid: ${result.valid}`);
console.log(`Errors: ${result.summary.totalErrors}`);
console.log(`Warnings: ${result.summary.totalWarnings}`);
```

#### Pre-Deployment Validation

```typescript
import { validatePreDeployment } from '@/lib/validation';

const result = validatePreDeployment(programs, forms, ctas, branches);

if (!result.valid) {
  console.error('Cannot deploy - validation failed');
  result.errors.forEach(error => {
    console.error(`${error.entityType} ${error.entityId}: ${error.message}`);
  });
} else if (result.warnings.length > 0) {
  console.warn(`Deploying with ${result.warnings.length} warnings`);
}
```

---

### Validation Rules Reference

#### Form Validation

**Errors** (block deployment):
```typescript
messages.form = {
  missingProgram: 'Program reference is required',
  invalidProgram: (id) => `Referenced program "${id}" does not exist`,
  noFields: 'Form must have at least one field',
  selectNeedsOptions: 'Select fields must have at least one option',
  duplicateFieldId: (id) => `Duplicate field ID: "${id}"`,
  eligibilityNeedsFailureMessage: 'Eligibility gate fields must have a failure message'
}
```

**Warnings**:
```typescript
warnings = {
  noTriggerPhrases: 'Form has no trigger phrases - users can only access it via CTA',
  tooManyFields: (count) => `Form has too many fields (${count} total). Long forms (>10 fields) may reduce completion rates`,
  noRequiredFields: 'Form should have at least one required field'
}
```

**Validation Function**:
```typescript
import { validateForm } from '@/lib/validation';

const result = validateForm(form, 'volunteer_application', allPrograms);

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`❌ ${error.field}: ${error.message}`);
    if (error.suggestedFix) {
      console.log(`   Fix: ${error.suggestedFix}`);
    }
  });
}
```

---

#### CTA Validation

**Errors**:
```typescript
messages.cta = {
  missingFormId: 'Form ID is required when action is "start_form"',
  invalidFormId: (id) => `Referenced form "${id}" does not exist`,
  missingUrl: 'URL is required when action is "external_link"',
  invalidUrl: 'URL must use https:// protocol',
  missingQuery: 'Query is required when action is "send_query"',
  missingPrompt: 'Prompt is required when action is "show_info"'
}
```

**Warnings**:
```typescript
warnings = {
  genericLabel: 'Button text is generic. Consider using more specific, actionable text',
  vaguePrompt: 'Info CTA prompts should be specific questions or requests',
  formWithoutProgram: (formId) => `Form "${formId}" referenced by this CTA doesn't have a program assigned`
}
```

**Generic Labels** (flagged as warnings):
- "click here", "click"
- "learn more", "more info", "info"
- "submit", "go", "start", "begin"
- "next", "continue"

**Example**:
```typescript
import { validateCTA, isGenericLabel } from '@/lib/validation';

const cta = {
  label: 'Learn More',  // ⚠️ Warning: generic label
  action: 'start_form',
  formId: 'volunteer_application'
};

const result = validateCTA(cta, 'my_cta', allForms);
// result.warnings[0].message = "⚠️ Button text is generic. Consider using more specific, actionable text"
```

---

#### Branch Validation

**Errors**:
```typescript
messages.branch = {
  noKeywords: 'Branch must have at least one detection keyword',
  noPrimaryCTA: 'Branch must have a primary CTA',
  invalidPrimaryCTA: (id) => `Referenced CTA "${id}" does not exist`,
  invalidSecondaryCTA: (id, index) => `Secondary CTA ${index + 1} "${id}" does not exist`
}
```

**Warnings**:
```typescript
warnings = {
  tooManyCTAs: (count) => `Branch has too many CTAs (${count} total). Runtime limits to 3 buttons - only first 3 will be shown`,
  keywordsLookLikeQueries: 'Keywords contain question words. Detection keywords should match anticipated Bedrock responses, not user queries',
  keywordOverlap: (otherBranchId, overlap) => `Keywords overlap significantly with branch "${otherBranchId}": ${overlap.join(', ')}`
}
```

**Question Words** (flagged in keywords):
- "how", "what", "when", "where", "who", "why"
- "tell me", "show me"

**Example**:
```typescript
import { validateBranch, getQuestionWords } from '@/lib/validation';

const branch = {
  detection_keywords: [
    'volunteer',
    'what is volunteering'  // ⚠️ Contains question word "what"
  ],
  available_ctas: {
    primary: 'volunteer_cta',
    secondary: []
  }
};

const result = validateBranch(branch, 'volunteer_branch', allCTAs, allBranches);
// result.warnings includes warning about question words
```

---

#### Relationship Validation

Validates cross-entity references and dependencies.

**Errors**:
```typescript
errors = {
  circularDependency: (entities) => `Circular dependency detected: ${entities.join(' → ')}`,
  orphanedEntity: (type, id) => `Orphaned ${type} "${id}" is not referenced by any other entity`
}
```

**Example**:
```typescript
import { validateRelationships } from '@/lib/validation';

const result = validateRelationships(programs, forms, ctas, branches);

// Checks:
// - Forms reference existing programs
// - CTAs reference existing forms (if action = 'start_form')
// - Branches reference existing CTAs
// - No circular dependencies
```

---

#### Runtime Validation

Validates runtime behavior and identifies potential issues.

**Warnings**:
```typescript
warnings = {
  formNeedsProgram: 'Form should have a program assigned for proper filtering after completion',
  tooManyCTAsInBranch: 'Runtime will only show first 3 CTAs per branch'
}
```

---

### Validation Helpers

#### Get Validation Summary

```typescript
import { getValidationSummary } from '@/lib/validation';

const summary = getValidationSummary(validationResult);
// Returns:
// "✅ Configuration is valid with no errors or warnings"
// or
// "❌ 3 errors found in 2 entities, ⚠️ 5 warnings found in 4 entities"
```

#### Get Issues by Entity

```typescript
import { getIssuesByEntity } from '@/lib/validation';

const issuesByEntity = getIssuesByEntity(validationResult);

issuesByEntity.forEach((issues, entityId) => {
  console.log(`Entity: ${entityId}`);
  issues.errors.forEach(e => console.error(`  ❌ ${e.message}`));
  issues.warnings.forEach(w => console.warn(`  ⚠️ ${w.message}`));
});
```

#### Check Entity Errors

```typescript
import { entityHasErrors, getErrorsForEntity } from '@/lib/validation';

if (entityHasErrors(result, 'volunteer_form')) {
  const errors = getErrorsForEntity(result, 'volunteer_form');
  console.error(`Form has ${errors.length} errors`);
}
```

---

## Code Examples

### Example 1: Load and Display Tenants

```typescript
import { listTenants } from '@/lib/api/config-operations';
import { useState, useEffect } from 'react';

function TenantSelector() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTenants() {
      try {
        setLoading(true);
        const data = await listTenants();
        setTenants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTenants();
  }, []);

  if (loading) return <div>Loading tenants...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <select>
      {tenants.map(tenant => (
        <option key={tenant.tenantId} value={tenant.tenantId}>
          {tenant.tenantName} (v{tenant.version})
        </option>
      ))}
    </select>
  );
}
```

---

### Example 2: Load and Edit Configuration

```typescript
import { loadConfig, saveConfig } from '@/lib/api/config-operations';
import { validateConfig } from '@/lib/validation';

async function editTenantConfig(tenantId: string) {
  // Load existing config
  const { config, metadata } = await loadConfig(tenantId);

  console.log(`Loaded ${tenantId} v${config.version}`);
  console.log(`Last modified: ${new Date(metadata.lastModified)}`);

  // Add a new program
  if (!config.programs) {
    config.programs = {};
  }

  config.programs['new_program'] = {
    program_id: 'new_program',
    program_name: 'New Program',
    description: 'A newly added program'
  };

  // Add a new form
  config.conversational_forms['new_form'] = {
    enabled: true,
    form_id: 'new_form',
    program: 'new_program',
    title: 'New Form',
    description: 'A newly added form',
    trigger_phrases: ['new form', 'apply to new program'],
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        prompt: 'What is your name?',
        required: true
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        prompt: 'What is your email address?',
        required: true
      }
    ],
    post_submission: {
      confirmation_message: 'Thank you for your submission!'
    }
  };

  // Validate before saving
  const validation = validateConfig(
    config.programs || {},
    config.conversational_forms,
    config.cta_definitions,
    config.conversation_branches
  );

  if (!validation.valid) {
    console.error('Validation failed:');
    validation.errors.forEach(err => {
      console.error(`  ${err.entityType} ${err.entityId}: ${err.message}`);
    });
    return;
  }

  if (validation.warnings.length > 0) {
    console.warn(`Saving with ${validation.warnings.length} warnings`);
  }

  // Save configuration
  await saveConfig(tenantId, config, { createBackup: true });

  console.log('✅ Configuration saved successfully');
  console.log(`   New version: ${config.version}`);
}
```

---

### Example 3: Create Form Programmatically

```typescript
import type { ConversationalForm, FormField } from '@/types/config';

function createVolunteerForm(): ConversationalForm {
  const fields: FormField[] = [
    {
      id: 'full_name',
      type: 'text',
      label: 'Full Name',
      prompt: 'What is your full name?',
      required: true
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email Address',
      prompt: 'What email address should we use to contact you?',
      hint: 'We will never share your email',
      required: true
    },
    {
      id: 'phone',
      type: 'phone',
      label: 'Phone Number',
      prompt: 'What is the best phone number to reach you?',
      required: false
    },
    {
      id: 'availability',
      type: 'select',
      label: 'Weekly Availability',
      prompt: 'How many hours per week can you volunteer?',
      required: true,
      options: [
        { value: '1-5', label: '1-5 hours per week' },
        { value: '6-10', label: '6-10 hours per week' },
        { value: '11-15', label: '11-15 hours per week' },
        { value: '16+', label: '16+ hours per week' }
      ]
    },
    {
      id: 'interests',
      type: 'textarea',
      label: 'Areas of Interest',
      prompt: 'What volunteer activities are you most interested in?',
      hint: 'Tell us about your skills and interests',
      required: false
    },
    {
      id: 'background_check',
      type: 'select',
      label: 'Background Check',
      prompt: 'Can you pass a background check? (Required for this role)',
      required: true,
      eligibility_gate: true,
      failure_message: 'Unfortunately, a background check is required for all volunteer positions. Thank you for your interest!',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Not sure' }
      ]
    }
  ];

  const form: ConversationalForm = {
    enabled: true,
    form_id: 'volunteer_application',
    program: 'volunteer_program',
    title: 'Volunteer Application',
    description: 'Apply to join our volunteer team',
    cta_text: 'Apply to Volunteer',
    trigger_phrases: [
      'volunteer',
      'apply to volunteer',
      'volunteer application',
      'become a volunteer',
      'join the team'
    ],
    fields,
    post_submission: {
      confirmation_message: 'Thank you for applying to volunteer! We will review your application and contact you within 3-5 business days.',
      next_steps: [
        'Check your email for a confirmation message',
        'We will review your application',
        'You will receive an email to schedule an interview',
        'Background check will be initiated after interview'
      ],
      actions: [
        {
          id: 'explore_programs',
          label: 'Explore Other Programs',
          action: 'continue_conversation'
        },
        {
          id: 'visit_website',
          label: 'Visit Our Website',
          action: 'external_link',
          url: 'https://example.org/volunteer'
        }
      ],
      fulfillment: {
        method: 'email',
        recipients: ['volunteers@example.org'],
        cc: ['admin@example.org'],
        subject_template: 'New Volunteer Application: {{full_name}}',
        notification_enabled: true
      }
    }
  };

  return form;
}

// Usage
const form = createVolunteerForm();
config.conversational_forms['volunteer_application'] = form;
```

---

### Example 4: Create CTAs and Branches

```typescript
import type { CTADefinition, ConversationBranch } from '@/types/config';

// Create CTAs
function createVolunteerCTAs(): Record<string, CTADefinition> {
  return {
    volunteer_apply: {
      label: 'Apply to Volunteer',
      action: 'start_form',
      type: 'form_trigger',
      style: 'primary',
      formId: 'volunteer_application'
    },

    volunteer_info: {
      label: 'Learn About Opportunities',
      action: 'external_link',
      type: 'external_link',
      style: 'secondary',
      url: 'https://example.org/volunteer'
    },

    volunteer_requirements: {
      label: 'What are the requirements?',
      action: 'show_info',
      type: 'info_request',
      style: 'info',
      prompt: 'Tell me about volunteer requirements, time commitments, and qualifications'
    }
  };
}

// Create branch
function createVolunteerBranch(): ConversationBranch {
  return {
    detection_keywords: [
      'volunteer',
      'volunteering',
      'volunteer opportunities',
      'help out',
      'give back',
      'community service',
      'donate time'
    ],
    available_ctas: {
      primary: 'volunteer_apply',
      secondary: ['volunteer_info', 'volunteer_requirements']
    }
  };
}

// Usage
const ctas = createVolunteerCTAs();
Object.assign(config.cta_definitions, ctas);

config.conversation_branches['volunteer_discussion'] = createVolunteerBranch();
```

---

### Example 5: Full Deployment Workflow

```typescript
import { loadConfig, deployConfig } from '@/lib/api/config-operations';
import { validatePreDeployment, getValidationSummary } from '@/lib/validation';
import { prepareConfigForDeployment } from '@/lib/api/mergeStrategy';

async function deployTenantConfiguration(tenantId: string) {
  try {
    console.log(`🚀 Starting deployment for ${tenantId}`);

    // Step 1: Load current configuration
    console.log('📥 Loading current configuration...');
    const { config: baseConfig } = await loadConfig(tenantId);

    // Step 2: Get current state from store (edited sections)
    const currentState = {
      programs: {
        volunteer_program: {
          program_id: 'volunteer_program',
          program_name: 'Volunteer Program',
          description: 'Join our volunteer team'
        }
      },
      forms: {
        volunteer_application: createVolunteerForm()
      },
      ctas: createVolunteerCTAs(),
      branches: {
        volunteer_discussion: createVolunteerBranch()
      }
    };

    // Step 3: Validate configuration
    console.log('✅ Validating configuration...');
    const validation = validatePreDeployment(
      currentState.programs,
      currentState.forms,
      currentState.ctas,
      currentState.branches
    );

    console.log(getValidationSummary(validation));

    if (!validation.valid) {
      console.error('❌ Validation failed - cannot deploy');
      validation.errors.forEach(error => {
        console.error(`   ${error.entityType} ${error.entityId}: ${error.message}`);
      });
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn(`⚠️ Deploying with ${validation.warnings.length} warnings`);
      validation.warnings.forEach(warning => {
        console.warn(`   ${warning.message}`);
      });
    }

    // Step 4: Merge edited sections into base config
    console.log('🔄 Merging configuration sections...');
    const { config: mergedConfig, metadata } = prepareConfigForDeployment(
      baseConfig,
      currentState
    );

    console.log(`   Sections updated: ${metadata.editable_sections_updated.join(', ')}`);
    console.log(`   New version: ${metadata.version}`);

    // Step 5: Deploy to S3
    console.log('📤 Deploying to S3...');
    await deployConfig(tenantId, mergedConfig as any);

    console.log('✅ Deployment successful!');
    console.log(`   Tenant: ${tenantId}`);
    console.log(`   Version: ${metadata.version}`);
    console.log(`   Timestamp: ${metadata.merged_at}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error instanceof ConfigAPIError) {
      console.error(`   Error code: ${error.code}`);
      console.error(`   User message: ${error.getUserMessage()}`);
    }
    throw error;
  }
}

// Execute deployment
await deployTenantConfiguration('MYR384719');
```

---

### Example 6: Error Handling

```typescript
import { loadConfig, saveConfig } from '@/lib/api/config-operations';
import { ConfigAPIError } from '@/lib/api/errors';

async function safeConfigOperation(tenantId: string) {
  try {
    const { config } = await loadConfig(tenantId);

    // Make changes...
    config.conversational_forms['new_form'] = { /* ... */ };

    await saveConfig(tenantId, config);

  } catch (error) {
    if (error instanceof ConfigAPIError) {
      // Type-safe error handling
      switch (error.code) {
        case 'CONFIG_NOT_FOUND':
          console.error('Configuration not found. Tenant may not exist.');
          break;

        case 'NETWORK_ERROR':
        case 'TIMEOUT':
          console.error('Network issue. Please check your connection and retry.');
          if (error.isRetryable()) {
            // Retry logic already handled by fetchWithRetry
            console.log('Operation will be retried automatically');
          }
          break;

        case 'VALIDATION_ERROR':
          console.error('Configuration is invalid:', error.details);
          break;

        case 'UNAUTHORIZED':
        case 'FORBIDDEN':
          console.error('Permission denied. Please check your access.');
          break;

        case 'SAVE_FAILED':
          console.error('Save operation failed:', error.message);
          break;

        default:
          console.error('Unexpected error:', error.getUserMessage());
      }

      // Log for debugging
      console.log('Error details:', JSON.stringify(error.toJSON(), null, 2));
    } else {
      // Non-API error
      console.error('Unexpected error:', error);
    }
  }
}
```

---

## Error Handling

### Error Types

All API operations throw `ConfigAPIError` instances with specific error codes.

**TypeScript Type**:
```typescript
class ConfigAPIError extends Error {
  code: ConfigErrorCode;
  message: string;
  details?: unknown;
  statusCode?: number;

  isRetryable(): boolean;
  getUserMessage(): string;
  toJSON(): object;
}

type ConfigErrorCode =
  // Network errors
  | 'FETCH_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  // Resource errors
  | 'CONFIG_NOT_FOUND'
  | 'TENANT_NOT_FOUND'
  | 'INVALID_TENANT_ID'
  // Validation errors
  | 'VALIDATION_ERROR'
  | 'INVALID_CONFIG'
  | 'PARSE_ERROR'
  // Permission errors
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  // Save errors
  | 'SAVE_FAILED'
  | 'VERSION_CONFLICT'
  | 'STORAGE_ERROR'
  // Generic errors
  | 'UNKNOWN_ERROR'
  | 'SERVER_ERROR';
```

### Error Methods

#### `isRetryable()`

Returns `true` if the error is network-related and safe to retry:
- `FETCH_FAILED`
- `NETWORK_ERROR`
- `TIMEOUT`
- `SERVER_ERROR`

```typescript
if (error.isRetryable()) {
  console.log('Will retry automatically');
}
```

#### `getUserMessage()`

Returns a user-friendly error message with suggestions:

```typescript
console.error(error.getUserMessage());
// "Network error occurred. Please check your connection and try again."
```

#### `toJSON()`

Converts error to plain object for logging/serialization:

```typescript
console.log(JSON.stringify(error.toJSON(), null, 2));
// {
//   "name": "ConfigAPIError",
//   "code": "CONFIG_NOT_FOUND",
//   "message": "Configuration not found",
//   "userMessage": "Configuration not found. The tenant may not exist...",
//   "statusCode": 404,
//   "details": { ... },
//   "stack": "..."
// }
```

### HTTP Status Code Mapping

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `CONFIG_NOT_FOUND` | Configuration or tenant not found |
| 409 | `VERSION_CONFLICT` | Config modified by another user |
| 422 | `VALIDATION_ERROR` | Invalid configuration data |
| 500, 502, 503, 504 | `SERVER_ERROR` | Server-side error (retryable) |
| Other | `FETCH_FAILED` | Generic fetch failure |

### Error Handling Best Practices

1. **Always use try-catch** for async operations
2. **Check error type** before handling
3. **Use getUserMessage()** for user-facing errors
4. **Log toJSON()** for debugging
5. **Don't retry manually** - retry logic is built-in

```typescript
// ✅ Good error handling
try {
  await deployConfig(tenantId, config);
} catch (error) {
  if (error instanceof ConfigAPIError) {
    toast.error(error.getUserMessage());
    console.error('Deployment failed:', error.toJSON());
  } else {
    toast.error('An unexpected error occurred');
    console.error(error);
  }
}

// ❌ Bad error handling
try {
  await deployConfig(tenantId, config);
} catch (error) {
  alert(error.message); // Raw message not user-friendly
}
```

---

## Best Practices

### 1. Always Validate Before Deploying

```typescript
// ✅ Good
const validation = validatePreDeployment(...);
if (validation.valid) {
  await deployConfig(tenantId, config);
}

// ❌ Bad
await deployConfig(tenantId, config); // No validation
```

### 2. Use Type-Safe Operations

```typescript
// ✅ Good - TypeScript ensures correctness
const form: ConversationalForm = {
  enabled: true,
  form_id: 'my_form',
  program: 'my_program',
  title: 'My Form',
  description: 'Description',
  trigger_phrases: ['trigger'],
  fields: [...]
};

// ❌ Bad - No type safety
const form = { form_id: 'my_form' }; // Missing required fields
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good - comprehensive error handling
try {
  await saveConfig(tenantId, config);
} catch (error) {
  if (error instanceof ConfigAPIError) {
    if (error.isRetryable()) {
      console.log('Retrying automatically...');
    } else {
      console.error(error.getUserMessage());
    }
  }
}

// ❌ Bad - generic error handling
try {
  await saveConfig(tenantId, config);
} catch (error) {
  console.log('Error');
}
```

### 4. Use Merge Strategy for Partial Updates

```typescript
// ✅ Good - preserves read-only sections
const merged = mergeConfigSections(baseConfig, editedSections);

// ❌ Bad - overwrites entire config
const updated = { ...editedSections }; // Loses branding, features, etc.
```

### 5. Leverage Validation Helpers

```typescript
// ✅ Good - clear validation feedback
const summary = getValidationSummary(result);
console.log(summary);

const issuesByEntity = getIssuesByEntity(result);
issuesByEntity.forEach((issues, entityId) => {
  // Show errors per entity
});

// ❌ Bad - manual iteration
result.errors.forEach(e => console.log(e));
```

### 6. Create Backups Before Major Changes

```typescript
// ✅ Good - backup enabled (default)
await saveConfig(tenantId, config, { createBackup: true });

// ⚠️ Risky - no backup
await saveConfig(tenantId, config, { createBackup: false });
```

### 7. Use Semantic Naming

```typescript
// ✅ Good - clear, descriptive IDs
const form: ConversationalForm = {
  form_id: 'volunteer_application',
  program: 'volunteer_program',
  title: 'Volunteer Application'
};

// ❌ Bad - vague, generic IDs
const form = {
  form_id: 'form1',
  program: 'prog1',
  title: 'Form'
};
```

### 8. Avoid Generic CTA Labels

```typescript
// ✅ Good - specific, actionable
{ label: 'Apply to Volunteer', action: 'start_form' }

// ❌ Bad - generic, unclear
{ label: 'Click Here', action: 'start_form' }
{ label: 'Learn More', action: 'external_link' }
```

### 9. Use Keywords for Topics, Not Questions

```typescript
// ✅ Good - topic-based keywords
detection_keywords: ['volunteer', 'volunteering', 'community service']

// ❌ Bad - question-based keywords
detection_keywords: ['how do I volunteer', 'what is volunteering']
// These match user queries, not Bedrock responses
```

### 10. Test in Staging Before Production

```typescript
// ✅ Good - test in staging first
await deployConfig('STAGING_TENANT', config);
// Verify in staging widget
await deployConfig('PROD_TENANT', config);

// ❌ Bad - deploy directly to production
await deployConfig('PROD_TENANT', config); // No testing
```

---

## Appendix: Quick Reference

### Common Operations

```typescript
// List all tenants
const tenants = await listTenants();

// Load configuration
const { config, metadata } = await loadConfig('MYR384719');

// Validate configuration
const result = validateConfig(programs, forms, ctas, branches);

// Save configuration
await saveConfig('MYR384719', config);

// Deploy configuration
await deployConfig('MYR384719', config);

// Check API health
const isHealthy = await checkAPIHealth();
```

### Common Validation Checks

```typescript
// Validate full config
const result = validateConfig(programs, forms, ctas, branches);

// Check if valid
if (!result.valid) { /* handle errors */ }

// Get summary
const summary = getValidationSummary(result);

// Get errors for specific entity
const errors = getErrorsForEntity(result, 'my_form');

// Check if entity has errors
const hasErrors = entityHasErrors(result, 'my_form');
```

### Common Error Checks

```typescript
if (error instanceof ConfigAPIError) {
  // Check if retryable
  if (error.isRetryable()) { /* ... */ }

  // Get user message
  const message = error.getUserMessage();

  // Get error code
  const code = error.code;

  // Convert to JSON
  const json = error.toJSON();
}
```

---

**End of API Documentation**

For additional support or questions, please refer to:
- User Guide: `/docs/USER_GUIDE.md`
- Architecture Documentation: `/docs/ARCHITECTURE.md`
- Sprint Plan: `/docs/SPRINT_PLAN.md`
