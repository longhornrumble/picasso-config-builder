# Architectural Decision Records: Multi-Tenant Bedrock Prompt Customization

**Version**: 1.0
**Date**: 2025-11-17
**Status**: Draft - Phase 0 Architecture Design
**Related TDD**: `TDD_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md`

---

## Table of Contents

1. [ADR-001: Locked vs Unlocked Section Architecture](#adr-001-locked-vs-unlocked-section-architecture)
2. [ADR-002: S3 as Configuration Storage](#adr-002-s3-as-configuration-storage)
3. [ADR-003: No Backward Compatibility Requirement](#adr-003-no-backward-compatibility-requirement)
4. [ADR-004: Config Builder UI for Editing](#adr-004-config-builder-ui-for-editing)
5. [ADR-005: 5-Minute Cache TTL (No Change)](#adr-005-5-minute-cache-ttl-no-change)
6. [ADR-006: Defense-in-Depth Validation](#adr-006-defense-in-depth-validation)
7. [ADR-007: Helper Function Refactoring Pattern](#adr-007-helper-function-refactoring-pattern)
8. [ADR-008: Version Tracking via PROMPT_VERSION Constant](#adr-008-version-tracking-via-prompt_version-constant)

---

## ADR-001: Locked vs Unlocked Section Architecture

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: System Architect, Tech Lead

### Context

Picasso tenants need to customize AI personality (warm vs professional) to match their brand, but certain prompt sections are security-critical and must never be customizable. We need a way to separate brand voice customization from system safety rules.

**Problem Statement:**
- How do we enable tenant-specific AI personalities while protecting critical safety rules?
- What should be customizable vs immutable?
- Where should each layer live (Lambda vs config)?

### Decision

**Implement a layered prompt architecture** with two distinct layers:

**🔒 LOCKED LAYER (Hardcoded in Lambda)**:
- Anti-hallucination rules ("MUST ONLY use information from knowledge base")
- URL/link preservation ("PRESERVE ALL MARKDOWN FORMATTING")
- KB context injection format
- Conversation history handling
- Capability boundaries ("what bot CAN and CANNOT do")
- Loop prevention logic
- Fallback trigger logic (WHEN to show "no information" message)

**🔓 UNLOCKED LAYER (Stored in S3 tenant config)**:
- Role instructions (HOW bot introduces itself)
- Formatting preferences (emoji usage, response style, detail level)
- Custom domain constraints (ADDITIVE only - cannot weaken locked rules)
- Fallback message content (WHAT to say, not WHEN)

**Implementation:**
```javascript
function buildPrompt(userInput, kbContext, tone, conversationHistory, config) {
  const parts = [];

  // LOCKED: Always included, never customizable
  parts.push(getLockedAntiHallucinationRules());
  parts.push(getLockedUrlHandling());
  parts.push(getLockedCapabilityBoundaries());

  // UNLOCKED: Read from config with defaults
  parts.push(getRoleInstructions(config));
  parts.push(buildFormattingRules(config));
  parts.push(getCustomConstraints(config));

  return parts.join('\n');
}
```

### Alternatives Considered

**Alternative 1: Fully Customizable Prompts**
- **Pros**: Maximum flexibility for tenants
- **Cons**: Tenants could weaken/disable anti-hallucination rules, leading to AI making up facts
- **Why rejected**: Unacceptable security risk - one tenant could harm their users by creating unsafe prompts

**Alternative 2: Fully Locked Prompts (Status Quo)**
- **Pros**: Maximum safety, no risk of misconfiguration
- **Cons**: Cannot customize AI personality, all tenants share identical voice
- **Why rejected**: Business requirement for brand-aligned personalities, competitive disadvantage

**Alternative 3: Template-Based System**
- **Pros**: Pre-approved safe templates (e.g., "warm", "professional", "formal")
- **Cons**: Limited flexibility, still requires hardcoded templates in Lambda
- **Why rejected**: Not flexible enough, tenants want custom phrasing (not just selecting from 3-5 options)

**Alternative 4: AI Review Layer**
- **Pros**: AI validates custom prompts before allowing them
- **Cons**: Complex, unreliable, adds latency, doesn't guarantee safety
- **Why rejected**: Cannot trust AI to validate AI prompts, circular dependency

### Consequences

#### Positive
- ✅ **Security**: Critical safety rules are immutable, no risk of tenant misconfiguration
- ✅ **Flexibility**: Tenants can customize brand voice without risking safety
- ✅ **Centralized Updates**: Bug fixes to locked sections deploy to all tenants instantly (Lambda deployment)
- ✅ **Clear Boundaries**: Locked vs unlocked is unambiguous in code and UI

#### Negative
- ⚠️ **Complexity**: Two-layer architecture is more complex than fully hardcoded or fully customizable
- ⚠️ **Maintenance**: Must maintain helper functions for each locked section
- ⚠️ **Documentation Burden**: Must clearly document what can/cannot be customized

#### Neutral
- ℹ️ Locked sections require Lambda deployment to change (intentional - adds friction for safety)
- ℹ️ Unlocked sections require S3 config update + 5-min cache TTL

### Validation

**Test Plan:**
- ✅ Unit tests verify locked sections are always included regardless of config
- ✅ Integration tests verify custom configs cannot override locked sections
- ✅ Security tests attempt prompt injection via config (should fail)
- ✅ Config Builder UI shows locked sections as read-only

---

## ADR-002: S3 as Configuration Storage

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: System Architect, Tech Lead

### Context

We need to store `bedrock_instructions` (unlocked prompt sections) somewhere accessible to Lambda at runtime. The system already uses S3 for tenant configs.

**Problem Statement:**
- Where should we store `bedrock_instructions`?
- Should we use existing infrastructure or add new storage?
- What are the performance and operational implications?

### Decision

**Store `bedrock_instructions` in existing S3 tenant config files** (`s3://myrecruiter-picasso/tenants/{tenant_id}/config.json`).

**Structure:**
```json
{
  "tenant_id": "AUS123957",
  "tone_prompt": "...",  // Keep for now

  "bedrock_instructions": {
    "_version": "1.0",
    "_updated": "2025-11-17T14:30:00Z",
    "role_instructions": "...",
    "formatting_preferences": { ... },
    "custom_constraints": [ ... ],
    "fallback_message": "..."
  },

  "aws": { ... },
  "conversational_forms": { ... }
}
```

**Rationale:**
- S3 is already the source of truth for tenant configs
- Lambda already fetches and caches configs (5-minute TTL)
- No new infrastructure needed
- S3 versioning provides audit trail and rollback capability

### Alternatives Considered

**Alternative 1: DynamoDB**
- **Pros**: Faster reads (<10ms), queryable, better for analytics
- **Cons**: New infrastructure, need to manage consistency with S3, additional cost
- **Why rejected**: Adds unnecessary complexity, existing S3 caching is sufficient

**Alternative 2: Lambda Environment Variables**
- **Pros**: Fastest reads (in-memory), no S3 calls
- **Cons**: 4KB limit per variable, need Lambda redeploy for every tenant change, doesn't scale
- **Why rejected**: Cannot store all tenant configs in env vars (too many tenants, too large)

**Alternative 3: Separate Config Service (API)**
- **Pros**: Centralized config management, real-time updates, versioning, A/B testing
- **Cons**: New service to build/maintain, additional latency, operational complexity
- **Why rejected**: Over-engineering for current needs, 5-min cache TTL is acceptable

**Alternative 4: Hardcoded in Lambda per Tenant**
- **Pros**: No external dependencies, fast
- **Cons**: Lambda deployment for every tenant change, doesn't scale, defeats purpose
- **Why rejected**: This is what we're trying to move away from

**Alternative 5: AWS Systems Manager Parameter Store**
- **Pros**: Built for config storage, versioning, encryption
- **Cons**: Need to migrate existing S3 configs, dual storage, 10 TPS limit could be bottleneck
- **Why rejected**: S3 already works, no compelling reason to migrate

### Consequences

#### Positive
- ✅ **No new infrastructure**: Leverages existing S3 bucket and Lambda config fetch logic
- ✅ **S3 versioning**: Every config change creates a snapshot for audit/rollback
- ✅ **Proven reliability**: S3 is highly durable (99.999999999%) and available
- ✅ **Cost-effective**: No additional services, S3 storage is cheap
- ✅ **Cache hits**: Most reads served from Lambda cache (5-min TTL), minimal S3 load

#### Negative
- ⚠️ **Config changes not instant**: 5-minute cache TTL means changes take up to 5 minutes to propagate
- ⚠️ **No query capability**: Cannot easily query "which tenants use emoji_usage: generous"
- ⚠️ **S3 read latency**: Cold starts require S3 read (~100ms), though rare due to caching

#### Neutral
- ℹ️ S3 is eventually consistent (rare edge case, mitigated by cache)
- ℹ️ S3 versioning consumes storage (mitigated by lifecycle policy to delete old versions >90 days)

### Implementation Notes

**S3 Bucket Configuration:**
```javascript
// Enable versioning (if not already enabled)
aws s3api put-bucket-versioning \
  --bucket myrecruiter-picasso \
  --versioning-configuration Status=Enabled

// Add lifecycle policy to delete old versions
{
  "Rules": [{
    "Id": "DeleteOldConfigVersions",
    "Status": "Enabled",
    "NoncurrentVersionExpiration": {
      "NoncurrentDays": 90
    }
  }]
}
```

**Lambda Config Fetch** (existing, no changes needed):
```javascript
// Existing code in index.js (line ~40)
const CONFIG_CACHE = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getConfig(tenantId) {
  const cacheKey = `${tenantId}_config`;
  const cached = CONFIG_CACHE[cacheKey];

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data; // Cache hit
  }

  // Cache miss - fetch from S3
  const s3Result = await s3.getObject({
    Bucket: 'myrecruiter-picasso',
    Key: `tenants/${tenantId}/config.json`
  }).promise();

  const config = JSON.parse(s3Result.Body.toString());
  CONFIG_CACHE[cacheKey] = { data: config, timestamp: Date.now() };

  return config;
}
```

### Validation

**Test Plan:**
- ✅ Integration test: Update config in S3 → wait 5 min → verify Lambda uses new config
- ✅ Rollback test: Restore previous S3 version → verify Lambda uses old config after cache expires
- ✅ Performance test: Measure S3 read latency on cold start (<100ms target)
- ✅ Load test: Verify cache hit rate >95% under realistic load

---

## ADR-003: No Backward Compatibility Requirement

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: Product Manager, Tech Lead

### Context

When deploying the new `bedrock_instructions` schema, we could either:
1. Support both old and new schemas (backward compatible)
2. Require all tenants migrate to new schema (clean break)

**Problem Statement:**
- Should we maintain backward compatibility with tenants lacking `bedrock_instructions`?
- What are the trade-offs of each approach?

### Decision

**No backward compatibility required** - all tenants must be migrated to the new `bedrock_instructions` schema.

**Reasoning:**
- Small tenant count (~10-20 tenants, manageable migration)
- One-time migration script handles all tenants automatically
- Simpler Lambda code (no dual-schema support)
- Cleaner codebase going forward

**Migration Plan:**
- Create migration script to add `bedrock_instructions` to all existing tenant configs
- Run migration during low-traffic window (Saturday 2am ET)
- Validate all tenants post-migration
- No tenants remain on old schema

### Alternatives Considered

**Alternative 1: Support Both Schemas (Backward Compatible)**

```javascript
function buildPrompt(userInput, kbContext, tone, conversationHistory, config) {
  // Option 1: Check for new schema
  if (config?.bedrock_instructions) {
    return buildPromptWithNewSchema(config, ...);
  } else {
    // Fallback to old hardcoded behavior
    return buildPromptLegacy(config, ...);
  }
}
```

- **Pros**: No migration required, tenants can upgrade individually, zero risk of breakage
- **Cons**: Code complexity (two code paths), technical debt, harder to maintain, eventual migration still needed
- **Why rejected**: Delays inevitable migration, adds complexity without long-term benefit

**Alternative 2: Graceful Degradation (Use Defaults if Missing)**

```javascript
function getRoleInstructions(config) {
  return config?.bedrock_instructions?.role_instructions
    || DEFAULT_ROLE_INSTRUCTIONS; // Fallback to default
}
```

- **Pros**: Resilient to missing configs, no hard requirement for migration
- **Cons**: Tenants could remain on defaults indefinitely, unclear if migration is optional or required
- **Why rejected**: Creates ambiguity - is migration required or not? Better to be explicit

**Alternative 3: Hard Requirement (Reject Requests if Missing)**

```javascript
if (!config?.bedrock_instructions) {
  throw new Error('bedrock_instructions required but missing');
}
```

- **Pros**: Forces migration, very clear requirement
- **Cons**: Breaks chatbots if migration incomplete, harsh user experience
- **Why rejected**: Too strict - if migration has issues, chatbots break (unacceptable)

### Decision: Hybrid Approach

**Chosen approach combines Alternative 1 (temporary) + migration:**

**Phase 1: Deploy Lambda with defaults** (backward compatible temporarily)
```javascript
function getRoleInstructions(config) {
  if (!config?.bedrock_instructions) {
    console.warn(`⚠️  Tenant ${config.tenant_id} missing bedrock_instructions, using defaults`);
  }
  return config?.bedrock_instructions?.role_instructions
    || DEFAULT_ROLE_INSTRUCTIONS;
}
```

**Phase 2: Run migration** (add `bedrock_instructions` to all configs)

**Phase 3: Remove fallback logic** (after verifying 100% migration)
```javascript
function getRoleInstructions(config) {
  // No fallback - bedrock_instructions required
  return config.bedrock_instructions.role_instructions;
}
```

### Consequences

#### Positive
- ✅ **Clean codebase**: No permanent dual-schema support, simpler long-term maintenance
- ✅ **Complete migration**: All tenants on same schema version, easier to reason about
- ✅ **Clear expectations**: Migration is required, not optional
- ✅ **One-time effort**: Migration happens once, then forgotten

#### Negative
- ⚠️ **Migration risk**: If migration fails, chatbots could break (mitigated by dry-run, validation)
- ⚠️ **Deployment coordination**: Must coordinate Lambda deploy + migration script
- ⚠️ **Rollback complexity**: Reverting requires restoring S3 configs from versions

#### Neutral
- ℹ️ Temporary backward compatibility during transition (Phases 1-2)
- ℹ️ Migration script is one-time use (archived after completion)

### Migration Validation

**Pre-Migration Checklist:**
- ✅ Migration script tested in non-production (TEST001, TEST002)
- ✅ Dry-run executed and reviewed (no errors)
- ✅ Rollback procedure tested (restore from S3 version)
- ✅ Low-traffic window scheduled (Saturday 2am ET)

**Post-Migration Validation:**
- ✅ All tenant configs have `bedrock_instructions` object (100% coverage)
- ✅ Spot-check 5-10 tenant chatbots (all working)
- ✅ CloudWatch logs show no errors (zero increase in error rate)
- ✅ PROMPT_VERSION tracked (all requests logging v2.0.0)

**Rollback Criteria:**
- If >10% of tenants fail validation → rollback all
- If any chatbot broken → rollback that tenant immediately
- If widespread errors in CloudWatch → rollback Lambda + configs

---

## ADR-004: Config Builder UI for Editing

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: Product Manager, UX Lead, Tech Lead

### Context

Admins (solopreneur BPO) need a way to edit `bedrock_instructions` for each tenant. Currently, the Config Builder React app manages tenant configurations.

**Problem Statement:**
- How should admins edit bedrock prompts?
- Should we build UI, use manual editing, or create a separate tool?

### Decision

**Build Config Builder UI for editing `bedrock_instructions`** - add new "Bedrock Instructions" editor section to existing Config Builder React app.

**Features:**
- **Locked Sections Display**: Read-only view of system rules (anti-hallucination, URL handling, etc.) with explanations of why they're locked
- **Unlocked Sections Editing**: Textareas, dropdowns, and inputs for role instructions, formatting preferences, custom constraints
- **Validation**: Real-time Zod schema validation with character counts and error messages
- **Preview**: Live preview of assembled prompt showing how locked + unlocked layers combine
- **Save to S3**: Updates config.json with validation before save

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ Bedrock AI Prompt Configuration            │
│                                              │
│ Tabs: [Customizable] [System Rules] [Preview]│
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Role Instructions              [1000 chars]│ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ I'm here to help answer...          │ │ │
│ │ │                                      │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │ Character count: 245 / 1000             │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Formatting Preferences                   │ │
│ │ Emoji Usage: [Moderate ▼]               │ │
│ │ Max Emojis: [3]                         │ │
│ │ Response Style: [Warm Conversational ▼] │ │
│ │ Detail Level: [Balanced ▼]              │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [Save Changes]  [Reset to Defaults]         │
└─────────────────────────────────────────────┘
```

### Alternatives Considered

**Alternative 1: Manual JSON Editing (Direct S3)**
- **Pros**: No UI development needed, maximum flexibility
- **Cons**: Error-prone, no validation, requires technical knowledge, poor UX
- **Why rejected**: Admin is solopreneur managing multiple clients - needs efficient, reliable tool

**Alternative 2: Separate Admin Portal**
- **Pros**: Dedicated tool for prompt management, could add advanced features later
- **Cons**: New codebase to maintain, duplicate infrastructure, worse UX (switching tools)
- **Why rejected**: Config Builder already exists and manages tenant configs - natural fit

**Alternative 3: CLI Tool**
- **Pros**: Fast for power users, scriptable, version controllable
- **Cons**: No preview, no validation feedback, not user-friendly, requires terminal access
- **Why rejected**: GUI is more user-friendly, provides visual feedback

**Alternative 4: API-Only (Programmatic)**
- **Pros**: Flexible, enables automation, could integrate with other tools
- **Cons**: No UI, requires coding, no visual preview
- **Why rejected**: Admin needs GUI for quick iteration and visual feedback

**Alternative 5: Spreadsheet + Upload**
- **Pros**: Familiar interface (Excel/Google Sheets), bulk editing
- **Cons**: No real-time validation, schema errors only caught on upload, poor UX
- **Why rejected**: Validation should happen before save, not after

### Consequences

#### Positive
- ✅ **Integrated UX**: All tenant config editing in one place (forms, CTAs, branches, bedrock prompts)
- ✅ **Real-time validation**: Errors shown immediately, prevents invalid configs
- ✅ **Preview functionality**: See assembled prompt before deploying
- ✅ **Character counts**: Visual feedback prevents exceeding limits
- ✅ **Locked section clarity**: Read-only display explains what can't be customized and why

#### Negative
- ⚠️ **Development time**: 2-3 weeks to build UI components (vs 0 for manual editing)
- ⚠️ **Maintenance burden**: UI bugs to fix, features to add over time
- ⚠️ **Testing complexity**: Need E2E tests for UI workflows

#### Neutral
- ℹ️ Config Builder already uses React, Zustand, shadcn/ui - consistent tech stack
- ℹ️ Admin is single user (no multi-user concurrency issues)

### Implementation Details

**Component Structure:**
```
BedrockInstructionsEditor/
├── index.tsx                       # Main container with tabs
├── LockedSectionsDisplay.tsx       # Read-only locked rules
├── RoleInstructionsEditor.tsx      # Textarea with validation
├── FormattingPreferencesEditor.tsx # Dropdowns + number inputs
├── CustomConstraintsEditor.tsx     # Array input (add/remove)
├── FallbackMessageEditor.tsx       # Textarea with validation
└── PromptPreview.tsx               # Live preview panel
```

**Validation Schema (Zod):**
```typescript
import { z } from 'zod';

export const bedrockInstructionsSchema = z.object({
  role_instructions: z.string()
    .min(1, 'Required')
    .max(1000, 'Max 1000 characters')
    .refine(
      (val) => !val.match(/(<script|javascript:|data:)/i),
      'Potentially unsafe content'
    ),

  formatting_preferences: z.object({
    emoji_usage: z.enum(['none', 'moderate', 'generous']),
    max_emojis_per_response: z.number().int().min(0).max(10),
    response_style: z.enum([
      'professional_concise',
      'warm_conversational',
      'structured_detailed'
    ]),
    detail_level: z.enum(['concise', 'balanced', 'comprehensive'])
  }),

  custom_constraints: z.array(
    z.string().max(500)
  ).max(10),

  fallback_message: z.string()
    .min(1, 'Required')
    .max(500, 'Max 500 characters')
});
```

### Validation

**Test Plan:**
- ✅ Unit tests for all editor components
- ✅ Validation tests (character limits, enums, injection patterns)
- ✅ Integration tests (edit → save → S3 → verify)
- ✅ E2E tests (Playwright - full user workflow)
- ✅ Accessibility tests (keyboard navigation, screen reader)

---

## ADR-005: 5-Minute Cache TTL (No Change)

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: Tech Lead, Performance Engineer

### Context

Lambda caches tenant configs for 5 minutes to reduce S3 reads. With the new `bedrock_instructions` feature, we need to decide if this cache TTL should change.

**Problem Statement:**
- Should we change the cache TTL for config changes to propagate faster?
- What are the trade-offs between freshness and performance?

### Decision

**Keep existing 5-minute cache TTL (no change)**.

**Reasoning:**
- Existing behavior is well-understood and stable
- 5 minutes is acceptable for prompt changes (non-urgent)
- Reducing TTL increases S3 read costs and latency
- Most reads served from cache (>95% hit rate)

**Documented behavior:**
> **⚠️ Config changes take up to 5 minutes to propagate**
> After saving changes in Config Builder, wait 5 minutes for the cache to expire. The next user message will use the updated prompt.

### Alternatives Considered

**Alternative 1: Real-Time Updates (No Cache)**
- **Pros**: Instant propagation, simplest mental model
- **Cons**: S3 read on every request (~100ms latency), higher costs, unnecessary load
- **Why rejected**: Performance degradation not justified for non-urgent updates

**Alternative 2: 1-Minute TTL**
- **Pros**: Faster propagation, still some caching benefit
- **Cons**: 5x more S3 reads, marginal improvement (1 min vs 5 min both acceptable)
- **Why rejected**: Cost increase not justified for minimal benefit

**Alternative 3: 10-Minute TTL**
- **Pros**: Fewer S3 reads, lower costs
- **Cons**: Slower propagation, longer wait after config changes
- **Why rejected**: 10 minutes feels too long for iterative prompt editing

**Alternative 4: Manual Cache Invalidation**
- **Pros**: Best of both worlds - long TTL + instant updates when needed
- **Cons**: Adds complexity (API endpoint, UI button, security), rare use case
- **Why rejected**: Can add later if needed, start simple

**Alternative 5: Event-Driven Cache Invalidation (S3 → Lambda)**
- **Pros**: Automatic instant invalidation on S3 config change
- **Cons**: Complex (S3 event → SNS → Lambda), race conditions, eventual consistency issues
- **Why rejected**: Over-engineered for current needs, adds operational complexity

### Consequences

#### Positive
- ✅ **No code changes**: Existing cache logic unchanged, proven stable
- ✅ **Predictable behavior**: 5-minute TTL is consistent with existing config changes
- ✅ **Performance**: >95% cache hit rate, minimal S3 load
- ✅ **Cost-effective**: Fewer S3 reads = lower AWS costs

#### Negative
- ⚠️ **Not instant**: Admins must wait up to 5 minutes to see prompt changes
- ⚠️ **User confusion**: If admin tests immediately after saving, sees old prompt
- ⚠️ **Urgent changes slow**: Cannot deploy urgent prompt fixes instantly (need to wait or redeploy Lambda)

#### Neutral
- ℹ️ 5 minutes is acceptable for most use cases (prompt editing is iterative, not urgent)
- ℹ️ Can add manual cache-bust later if urgency becomes common

### Mitigation: Clear Documentation

**Config Builder UI Message:**
```
┌────────────────────────────────────────────┐
│ ⏱️ Config changes take 5 minutes to apply │
│                                             │
│ After saving, your changes will be active  │
│ within 5 minutes. The cache will expire    │
│ and the next user message will use the     │
│ updated prompt.                             │
│                                             │
│ For urgent changes, contact support.       │
└────────────────────────────────────────────┘
```

**User Guide Documentation:**
```markdown
## How Long Do Changes Take to Apply?

After saving changes in the Config Builder:

1. **Immediate**: Changes saved to S3 (visible in Config Builder immediately)
2. **5 minutes**: Lambda cache expires
3. **Next message**: User's next message uses the updated prompt

**Why 5 minutes?**
Lambda caches tenant configs for performance. This reduces latency and S3 costs.

**Testing your changes:**
- Save changes in Config Builder
- Wait 5 minutes
- Send a test message to the chatbot
- Verify the response reflects your changes

**Urgent changes:**
If you need changes applied instantly (rare emergency), contact support for manual cache invalidation.
```

### Monitoring

**CloudWatch Metrics:**
- Track cache hit rate (should remain >95%)
- Track S3 read latency (should remain <100ms on cache miss)
- Alert if cache hit rate drops below 90% (indicates potential issue)

### Future Consideration

**If manual cache-bust becomes necessary:**

```javascript
// API endpoint: POST /api/cache/invalidate/{tenant_id}
function invalidateCache(tenantId) {
  const cacheKey = `${tenantId}_config`;
  delete CONFIG_CACHE[cacheKey];
  console.log(`🗑️ Cache invalidated for ${tenantId}`);
}
```

**Trigger from Config Builder UI:**
```typescript
// "Force Refresh" button (optional future enhancement)
async function forceCacheRefresh(tenantId: string) {
  await fetch(`/api/cache/invalidate/${tenantId}`, { method: 'POST' });
  alert('Cache invalidated. Changes will apply on next message.');
}
```

**Decision:** Don't build until proven necessary (YAGNI principle).

---

## ADR-006: Defense-in-Depth Validation

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: Security Reviewer, Tech Lead

### Context

`bedrock_instructions` config could contain malicious content (prompt injection attempts, excessively long text, invalid values). We need to decide where to validate.

**Problem Statement:**
- Should we validate in Config Builder UI, Lambda, or both?
- What are the security implications of each approach?

### Decision

**Implement validation in BOTH Config Builder UI and Lambda (defense-in-depth)**.

**Config Builder UI Validation** (User Experience):
- Real-time feedback as user types
- Character count indicators
- Zod schema validation before save
- Prevents submission of invalid configs

**Lambda Validation** (Security):
- Validates config on every read (defense against direct S3 manipulation)
- Graceful degradation if config invalid (use defaults)
- Logs validation errors for monitoring
- Prevents malicious configs from executing

### Alternatives Considered

**Alternative 1: Config Builder Only**
```typescript
// Validate before save
const validation = bedrockInstructionsSchema.safeParse(config);
if (!validation.success) {
  alert('Invalid config');
  return; // Prevent save
}
await saveToS3(config);
```

- **Pros**: Simpler (single validation point), good UX (immediate feedback)
- **Cons**: No defense against direct S3 edits (manual JSON changes bypass validation)
- **Why rejected**: Insecure - assumes all config changes go through UI

**Alternative 2: Lambda Only**
```javascript
// Validate on every config read
if (!validateBedrockInstructions(config.bedrock_instructions)) {
  console.error('Invalid config, using defaults');
  return DEFAULT_BEDROCK_INSTRUCTIONS;
}
```

- **Pros**: Security guaranteed (all configs validated), works for manual S3 edits
- **Cons**: No UI feedback, user only learns of errors after save + 5 min + test
- **Why rejected**: Poor UX - errors discovered too late

**Alternative 3: Pre-Commit Hooks (Git Validation)**
```javascript
// .git/hooks/pre-commit
const configs = getChangedConfigs();
configs.forEach(config => {
  if (!validate(config)) {
    console.error(`Invalid config: ${config.path}`);
    process.exit(1); // Block commit
  }
});
```

- **Pros**: Catches errors before S3 upload (if using git workflow)
- **Cons**: Doesn't apply to direct S3 edits, assumes git workflow, not real-time
- **Why rejected**: Assumes specific workflow that may not always apply

**Alternative 4: S3 Object Lambda (Validate on Read)**
```javascript
// S3 Object Lambda intercepts getObject calls
exports.handler = async (event) => {
  const config = JSON.parse(event.getObjectContext.inputS3Url);

  if (!validate(config)) {
    return { statusCode: 400, body: 'Invalid config' };
  }

  return config;
};
```

- **Pros**: Validation enforced at storage layer, catches all access paths
- **Cons**: Complex setup, adds latency, operational overhead, overkill
- **Why rejected**: Over-engineered for current threat model

### Decision: Defense-in-Depth (Both UI + Lambda)

**Layer 1: Config Builder UI (UX + First Line of Defense)**
```typescript
// Real-time validation as user types
const [errors, setErrors] = useState<z.ZodError | null>(null);

useEffect(() => {
  const validation = bedrockInstructionsSchema.safeParse(bedrockInstructions);
  if (!validation.success) {
    setErrors(validation.error);
  } else {
    setErrors(null);
  }
}, [bedrockInstructions]);

// Block save if invalid
async function handleSave() {
  const validation = bedrockInstructionsSchema.safeParse(bedrockInstructions);

  if (!validation.success) {
    alert('Please fix validation errors before saving');
    return;
  }

  await saveToS3(config);
}
```

**Layer 2: Lambda (Security + Defense Against Direct S3 Edits)**
```javascript
function validateBedrockInstructions(instructions) {
  if (!instructions) {
    console.warn('⚠️ No bedrock_instructions found, using defaults');
    return false;
  }

  // Check required fields
  if (!instructions.role_instructions ||
      !instructions.formatting_preferences ||
      !instructions.fallback_message) {
    console.error('❌ Invalid bedrock_instructions: missing required fields');
    return false;
  }

  // Check max lengths
  if (instructions.role_instructions.length > 1000) {
    console.error('❌ Invalid bedrock_instructions: role_instructions too long');
    return false;
  }

  if (instructions.fallback_message.length > 500) {
    console.error('❌ Invalid bedrock_instructions: fallback_message too long');
    return false;
  }

  // Check enums
  const validEmojiUsage = ['none', 'moderate', 'generous'];
  if (!validEmojiUsage.includes(instructions.formatting_preferences.emoji_usage)) {
    console.error('❌ Invalid bedrock_instructions: invalid emoji_usage');
    return false;
  }

  return true; // Valid
}

function getRoleInstructions(config) {
  if (!validateBedrockInstructions(config?.bedrock_instructions)) {
    console.warn('⚠️ Using default role instructions due to invalid config');
    return DEFAULT_BEDROCK_INSTRUCTIONS.role_instructions;
  }

  return config.bedrock_instructions.role_instructions;
}
```

### Consequences

#### Positive
- ✅ **Security**: Lambda validation prevents malicious configs from executing
- ✅ **UX**: Config Builder validation provides immediate feedback
- ✅ **Defense against bypass**: Direct S3 edits validated in Lambda
- ✅ **Graceful degradation**: Invalid configs don't break chatbots (use defaults)

#### Negative
- ⚠️ **Code duplication**: Validation logic exists in two places (UI + Lambda)
- ⚠️ **Maintenance**: Must keep validation rules in sync (Zod schema + Lambda checks)
- ⚠️ **Testing complexity**: Need tests for both layers

#### Neutral
- ℹ️ Most configs will be created via UI (validation errors rare in Lambda)
- ℹ️ Lambda validation is lightweight (minimal performance impact)

### Mitigation: Shared Validation Rules

**Option: Generate Lambda validation from Zod schema**

```typescript
// Generate validation function from Zod schema
import { generateZodValidationForLambda } from './codegen';

const lambdaValidation = generateZodValidationForLambda(bedrockInstructionsSchema);

// Outputs JavaScript validation function for Lambda
fs.writeFileSync('lambda/validation.js', lambdaValidation);
```

**Future consideration:** Could eliminate duplication, but adds build complexity.
**Decision:** Start with manual duplication (simpler), consider codegen if maintenance burden high.

### Validation

**Test Plan:**
- ✅ UI tests: Submit invalid configs, verify error messages shown
- ✅ Lambda tests: Pass invalid configs, verify defaults used
- ✅ Security tests: Attempt prompt injection via direct S3 edit, verify Lambda rejects
- ✅ Integration tests: End-to-end validation (UI → S3 → Lambda)

---

## ADR-007: Helper Function Refactoring Pattern

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: Tech Lead, Backend Engineer

### Context

The current `buildPrompt()` function (lines 162-413) is 250+ lines of inline string concatenation. We need to refactor for the locked/unlocked architecture.

**Problem Statement:**
- How should we structure the refactored `buildPrompt()` function?
- How do we make locked sections explicit and maintainable?

### Decision

**Extract each locked section into a separate helper function** following this pattern:

```javascript
// Helper functions for LOCKED sections
function getLockedAntiHallucinationRules() { ... }
function getLockedUrlHandling() { ... }
function getLockedCapabilityBoundaries() { ... }
function getLockedLoopPrevention() { ... }

// Helper functions for UNLOCKED sections (read from config)
function getRoleInstructions(config) { ... }
function buildFormattingRules(config) { ... }
function getCustomConstraints(config) { ... }
function getFallbackMessage(config) { ... }

// Main orchestration function
function buildPrompt(userInput, kbContext, tone, conversationHistory, config) {
  const parts = [];

  // Layer locked + unlocked sections
  parts.push(tone || DEFAULT_TONE);
  parts.push(getRoleInstructions(config)); // UNLOCKED

  if (conversationHistory?.length > 0) {
    parts.push('\nPREVIOUS CONVERSATION:');
    // ... conversation history ...
    parts.push(getLockedCapabilityBoundaries()); // LOCKED
    parts.push(getLockedLoopPrevention()); // LOCKED
  }

  if (kbContext) {
    parts.push(getLockedAntiHallucinationRules()); // LOCKED
    parts.push(getLockedUrlHandling()); // LOCKED
    parts.push(`\nKNOWLEDGE BASE INFORMATION:\n${kbContext}`);
  } else {
    parts.push(getFallbackMessage(config)); // UNLOCKED
  }

  parts.push(getCustomConstraints(config)); // UNLOCKED
  parts.push(buildFormattingRules(config)); // UNLOCKED

  parts.push(`\nCURRENT USER QUESTION: ${userInput}`);

  return parts.join('\n');
}
```

### Alternatives Considered

**Alternative 1: Keep Inline (Status Quo)**
```javascript
function buildPrompt(...) {
  const parts = [];
  parts.push('CRITICAL CONSTRAINT - PREVENT HALLUCINATIONS: ...');
  parts.push('PRESERVE ALL MARKDOWN FORMATTING: ...');
  // ... 200+ more lines ...
  return parts.join('\n');
}
```

- **Pros**: Simpler (no functions), everything in one place
- **Cons**: Unmaintainable (250+ line function), unclear what's locked vs unlocked
- **Why rejected**: Cannot differentiate locked from unlocked sections

**Alternative 2: Template Literals**
```javascript
function buildPrompt(...) {
  return `
    ${tone}
    ${getRoleInstructions(config)}
    ${getLockedAntiHallucinationRules()}
    ...
  `;
}
```

- **Pros**: Cleaner syntax, easier to read
- **Cons**: Whitespace issues, harder to debug, indentation problems
- **Why rejected**: String concatenation is more predictable

**Alternative 3: Class-Based Architecture**
```javascript
class PromptBuilder {
  constructor(config) {
    this.config = config;
  }

  buildRoleInstructions() { ... }
  buildFormattingRules() { ... }
  buildAntiHallucinationRules() { ... }

  build() {
    return [
      this.buildRoleInstructions(),
      this.buildAntiHallucinationRules(),
      ...
    ].join('\n');
  }
}
```

- **Pros**: Object-oriented, testable, extensible
- **Cons**: Over-engineered for current needs, more complex
- **Why rejected**: Functional approach is simpler and sufficient

**Alternative 4: Configuration-Driven (JSON Schema)**
```javascript
const PROMPT_STRUCTURE = [
  { type: 'unlocked', key: 'role_instructions' },
  { type: 'locked', function: getAntiHallucinationRules },
  ...
];

function buildPrompt(...) {
  return PROMPT_STRUCTURE.map(section => {
    return section.type === 'locked'
      ? section.function()
      : getFromConfig(config, section.key);
  }).join('\n');
}
```

- **Pros**: Declarative, easy to reorder sections
- **Cons**: Harder to understand, indirection, over-abstraction
- **Why rejected**: Explicitness is better than cleverness here

### Consequences

#### Positive
- ✅ **Clear intent**: Function names document purpose (`getLockedAntiHallucinationRules()`)
- ✅ **Testable**: Each helper function can be unit tested independently
- ✅ **Maintainable**: Locked sections easy to update (change one function)
- ✅ **Auditable**: Locked functions are clearly marked in code
- ✅ **Reusable**: Helper functions could be used elsewhere if needed

#### Negative
- ⚠️ **More files/functions**: 8-10 helper functions instead of 1 monolithic function
- ⚠️ **Overhead**: Function calls add minimal overhead (~1ms total)

#### Neutral
- ℹ️ Helper functions are pure (no side effects, deterministic)
- ℹ️ Naming convention: `getLocked*` vs `get*` makes distinction clear

### Naming Conventions

**Locked sections:**
- Prefix with `getLocked` to make immutability explicit
- Examples: `getLockedAntiHallucinationRules()`, `getLockedUrlHandling()`

**Unlocked sections:**
- Prefix with `get` or `build` depending on complexity
- Accept `config` parameter
- Return defaults if config missing
- Examples: `getRoleInstructions(config)`, `buildFormattingRules(config)`

### Testing Strategy

**Unit tests for each helper:**
```javascript
describe('Locked section helpers', () => {
  test('getLockedAntiHallucinationRules() returns expected rules', () => {
    const rules = getLockedAntiHallucinationRules();
    expect(rules).toContain('PREVENT HALLUCINATIONS');
    expect(rules).toContain('MUST ONLY use information explicitly stated');
  });

  test('getLockedUrlHandling() returns URL preservation rules', () => {
    const rules = getLockedUrlHandling();
    expect(rules).toContain('PRESERVE ALL MARKDOWN FORMATTING');
  });
});

describe('Unlocked section helpers', () => {
  test('getRoleInstructions() returns config value when present', () => {
    const config = {
      bedrock_instructions: { role_instructions: "Custom role" }
    };
    expect(getRoleInstructions(config)).toBe("Custom role");
  });

  test('getRoleInstructions() returns default when missing', () => {
    expect(getRoleInstructions({})).toBe(DEFAULT_BEDROCK_INSTRUCTIONS.role_instructions);
  });

  test('buildFormattingRules() generates rules based on preferences', () => {
    const config = {
      bedrock_instructions: {
        formatting_preferences: {
          emoji_usage: 'generous',
          response_style: 'warm_conversational'
        }
      }
    };
    const rules = buildFormattingRules(config);
    expect(rules).toContain('up to 5 emojis'); // generous
    expect(rules).toContain('friendly, conversational'); // warm_conversational
  });
});
```

### Validation

**Integration test:**
```javascript
test('buildPrompt() includes all locked sections regardless of config', () => {
  const configs = [
    {}, // No bedrock_instructions
    { bedrock_instructions: { /* custom */ } }, // Custom config
    { bedrock_instructions: null } // Null config
  ];

  configs.forEach(config => {
    const prompt = buildPrompt('test', 'KB context', null, [], config);

    // All locked sections must be present
    expect(prompt).toContain('PREVENT HALLUCINATIONS');
    expect(prompt).toContain('PRESERVE ALL MARKDOWN');
    expect(prompt).toContain('CAPABILITY BOUNDARIES');
    expect(prompt).toContain('AVOID REPETITIVE LOOPS');
  });
});
```

---

## ADR-008: Version Tracking via PROMPT_VERSION Constant

**Status**: Approved
**Date**: 2025-11-17
**Decision Makers**: Tech Lead, DevOps

### Context

We need to track which version of the prompt logic generated each response. This is critical for:
- Debugging issues ("which prompt version was used?")
- Analyzing behavior changes after updates
- Correlating responses to code versions

**Problem Statement:**
- How do we track prompt versions over time?
- How do we correlate logged responses to specific code versions?

### Decision

**Add `PROMPT_VERSION` constant to Lambda** and log it with every Bedrock request.

**Implementation:**
```javascript
// At top of index.js
const PROMPT_VERSION = '2.0.0'; // Semantic versioning

function buildPrompt(...) {
  console.log(`🎯 Building prompt - PROMPT_VERSION: ${PROMPT_VERSION}`);
  // ... build prompt ...
  return finalPrompt;
}

// In Q&A logging
console.log(JSON.stringify({
  type: 'QA_COMPLETE',
  prompt_version: PROMPT_VERSION,
  tenant_id: config.tenant_id,
  question: userInput,
  response_length: responseBuffer.length,
  kb_used: kbContext ? true : false,
  custom_instructions: config?.bedrock_instructions ? true : false,
  timestamp: new Date().toISOString()
}));
```

**Versioning Scheme (Semantic Versioning):**
- **Major (2.x.x)**: Breaking changes to prompt structure
- **Minor (x.1.x)**: New features (e.g., new locked section added)
- **Patch (x.x.1)**: Bug fixes (e.g., typo in anti-hallucination rules)

**Examples:**
- `1.0.0`: Original hardcoded prompt (before this project)
- `2.0.0`: Refactored with locked/unlocked architecture
- `2.1.0`: Add new locked section (e.g., PII handling rules)
- `2.0.1`: Fix typo in capability boundaries

### Alternatives Considered

**Alternative 1: Git Commit SHA**
```javascript
const PROMPT_VERSION = process.env.GIT_COMMIT_SHA; // e.g., "abc123f"
```

- **Pros**: Exact code version, traceable to git commit
- **Cons**: Not human-readable, requires CI/CD to inject, hard to compare versions
- **Why rejected**: Semantic versioning is clearer and more meaningful

**Alternative 2: Timestamp-Based**
```javascript
const PROMPT_VERSION = '2025-11-17T14:30:00Z'; // Deployment timestamp
```

- **Pros**: Easy to generate, chronological ordering
- **Cons**: Doesn't convey significance of changes (major vs minor), not semantic
- **Why rejected**: Doesn't communicate impact of changes

**Alternative 3: No Versioning (Just Log Changes)**
```javascript
console.log('Using refactored buildPrompt with locked/unlocked sections');
```

- **Pros**: Simplest, no version management
- **Cons**: Hard to query ("find all responses from version X"), no clear version identity
- **Why rejected**: Versioning enables querying and analysis

**Alternative 4: Config Schema Version Only**
```javascript
// Only version the config schema, not Lambda code
config.bedrock_instructions._version; // "1.0"
```

- **Pros**: Tracks config schema evolution
- **Cons**: Doesn't track Lambda code changes (locked sections), incomplete picture
- **Why rejected**: Need to track both config schema AND Lambda code versions

### Decision: Semantic Version Constant + Config Schema Version

**Track both:**
1. **PROMPT_VERSION** (Lambda code): `2.0.0` (in JavaScript constant)
2. **bedrock_instructions._version** (Config schema): `1.0` (in S3 config)

**Logged together:**
```json
{
  "type": "QA_COMPLETE",
  "prompt_version_lambda": "2.0.0",
  "prompt_version_config": "1.0",
  "tenant_id": "AUS123957",
  ...
}
```

**Enables queries like:**
- "Find all responses using Lambda v2.0.0"
- "Find all responses using config schema v1.0"
- "Find all responses using Lambda v2.0.0 + config schema v1.1" (version compatibility)

### Consequences

#### Positive
- ✅ **Debuggability**: Can correlate issues to specific code versions
- ✅ **Queryable**: CloudWatch Insights can filter by version
- ✅ **Human-readable**: Semantic versioning is clear and meaningful
- ✅ **Auditable**: Know exactly what prompt logic was used for each response

#### Negative
- ⚠️ **Manual maintenance**: Must remember to bump version with each change
- ⚠️ **Potential for errors**: Forgetting to update version leads to incorrect tracking

#### Neutral
- ℹ️ Version bumps should be part of code review checklist
- ℹ️ Can add pre-commit hook to remind about version bump

### Version Bump Checklist

**When to bump PROMPT_VERSION:**

- ✅ **Major (X.0.0)**:
  - Refactoring buildPrompt() structure
  - Changing locked section behavior
  - Breaking changes to prompt format

- ✅ **Minor (x.X.0)**:
  - Adding new locked sections
  - Adding new unlocked config fields
  - New features that change prompt output

- ✅ **Patch (x.x.X)**:
  - Typo fixes in locked sections
  - Clarification improvements
  - Bug fixes that don't change behavior significantly

**When to bump bedrock_instructions._version:**

- ✅ **New version (1.0 → 1.1)**:
  - Adding new fields to schema
  - Changing validation rules
  - New enums or constraints

**Pre-Deployment Checklist:**
```markdown
- [ ] PROMPT_VERSION updated in index.js
- [ ] CHANGELOG.md entry added (what changed)
- [ ] Git tag created (e.g., `git tag prompt-v2.0.0`)
- [ ] CloudWatch dashboard updated to show new version
```

### CloudWatch Queries

**Track version distribution:**
```sql
fields @timestamp, @message
| filter @message like /PROMPT_VERSION/
| parse @message /PROMPT_VERSION: (?<version>\S+)/
| stats count(*) by version
| sort count desc
```

**Find responses from specific version:**
```sql
fields @timestamp, tenant_id, question, response
| filter prompt_version = "2.0.0"
| sort @timestamp desc
| limit 100
```

**Detect version mismatches (Lambda vs config):**
```sql
fields @timestamp, tenant_id, prompt_version_lambda, prompt_version_config
| filter prompt_version_lambda != "2.0.0" or prompt_version_config != "1.0"
```

### Validation

**Test Plan:**
- ✅ Unit test: Verify PROMPT_VERSION constant exists and is semver-compliant
- ✅ Integration test: Verify PROMPT_VERSION logged with every request
- ✅ CloudWatch test: Verify version queries return expected results

---

## Summary Table

| ADR | Decision | Rationale | Status |
|-----|----------|-----------|--------|
| 001 | Locked vs Unlocked Architecture | Enable customization while protecting safety rules | Approved |
| 002 | S3 as Configuration Storage | Leverage existing infrastructure, proven reliability | Approved |
| 003 | No Backward Compatibility | Clean break, simpler code, one-time migration | Approved |
| 004 | Config Builder UI for Editing | Integrated UX, validation, preview | Approved |
| 005 | 5-Minute Cache TTL (No Change) | Acceptable freshness, proven performance | Approved |
| 006 | Defense-in-Depth Validation | Security (Lambda) + UX (Config Builder) | Approved |
| 007 | Helper Function Refactoring | Testable, maintainable, clear intent | Approved |
| 008 | PROMPT_VERSION Tracking | Debuggability, auditability, queryability | Approved |

---

**Document Status**: Draft - Pending tech-lead-reviewer approval
**Next Steps**: Security review, then Phase 1 implementation planning
**Related**: See `TDD_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md` for implementation details
