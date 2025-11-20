# Sprint Plan: Multi-Tenant Bedrock Prompt Customization Implementation

**Version**: 1.1
**Date**: 2025-11-17
**Status**: Approved (Revised after Feasibility Review)
**Total Duration**: 7 weeks (35 business days)
**Team**: Solopreneur + Claude AI Agents (SOP-based)

**Revision Notes**:
- Simplified Phase 2 migration (only 1 customer: Austin Angels)
- Added LAMBDA-011.5: Production baseline validation (2h)
- Added LAMBDA-014: Server-side preview endpoint (3h) - CRITICAL per user request
- Added LAMBDA-015: Validation parity tests (2h)
- Updated UI-008: Server-side preview instead of client-side (7h, was 5h)
- Increased estimates for underestimated tasks (+12h total)
- Net change: +2h (was 149h, now 151h)
- Week 3 reduced from 5 days to 0.5 days (15h → 2h)

---

## Executive Summary

This sprint plan breaks down the Multi-Tenant Bedrock Prompt Customization implementation into actionable tasks across 4 phases (7 weeks). Each task includes agent assignment per SOP, dependencies, effort estimates, and testable acceptance criteria. The plan coordinates specialized agents (Backend-Engineer, Frontend-Engineer, test-engineer, etc.) with explicit handoff points and validation gates.

**Timeline**: 7 weeks total
- **Phase 1**: Lambda Refactoring (Weeks 1-2) - 10 days
- **Phase 2**: Manual Config Update (Week 3) - 0.5 days (was 5 days)
- **Phase 3**: Config Builder UI (Weeks 4-6) - 15 days
- **Phase 4**: Production Validation (Week 7) - 5 days

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (UI can partially overlap with migration)

**Major Changes from v1.0**:
- Phase 2 simplified: Manual config update instead of migration script (only 1 customer)
- Server-side preview endpoint added (CRITICAL per user feedback)
- Production baseline validation added to prevent regressions

---

## Table of Contents

1. [Task Breakdown by Phase](#task-breakdown-by-phase)
   - [Phase 1: Lambda Refactoring](#phase-1-lambda-refactoring-weeks-1-2)
   - [Phase 2: Tenant Migration](#phase-2-tenant-migration-week-3)
   - [Phase 3: Config Builder UI](#phase-3-config-builder-ui-weeks-4-6)
   - [Phase 4: Production Validation](#phase-4-production-validation-week-7)
2. [Sprint Calendar (Week-by-Week)](#sprint-calendar)
3. [Resource Allocation](#resource-allocation)
4. [Risk Identification](#risk-identification)
5. [Validation Checkpoints](#validation-checkpoints)
6. [Communication Plan](#communication-plan)

---

## Task Breakdown by Phase

### Phase 1: Lambda Refactoring (Weeks 1-2)

**Goal**: Refactor Lambda to support locked/unlocked architecture without breaking existing behavior

#### LAMBDA-001: Extract Locked Helper Functions
**Description**: Refactor `buildPrompt()` to extract anti-hallucination rules, URL handling, capability boundaries, and loop prevention into separate helper functions.

- **Agent**: Backend-Engineer
- **Dependencies**: None (can start immediately)
- **Effort**: 4 hours
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js`

**Acceptance Criteria**:
1. `getLockedAntiHallucinationRules()` function exists and returns anti-hallucination rules (lines 302-316)
2. `getLockedUrlHandling()` function exists and returns URL preservation rules (lines 321-323, 347-349)
3. `getLockedCapabilityBoundaries()` function exists and returns capability boundaries (lines 211-243)
4. `getLockedLoopPrevention()` function exists and returns loop prevention logic (lines 247-295)
5. All functions are pure (no side effects, deterministic)
6. Functions are marked with JSDoc comments indicating they are LOCKED (immutable)

**Deliverables**:
- Refactored `index.js` with 4 locked helper functions
- JSDoc comments documenting immutability

---

#### LAMBDA-002: Create Unlocked Section Helper Functions
**Description**: Create helper functions for unlocked sections that read from `config.bedrock_instructions` with fallback to defaults.

- **Agent**: Backend-Engineer
- **Dependencies**: None (can run parallel with LAMBDA-001)
- **Effort**: 4 hours
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js`

**Acceptance Criteria**:
1. `getRoleInstructions(config)` function exists and returns `config.bedrock_instructions.role_instructions` or default
2. `buildFormattingRules(config)` function exists and generates formatting guidance from `config.bedrock_instructions.formatting_preferences` or defaults
3. `getCustomConstraints(config)` function exists and returns array of custom constraints or empty array
4. `getFallbackMessage(config)` function exists and returns fallback message or default
5. Each function handles missing/null config gracefully (returns defaults)
6. JSDoc comments document each function's purpose and return type

**Deliverables**:
- Refactored `index.js` with 4 unlocked helper functions
- Default fallback logic for each function

---

#### LAMBDA-003: Add DEFAULT_BEDROCK_INSTRUCTIONS Constant
**Description**: Create `DEFAULT_BEDROCK_INSTRUCTIONS` constant with default values for all unlocked sections.

- **Agent**: Backend-Engineer
- **Dependencies**: LAMBDA-002 (needs to know structure)
- **Effort**: 2 hours
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js`

**Acceptance Criteria**:
1. `DEFAULT_BEDROCK_INSTRUCTIONS` constant exists at module scope
2. Contains `role_instructions` field with default text
3. Contains `formatting_preferences` object with default values:
   - `emoji_usage`: "moderate"
   - `max_emojis_per_response`: 3
   - `response_style`: "professional_concise"
   - `detail_level`: "balanced"
4. Contains `custom_constraints` array (empty by default)
5. Contains `fallback_message` field with default text
6. All fields match schema defined in TDD

**Deliverables**:
- `DEFAULT_BEDROCK_INSTRUCTIONS` constant in `index.js`

---

#### LAMBDA-004: Add PROMPT_VERSION Constant and Logging
**Description**: Add `PROMPT_VERSION` constant and log it with every prompt assembly.

- **Agent**: Backend-Engineer
- **Dependencies**: None (can run parallel)
- **Effort**: 1 hour
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js`

**Acceptance Criteria**:
1. `PROMPT_VERSION` constant exists at module scope with value "2.0.0"
2. `buildPrompt()` logs `PROMPT_VERSION` at start: "🎯 Building prompt - PROMPT_VERSION: 2.0.0"
3. `buildPrompt()` logs whether `bedrock_instructions` is present: "📋 Bedrock instructions present: YES/NO"
4. Q&A complete logs include `prompt_version` field
5. Logs are structured JSON for CloudWatch Insights queries

**Deliverables**:
- `PROMPT_VERSION` constant in `index.js`
- Logging statements in `buildPrompt()` function

---

#### LAMBDA-005: Refactor buildPrompt() to Orchestrate Helpers
**Description**: Refactor main `buildPrompt()` function to orchestrate helper functions instead of inline string concatenation.

- **Agent**: Backend-Engineer
- **Dependencies**: LAMBDA-001, LAMBDA-002, LAMBDA-003, LAMBDA-004
- **Effort**: 6 hours (increased from 4h per feasibility review)
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js`

**Acceptance Criteria**:
1. `buildPrompt()` function calls helper functions instead of inline concatenation
2. Locked sections called unconditionally (always included)
3. Unlocked sections called with `config` parameter
4. Function preserves same prompt structure as original (layers in same order)
5. Function is <100 lines (down from 250+ lines)
6. Final prompt assembly uses `parts.join('\n')` pattern
7. Logs prompt length and version

**Deliverables**:
- Refactored `buildPrompt()` function in `index.js`
- Maintains backward compatibility with existing behavior

---

#### LAMBDA-006: Add Validation Function
**Description**: Create `validateBedrockInstructions()` function to validate config at runtime (defense-in-depth).

- **Agent**: Backend-Engineer
- **Dependencies**: LAMBDA-003 (needs DEFAULT_BEDROCK_INSTRUCTIONS structure)
- **Effort**: 3 hours
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js`

**Acceptance Criteria**:
1. `validateBedrockInstructions(instructions)` function exists
2. Validates required fields present: `role_instructions`, `formatting_preferences`, `fallback_message`
3. Validates `role_instructions` length ≤ 1000 characters
4. Validates `fallback_message` length ≤ 500 characters
5. Validates `emoji_usage` is one of ["none", "moderate", "generous"]
6. Validates `response_style` is valid enum value
7. Validates `detail_level` is valid enum value
8. Returns `true` if valid, `false` if invalid
9. Logs specific validation errors with tenant_id

**Deliverables**:
- `validateBedrockInstructions()` function in `index.js`
- Error logging for validation failures

---

#### LAMBDA-007: Unit Tests for Locked Section Helpers
**Description**: Write unit tests for all locked section helper functions.

- **Agent**: test-engineer
- **Dependencies**: LAMBDA-001 (locked helpers must exist)
- **Effort**: 3 hours
- **Files Created**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/__tests__/lockedHelpers.test.js`

**Acceptance Criteria**:
1. Test `getLockedAntiHallucinationRules()` returns expected rules
2. Test `getLockedUrlHandling()` returns URL preservation rules
3. Test `getLockedCapabilityBoundaries()` returns capability boundaries
4. Test `getLockedLoopPrevention()` returns loop prevention logic
5. All tests pass
6. Tests verify rules contain critical keywords (e.g., "PREVENT HALLUCINATIONS", "PRESERVE ALL MARKDOWN")

**Deliverables**:
- Unit test file for locked helpers
- 4+ test cases
- All tests passing

---

#### LAMBDA-008: Unit Tests for Unlocked Section Helpers
**Description**: Write unit tests for all unlocked section helper functions.

- **Agent**: test-engineer
- **Dependencies**: LAMBDA-002 (unlocked helpers must exist)
- **Effort**: 4 hours
- **Files Created**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/__tests__/unlockedHelpers.test.js`

**Acceptance Criteria**:
1. Test `getRoleInstructions(config)` returns config value when present
2. Test `getRoleInstructions({})` returns default when missing
3. Test `buildFormattingRules(config)` generates correct guidance for each emoji_usage option
4. Test `buildFormattingRules(config)` generates correct guidance for each response_style option
5. Test `getCustomConstraints(config)` returns constraints array or empty array
6. Test `getFallbackMessage(config)` returns config value or default
7. All tests pass
8. Edge cases covered (null config, empty strings, malformed objects)

**Deliverables**:
- Unit test file for unlocked helpers
- 10+ test cases
- All tests passing

---

#### LAMBDA-009: Integration Tests for buildPrompt()
**Description**: Write integration tests for refactored `buildPrompt()` function.

- **Agent**: test-engineer
- **Dependencies**: LAMBDA-005 (refactored buildPrompt must exist)
- **Effort**: 7 hours (increased from 5h per feasibility review)
- **Files Created**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/__tests__/buildPrompt.test.js`

**Acceptance Criteria**:
1. Test `buildPrompt()` with config containing `bedrock_instructions` (uses custom values)
2. Test `buildPrompt()` with config missing `bedrock_instructions` (uses defaults)
3. Test `buildPrompt()` with null config (uses defaults)
4. Test `buildPrompt()` includes all locked sections regardless of config
5. Test `buildPrompt()` logs PROMPT_VERSION
6. Test `buildPrompt()` logs bedrock_instructions presence
7. Test `buildPrompt()` with conversation history (locked sections present)
8. Test `buildPrompt()` with KB context (anti-hallucination rules present)
9. Test `buildPrompt()` without KB context (fallback message present)
10. All tests pass
11. Coverage >80% for buildPrompt function

**Deliverables**:
- Integration test file for buildPrompt
- 9+ test cases
- All tests passing
- Coverage report showing >80%

---

#### LAMBDA-010: Deploy to Staging Lambda
**Description**: Deploy refactored Lambda code to staging environment for testing.

- **Agent**: deployment-specialist
- **Dependencies**: LAMBDA-001 through LAMBDA-009 (all code + tests complete)
- **Effort**: 2 hours
- **Files Deployed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js` (refactored)

**Acceptance Criteria**:
1. Code packaged into deployment.zip
2. Deployed to `Bedrock_Streaming_Handler_Staging` Lambda function
3. Lambda version tagged as "v2.0.0-staging"
4. Deployment logs show successful update
5. Lambda environment variables unchanged
6. CloudWatch logs show Lambda responding to test requests
7. Test request with existing tenant config (no bedrock_instructions) works correctly
8. PROMPT_VERSION logged as "2.0.0" in CloudWatch

**Deliverables**:
- Deployed Lambda in staging
- CloudWatch logs showing successful requests
- Deployment documentation updated

---

#### LAMBDA-011: Validate Staging Lambda with Existing Configs
**Description**: Test staging Lambda with real tenant configs to ensure backward compatibility.

- **Agent**: test-engineer
- **Dependencies**: LAMBDA-010 (staging Lambda deployed)
- **Effort**: 3 hours
- **Test Configs**:
  - TEST001 (existing config without bedrock_instructions)
  - TEST002 (existing config without bedrock_instructions)

**Acceptance Criteria**:
1. TEST001 chatbot responds to test questions successfully
2. TEST002 chatbot responds to test questions successfully
3. Responses match baseline behavior (same information, slight wording variations OK)
4. CloudWatch logs show "Bedrock instructions present: NO" (using defaults)
5. CloudWatch logs show PROMPT_VERSION: 2.0.0
6. No Lambda errors in CloudWatch
7. Response latency within 5% of baseline

**Deliverables**:
- Test report comparing staging vs baseline responses
- CloudWatch logs confirming expected behavior
- Validation sign-off for production deployment

---

#### LAMBDA-011.5: Production Baseline for Austin Angels
**Description**: Test Austin Angels (AUS123957) in staging and record baseline Q&A pairs before production deployment.

- **Agent**: test-engineer
- **Dependencies**: LAMBDA-011 (staging validation complete)
- **Effort**: 2 hours
- **Test Tenant**: Austin Angels (AUS123957)

**Acceptance Criteria**:
1. Test Austin Angels chatbot in staging with 5 questions
2. Record baseline Q&A pairs:
   - "What programs do you offer?"
   - "How can I apply?"
   - "Do programs cost money?"
   - "Who is eligible?"
   - "Where are you located?"
3. Save responses as baseline for comparison
4. Verify responses are semantically appropriate
5. Compare semantic similarity after production deployment
6. Must be 80%+ similar to approve production deployment

**Deliverables**:
- Baseline Q&A document for Austin Angels
- Semantic similarity comparison report
- Approval to proceed to production deployment

**Rationale**: Only 1 deployed customer (Austin Angels), so validate baseline before production deployment to prevent regressions.

---

#### LAMBDA-012: Deploy to Production Lambda
**Description**: Deploy refactored Lambda code to production environment.

- **Agent**: deployment-specialist
- **Dependencies**: LAMBDA-011.5 (Austin Angels baseline validated)
- **Effort**: 2 hours
- **Deployment Window**: Saturday 2am ET (low traffic)
- **Files Deployed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js` (refactored)

**Acceptance Criteria**:
1. Code packaged into deployment.zip
2. Previous Lambda code backed up (deployment-backup-v1.zip)
3. Deployed to production Lambda function
4. Lambda version tagged as "v2.0.0-production"
5. Canary deployment: 10% traffic to new version for 15 minutes
6. Monitor CloudWatch error rate (must be ≤ baseline)
7. If errors spike, automatic rollback to v1
8. After 15 min validation, route 100% traffic to new version
9. CloudWatch logs show PROMPT_VERSION: 2.0.0 for all requests

**Deliverables**:
- Deployed Lambda in production
- CloudWatch logs showing successful requests
- Rollback plan executed (if needed)
- Deployment post-mortem document

---

#### LAMBDA-013: Monitor Production Lambda (48 hours)
**Description**: Monitor production Lambda for 48 hours post-deployment to catch any issues.

- **Agent**: Backend-Engineer
- **Dependencies**: LAMBDA-012 (production deployment complete)
- **Effort**: 2 hours (monitoring automation + spot checks)
- **Monitoring Period**: 48 hours continuous

**Acceptance Criteria**:
1. CloudWatch dashboard created with key metrics:
   - Error rate (must be ≤ baseline)
   - Execution duration (must be within 5% of baseline)
   - PROMPT_VERSION distribution (100% should be "2.0.0")
   - bedrock_instructions presence (100% should be "NO" until migration)
2. CloudWatch alarms configured:
   - Error rate exceeds baseline by 10% → alert
   - Execution duration exceeds baseline by 10% → alert
3. Spot check 5 tenant chatbots manually (responses look correct)
4. No client complaints about chatbot behavior
5. Monitoring report generated after 48 hours

**Deliverables**:
- CloudWatch dashboard for production Lambda
- CloudWatch alarms configured
- 48-hour monitoring report
- Sign-off to proceed to Phase 2

---

#### LAMBDA-014: Preview Prompt Endpoint
**Description**: Add `/preview-prompt` Lambda endpoint for server-side prompt preview.

- **Agent**: Backend-Engineer
- **Dependencies**: LAMBDA-005 (buildPrompt helpers must exist)
- **Effort**: 3 hours
- **Files Changed**:
  - `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js` (or new endpoint)

**Acceptance Criteria**:
1. New Lambda endpoint: `POST /preview-prompt`
2. Input: `bedrock_instructions` JSON object
3. Calls `buildPrompt()` helper functions with provided config
4. Returns assembled prompt string
5. Uses exact same logic as production prompt assembly
6. Validates input with `validateBedrockInstructions()` before processing
7. Returns 400 error if validation fails
8. Returns 200 with prompt string if valid
9. Includes CORS headers for Config Builder access
10. Logs preview requests separately from actual chat requests

**Deliverables**:
- `/preview-prompt` endpoint in Lambda
- API Gateway route configured
- Unit tests for endpoint
- Integration tests with Config Builder UI

**Rationale**: CRITICAL per user request - "I would like to build in some sort of preview... If not, I can envision many versions of the prompt that would create new versions of the config file." Server-side preview ensures 100% accuracy.

---

#### LAMBDA-015: Validation Parity Tests
**Description**: Create tests to ensure Zod schema validation (UI) and Lambda validation have parity.

- **Agent**: test-engineer
- **Dependencies**: LAMBDA-006 (Lambda validation exists), UI-001 (Zod schema exists)
- **Effort**: 2 hours
- **Files Created**:
  - `/picasso-config-builder/tests/validation-parity.test.ts`

**Acceptance Criteria**:
1. Test suite compares Zod validation vs Lambda validation
2. Test invalid inputs:
   - `role_instructions` exceeding 1000 chars → Both reject
   - `emoji_usage` with invalid enum → Both reject
   - Missing required fields → Both reject
   - Prompt injection patterns → Both reject
3. Test valid inputs:
   - All valid field combinations → Both accept
   - Boundary values (999 chars) → Both accept
   - Empty custom_constraints → Both accept
4. Test edge cases:
   - Null vs undefined vs empty string
   - Special characters in strings
   - Unicode characters
5. Document any intentional differences
6. All tests passing
7. Coverage of all validation rules

**Deliverables**:
- Validation parity test suite
- Documentation of validation rule differences (if any)
- Sign-off that UI and Lambda validation are aligned

**Rationale**: Prevent validation logic drift between UI (TypeScript/Zod) and Lambda (JavaScript). Ensures consistent validation experience.

---

### Phase 2: Manual Config Update (Week 3)

**Goal**: Update Austin Angels config to new `bedrock_instructions` schema without breaking existing behavior

**Context Change from v1.0**: Only 1 deployed customer (Austin Angels in testing phase, not live). Migration script is overkill. Manual config update is simpler and faster.

#### MIG-001-SIMPLE: Manual Config Update for Austin Angels
**Description**: Manually update Austin Angels (AUS123957) config to add `bedrock_instructions` object.

- **Agent**: Backend-Engineer
- **Dependencies**: LAMBDA-013 (Phase 1 complete and validated)
- **Effort**: 1 hour
- **Config File**: `s3://myrecruiter-picasso/tenants/AUS123957/config.json`

**Acceptance Criteria**:
1. Download AUS123957-config.json from S3
2. Add `bedrock_instructions` object with following structure:
   ```json
   {
     "_version": "1.0",
     "_updated": "[current timestamp]",
     "role_instructions": "[migrated from tone_prompt]",
     "formatting_preferences": {
       "emoji_usage": "generous",
       "max_emojis_per_response": 5,
       "response_style": "warm_conversational",
       "detail_level": "comprehensive"
     },
     "custom_constraints": [
       "Always mention that all programs are free for foster families"
     ],
     "fallback_message": "I don't have specific information about that topic, but I'm here to help connect foster families with resources. What else can I help you with?"
   }
   ```
3. Map existing `tone_prompt` value to `bedrock_instructions.role_instructions`
4. Upload updated config to S3 (overwrites existing)
5. S3 versioning creates automatic backup
6. Config validates against schema
7. Document changes in change log

**Deliverables**:
- Updated AUS123957-config.json in S3
- Change log documenting migration
- S3 version ID for rollback if needed

---

#### MIG-002-SIMPLE: Validate Austin Angels Chatbot
**Description**: Test Austin Angels chatbot after config update to ensure no regressions.

- **Agent**: test-engineer
- **Dependencies**: MIG-001-SIMPLE (config updated in S3)
- **Effort**: 1 hour
- **Wait Period**: 6 minutes (Lambda cache TTL is 5 minutes)

**Acceptance Criteria**:
1. Wait 6 minutes after config upload for cache expiry
2. Test Austin Angels chatbot with 5 questions:
   - "What programs do you offer?"
   - "How can I apply?"
   - "Do programs cost money?"
   - "Who is eligible?"
   - "Where are you located?"
3. Compare responses to baseline from LAMBDA-011.5
4. Responses must be semantically similar (80%+ similarity)
5. CloudWatch logs show:
   - "Bedrock instructions present: YES"
   - PROMPT_VERSION: 2.0.0
   - `emoji_usage: generous` being used
6. No Lambda errors in CloudWatch
7. Response tone is warm and conversational
8. Responses mention programs are free for foster families (when relevant)

**Deliverables**:
- Test report comparing post-migration vs baseline responses
- CloudWatch logs showing `bedrock_instructions` being read
- Sign-off to proceed to Phase 3

**Rationale**: Only 1 customer, so comprehensive testing is critical. No room for errors with production client.

---

### Phase 3: Config Builder UI (Weeks 4-6)

**Goal**: Build Config Builder UI for editing `bedrock_instructions` with validation and preview

#### UI-001: Create Zod Validation Schema
**Description**: Create Zod schema for `bedrock_instructions` with all validation rules.

- **Agent**: typescript-specialist
- **Dependencies**: MIG-008 (Phase 2 complete)
- **Effort**: 3 hours
- **Files Created**:
  - `/picasso-config-builder/src/lib/schemas/bedrockInstructions.schema.ts`

**Acceptance Criteria**:
1. `bedrockInstructionsSchema` Zod schema exported
2. Schema validates `_version` (string, default "1.0")
3. Schema validates `_updated` (ISO datetime string)
4. Schema validates `role_instructions`:
   - Required
   - Min length 1
   - Max length 1000
   - Rejects prompt injection patterns (`/<script|javascript:|data:/i`)
5. Schema validates `formatting_preferences` object with all fields
6. Schema validates `emoji_usage` enum ["none", "moderate", "generous"]
7. Schema validates `max_emojis_per_response` (integer, 0-10)
8. Schema validates `response_style` enum
9. Schema validates `detail_level` enum
10. Schema validates `custom_constraints` (array, max 10 items, each ≤500 chars)
11. Schema validates `fallback_message` (required, max 500 chars)
12. TypeScript type exported: `BedrockInstructions`
13. Unit tests for schema validation (valid/invalid cases)

**Deliverables**:
- Zod schema file (`bedrockInstructions.schema.ts`)
- TypeScript type definition
- Unit tests for schema validation
- All tests passing

---

#### UI-002: Create BedrockInstructionsEditor Component Structure
**Description**: Create main container component with tab structure (Customizable, System Rules, Preview).

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-001 (schema must exist)
- **Effort**: 4 hours
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/index.tsx`

**Acceptance Criteria**:
1. `BedrockInstructionsEditor` component exported
2. Component uses shadcn/ui `Tabs` component
3. Three tabs rendered:
   - "Customizable" (Edit icon)
   - "System Rules" (Lock icon)
   - "Preview"
4. Component reads `bedrock_instructions` from Zustand store
5. Component initializes missing `bedrock_instructions` with defaults
6. Component provides `updateConfig` callback to store
7. Component sets `_updated` timestamp on every change
8. Component renders placeholder for child components (TBD)
9. Component has TypeScript types
10. Component has basic styling (Card layout)

**Deliverables**:
- BedrockInstructionsEditor component
- Component integrated with Zustand store
- Basic rendering test

---

#### UI-003: Create LockedSectionsDisplay Component
**Description**: Create read-only display showing locked sections with explanations.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-002 (parent component structure exists)
- **Effort**: 3 hours
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/LockedSectionsDisplay.tsx`

**Acceptance Criteria**:
1. `LockedSectionsDisplay` component exported
2. Component displays 6 locked sections:
   - Anti-Hallucination Rules
   - URL/Link Preservation
   - KB Context Injection Format
   - Conversation History Handling
   - Capability Boundaries
   - Loop Prevention Logic
3. Each section has:
   - Title with Lock icon
   - Content preview (first 100 chars)
   - "Why Locked?" explanation
   - Badge: "System-Level - Cannot be Customized"
4. Content is read-only (no editable fields)
5. Sections use Accordion for expandability
6. Component has basic styling

**Deliverables**:
- LockedSectionsDisplay component
- Component renders correctly in "System Rules" tab
- Component has descriptive explanations

---

#### UI-004: Create RoleInstructionsEditor Component
**Description**: Create textarea editor for `role_instructions` with validation and character count.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-001 (schema must exist)
- **Effort**: 3 hours
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/RoleInstructionsEditor.tsx`

**Acceptance Criteria**:
1. `RoleInstructionsEditor` component exported
2. Component renders labeled textarea: "Role Instructions"
3. Textarea bound to `bedrock_instructions.role_instructions`
4. Character count indicator shows "X / 1000 characters"
5. Character count color:
   - Green: < 800
   - Yellow: 800-950
   - Red: > 950
6. Validation error shown if:
   - Empty (required field)
   - Exceeds 1000 characters
   - Contains injection patterns
7. Save button disabled if validation errors
8. Debounced input (500ms delay before validation)
9. Component has helper text: "How your chatbot introduces itself and frames its role"

**Deliverables**:
- RoleInstructionsEditor component
- Component integrated with parent
- Validation working correctly
- Character count indicator

---

#### UI-005: Create FormattingPreferencesEditor Component
**Description**: Create form with dropdowns and number input for formatting preferences.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-001 (schema must exist)
- **Effort**: 4 hours
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/FormattingPreferencesEditor.tsx`

**Acceptance Criteria**:
1. `FormattingPreferencesEditor` component exported
2. Component renders 4 form fields:
   - Emoji Usage (dropdown: none/moderate/generous)
   - Max Emojis (number input: 0-10)
   - Response Style (dropdown: professional_concise/warm_conversational/structured_detailed)
   - Detail Level (dropdown: concise/balanced/comprehensive)
3. Each dropdown shows human-readable labels (not enum keys)
4. Each field has helper text explaining impact
5. Validation errors shown if values invalid
6. Fields bound to `bedrock_instructions.formatting_preferences`
7. Changes trigger store update
8. Component has visual grouping (Card or Fieldset)

**Deliverables**:
- FormattingPreferencesEditor component
- Component integrated with parent
- All fields validated
- Helper text for each field

---

#### UI-006: Create CustomConstraintsEditor Component
**Description**: Create array input for adding/removing custom constraints.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-001 (schema must exist)
- **Effort**: 4 hours
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/CustomConstraintsEditor.tsx`

**Acceptance Criteria**:
1. `CustomConstraintsEditor` component exported
2. Component renders list of current constraints
3. Each constraint has:
   - Text display
   - Delete button (X icon)
   - Character count (X / 500)
4. "Add Constraint" button adds new empty constraint
5. Textarea for editing each constraint
6. Validation per constraint:
   - Max 500 characters
   - No injection patterns
7. Validation for array:
   - Max 10 constraints
8. Empty constraints auto-removed on blur
9. Helper text: "Tenant-specific rules that ADD to locked constraints"
10. Warning if constraint seems to contradict locked rules

**Deliverables**:
- CustomConstraintsEditor component
- Component integrated with parent
- Add/remove functionality working
- Validation for each constraint

---

#### UI-007: Create FallbackMessageEditor Component
**Description**: Create textarea editor for fallback message with validation.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-001 (schema must exist)
- **Effort**: 2 hours
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/FallbackMessageEditor.tsx`

**Acceptance Criteria**:
1. `FallbackMessageEditor` component exported
2. Component renders labeled textarea: "Fallback Message"
3. Textarea bound to `bedrock_instructions.fallback_message`
4. Character count indicator shows "X / 500 characters"
5. Character count color:
   - Green: < 400
   - Yellow: 400-475
   - Red: > 475
6. Validation error shown if:
   - Empty (required field)
   - Exceeds 500 characters
7. Helper text: "Message shown when knowledge base has no relevant context"
8. Example shown: "I don't have information about this topic..."

**Deliverables**:
- FallbackMessageEditor component
- Component integrated with parent
- Validation working
- Character count indicator

---

#### UI-008: Create PromptPreview Component (Server-Side)
**Description**: Create preview panel showing assembled prompt using server-side `/preview-prompt` endpoint.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-002 through UI-007 (all editors exist), LAMBDA-014 (preview endpoint exists)
- **Effort**: 7 hours (increased from 5h, now server-side instead of client-side)
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/PromptPreview.tsx`
  - `/picasso-config-builder/src/lib/api/preview.ts`

**Acceptance Criteria**:
1. `PromptPreview` component exported
2. Component calls `/preview-prompt` Lambda endpoint with current `bedrock_instructions`
3. Displays exact prompt returned from Lambda (100% accurate to production)
4. Preview shows:
   - Locked sections (grayed out, marked "System-Level")
   - Unlocked sections (highlighted, marked "Customizable")
   - Final assembled prompt structure
5. Preview updates when user clicks "Refresh Preview" button (debounced 1 second)
6. Shows loading state while fetching preview from Lambda
7. Shows error state if preview endpoint fails
8. Preview is read-only (no editing in preview)
9. Preview shows character count for full prompt
10. Preview has "Copy to Clipboard" button
11. Preview has visual distinction between locked/unlocked
12. Preview uses monospace font for readability
13. Error handling for validation failures (400 response from Lambda)

**Deliverables**:
- PromptPreview component with server-side integration
- API client for `/preview-prompt` endpoint
- Component integrated with parent
- Loading/error states
- Copy-to-clipboard functionality

**Rationale**: CRITICAL per user request - server-side preview ensures 100% accuracy. Prevents creating many config versions due to preview inaccuracy.

---

#### UI-009: Add Zustand Store Slice for bedrock_instructions
**Description**: Create Zustand store slice for managing `bedrock_instructions` state.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-001 (schema must exist)
- **Effort**: 3 hours
- **Files Created/Changed**:
  - `/picasso-config-builder/src/store/slices/bedrockInstructions.ts`
  - `/picasso-config-builder/src/store/index.ts` (import slice)

**Acceptance Criteria**:
1. `bedrockInstructionsSlice` exported
2. Slice includes state:
   - `bedrock_instructions`: BedrockInstructions | null
3. Slice includes actions:
   - `updateRoleInstructions(value: string)`
   - `updateFormattingPreferences(prefs: FormattingPreferences)`
   - `addCustomConstraint(constraint: string)`
   - `removeCustomConstraint(index: number)`
   - `updateFallbackMessage(value: string)`
   - `resetToDefaults()`
4. Each action updates `_updated` timestamp
5. Slice integrated with main store
6. Slice has TypeScript types
7. Selectors created for computed values

**Deliverables**:
- Zustand store slice for bedrock_instructions
- Slice integrated with main store
- Actions working correctly

---

#### UI-010: Wire Up Save Functionality to S3
**Description**: Implement save functionality to write updated config to S3 via API.

- **Agent**: Frontend-Engineer
- **Dependencies**: UI-009 (store slice must exist)
- **Effort**: 4 hours
- **Files Changed**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/index.tsx`
  - `/picasso-config-builder/src/lib/api/config-operations.ts`

**Acceptance Criteria**:
1. "Save Changes" button added to BedrockInstructionsEditor
2. Button disabled if validation errors present
3. Click triggers API call to save config
4. API call updates S3 config with new `bedrock_instructions`
5. Success toast shown: "Changes saved. Will take effect in 5 minutes."
6. Error toast shown if save fails
7. Loading state shown during save
8. Button shows "Saved ✓" briefly after success
9. Unsaved changes indicator if user edits after save
10. "Reset to Defaults" button restores DEFAULT_BEDROCK_INSTRUCTIONS

**Deliverables**:
- Save functionality implemented
- API integration working
- Success/error handling
- User feedback (toasts, button states)

---

#### UI-011: Unit Tests for All Editor Components
**Description**: Write unit tests for all BedrockInstructionsEditor components.

- **Agent**: test-engineer
- **Dependencies**: UI-002 through UI-008 (all components exist)
- **Effort**: 10 hours (increased from 6h per feasibility review)
- **Files Created**:
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/__tests__/index.test.tsx`
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/__tests__/RoleInstructionsEditor.test.tsx`
  - `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/__tests__/FormattingPreferencesEditor.test.tsx`
  - (etc. for each component)

**Acceptance Criteria**:
1. Unit tests for BedrockInstructionsEditor (renders all tabs)
2. Unit tests for LockedSectionsDisplay (shows locked sections)
3. Unit tests for RoleInstructionsEditor:
   - Character count updates
   - Validation errors shown
   - Injection patterns detected
4. Unit tests for FormattingPreferencesEditor (all dropdowns work)
5. Unit tests for CustomConstraintsEditor:
   - Add constraint
   - Remove constraint
   - Validation per constraint
6. Unit tests for FallbackMessageEditor (character count, validation)
7. Unit tests for PromptPreview (real-time updates, copy-to-clipboard)
8. All tests passing
9. Coverage >80% for all editor components

**Deliverables**:
- Unit test files for all components
- 20+ test cases total
- All tests passing
- Coverage report showing >80%

---

#### UI-012: Integration Tests (Edit → Save → S3)
**Description**: Write integration tests for full workflow: edit config → save → verify S3 update.

- **Agent**: test-engineer
- **Dependencies**: UI-010 (save functionality must exist)
- **Effort**: 4 hours
- **Files Created**:
  - `/picasso-config-builder/e2e/bedrock-instructions-editor.spec.ts`

**Acceptance Criteria**:
1. E2E test: Load tenant config
2. E2E test: Navigate to Bedrock Instructions editor
3. E2E test: Edit role_instructions
4. E2E test: Change emoji_usage dropdown
5. E2E test: Add custom constraint
6. E2E test: Edit fallback_message
7. E2E test: Click "Save Changes"
8. E2E test: Verify success toast shown
9. E2E test: Verify S3 config updated (mock S3 API in test)
10. All tests passing
11. Tests run in Playwright (Chromium, Firefox, WebKit)

**Deliverables**:
- E2E test file for Bedrock Instructions editor
- 8+ test scenarios
- All tests passing in all browsers

---

#### UI-013: Deploy Config Builder to Staging
**Description**: Deploy Config Builder UI with Bedrock Instructions editor to staging environment.

- **Agent**: deployment-specialist
- **Dependencies**: UI-011, UI-012 (all tests passing)
- **Effort**: 2 hours
- **Deployment Target**: Staging environment

**Acceptance Criteria**:
1. Config Builder built with `npm run build:staging`
2. Build includes BedrockInstructionsEditor components
3. Deployed to staging environment
4. "Bedrock Instructions" tab visible in navigation
5. Tab accessible from tenant config page
6. Staging environment accessible via URL
7. Manual test: Load TEST001, edit bedrock_instructions, save
8. Manual test: Verify S3 config updated
9. Manual test: Wait 5 min, test chatbot uses new prompt

**Deliverables**:
- Deployed Config Builder in staging
- Manual test report
- Staging URL documented

---

#### UI-014: Deploy Config Builder to Production
**Description**: Deploy Config Builder UI with Bedrock Instructions editor to production environment.

- **Agent**: deployment-specialist
- **Dependencies**: UI-013 (staging deployment validated)
- **Effort**: 2 hours
- **Deployment Window**: Saturday 2pm ET (low admin usage)
- **Deployment Target**: Production environment

**Acceptance Criteria**:
1. Config Builder built with `npm run build:production`
2. Build includes BedrockInstructionsEditor components
3. Deployed to production environment
4. "Bedrock Instructions" tab visible in navigation
5. Tab accessible from tenant config page
6. Production environment accessible via URL
7. Manual test: Load Austin Angels (AUS123957), view bedrock_instructions
8. Manual test: Edit role_instructions, save successfully
9. Manual test: Verify S3 config updated

**Deliverables**:
- Deployed Config Builder in production
- Manual test report
- Production URL documented
- Sign-off to proceed to Phase 4

---

### Phase 4: Production Validation (Week 7)

**Goal**: Validate everything works end-to-end and gather success metrics

#### VAL-001: Customize First Tenant (Austin Angels)
**Description**: Use Config Builder to customize Austin Angels (AUS123957) bedrock instructions and validate changes.

- **Agent**: Product-Manager (you, as admin)
- **Dependencies**: UI-014 (production Config Builder deployed)
- **Effort**: 2 hours
- **Tenant**: Austin Angels (AUS123957)

**Acceptance Criteria**:
1. Open Config Builder in production
2. Load Austin Angels tenant config
3. Navigate to "Bedrock Instructions" tab
4. Verify current settings:
   - `emoji_usage`: "generous"
   - `max_emojis_per_response`: 5
   - `response_style`: "warm_conversational"
   - `custom_constraints`: ["Always mention that all programs are free for foster families"]
5. Edit role_instructions to add warmth
6. Preview changes in Preview tab
7. Save changes to S3
8. Wait 6 minutes for cache TTL
9. Test chatbot with 3 questions:
   - "What programs do you offer?"
   - "How can I apply?"
   - "Do programs cost money?"
10. Verify responses reflect new prompt (warm tone, mentions free programs)
11. CloudWatch logs show PROMPT_VERSION: 2.0.0 and bedrock_instructions present: YES

**Deliverables**:
- Customized Austin Angels config in S3
- Test results showing expected behavior
- Screenshots of before/after responses
- Client feedback (optional, if you reach out)

---

#### VAL-002: Monitor CloudWatch Metrics
**Description**: Set up and monitor CloudWatch dashboards and alarms for bedrock instructions usage.

- **Agent**: Backend-Engineer
- **Dependencies**: VAL-001 (first customization complete)
- **Effort**: 3 hours
- **Monitoring Period**: 48 hours continuous

**Acceptance Criteria**:
1. CloudWatch dashboard created: "Bedrock Prompt Monitoring"
2. Dashboard includes widgets:
   - PROMPT_VERSION distribution (pie chart)
   - bedrock_instructions usage (YES vs NO, pie chart)
   - Prompt build duration (line chart, p50/p95/p99)
   - Validation errors (count over time)
   - Lambda execution time comparison (before/after)
3. CloudWatch alarms configured:
   - Prompt build duration > 10ms (average over 5 min) → alert
   - Validation errors > 5 per 5 min → alert
   - Lambda error rate > baseline + 10% → alert
4. Monitor for 48 hours
5. No alarms triggered
6. Metrics within expected ranges:
   - Prompt build duration < 5ms
   - 100% of requests using PROMPT_VERSION 2.0.0
   - 100% of requests using bedrock_instructions
   - Validation errors = 0

**Deliverables**:
- CloudWatch dashboard configured
- CloudWatch alarms configured
- 48-hour monitoring report
- Metrics screenshots

---

#### VAL-003: Create User Guide Documentation
**Description**: Write admin guide documenting how to customize prompts via Config Builder.

- **Agent**: technical-writer
- **Dependencies**: VAL-001 (hands-on experience with UI)
- **Effort**: 8 hours (increased from 6h per feasibility review)
- **Files Created**:
  - `/picasso-config-builder/docs/BEDROCK_INSTRUCTIONS_USER_GUIDE.md`

**Acceptance Criteria**:
1. User guide includes sections:
   - Introduction: What is prompt customization
   - Understanding Locked vs Unlocked
   - Step-by-step walkthrough with screenshots
   - Field reference table
   - Best practices and tips
   - Troubleshooting common issues
   - Rollback instructions
2. User guide includes examples:
   - Professional/Formal variant
   - Warm/Conversational variant
   - Medical/Conservative variant
3. User guide includes warnings:
   - Changes take 5 minutes to propagate
   - Don't weaken locked rules with custom constraints
4. User guide reviewed by admin (you)
5. User guide published to docs folder

**Deliverables**:
- User guide document (BEDROCK_INSTRUCTIONS_USER_GUIDE.md)
- Screenshots embedded in guide
- Examples for common use cases
- Admin sign-off on guide

---

#### VAL-004: Update API Documentation
**Description**: Update Config Builder API documentation to include bedrock_instructions endpoints.

- **Agent**: technical-writer
- **Dependencies**: None (can run parallel with VAL-003)
- **Effort**: 2 hours
- **Files Changed**:
  - `/picasso-config-builder/docs/API_DOCUMENTATION.md`

**Acceptance Criteria**:
1. API documentation updated with:
   - Schema definition for `bedrock_instructions`
   - Validation rules
   - Default values
   - Example request/response
2. Lambda API changes documented:
   - PROMPT_VERSION logging
   - bedrock_instructions usage
3. Migration script documented:
   - Usage instructions
   - Dry-run vs execute modes
   - Rollback procedure
4. Documentation reviewed by backend engineer
5. Documentation published to docs folder

**Deliverables**:
- Updated API_DOCUMENTATION.md
- Schema reference included
- Migration script usage documented

---

#### VAL-005: Gather Client Feedback
**Description**: Reach out to Austin Angels (and optionally other clients) for feedback on customized chatbot.

- **Agent**: Product-Manager (you, as admin)
- **Dependencies**: VAL-001 (customization deployed for 48 hours)
- **Effort**: 2 hours
- **Feedback Method**: Email or phone call

**Acceptance Criteria**:
1. Reach out to Austin Angels contact person
2. Ask for feedback on chatbot tone/personality
3. Questions to ask:
   - Does the chatbot sound like your organization?
   - Is the tone appropriate for your audience?
   - Are there any changes you'd like to make?
4. Document feedback in notes
5. If positive: Request testimonial for marketing
6. If negative: Document requested changes for iteration
7. Feedback report created

**Deliverables**:
- Client feedback report
- Action items (if any changes requested)
- Testimonial (if obtained)

---

#### VAL-006: Performance Baseline Comparison
**Description**: Compare Lambda performance metrics before/after bedrock instructions implementation.

- **Agent**: Backend-Engineer
- **Dependencies**: VAL-002 (monitoring data available)
- **Effort**: 2 hours
- **Baseline Data**: Week before Phase 1 deployment
- **Comparison Data**: Week 7 (current week)

**Acceptance Criteria**:
1. Query CloudWatch metrics for baseline period (before Phase 1)
2. Query CloudWatch metrics for current period (Week 7)
3. Compare metrics:
   - Lambda execution duration (avg, p95, p99)
   - S3 config read latency
   - Cache hit rate
   - Error rate
4. Metrics within acceptable variance:
   - Execution duration: < 5% increase
   - S3 latency: no change (cache hit rate >95%)
   - Error rate: ≤ baseline
5. Performance report generated with charts
6. Report shows no performance degradation

**Deliverables**:
- Performance comparison report
- CloudWatch Insights queries used
- Charts showing before/after metrics
- Conclusion: No performance degradation

---

#### VAL-007: Success Metrics Report
**Description**: Generate final success metrics report measuring all technical, UX, and business metrics.

- **Agent**: Product-Manager (you, as admin)
- **Dependencies**: VAL-001 through VAL-006 (all validation complete)
- **Effort**: 3 hours
- **Report Template**: See PRD Section "Success Metrics"

**Acceptance Criteria**:
1. Report includes all success metrics from PRD:
   - **Technical Success Metrics** (TS-1 through TS-6)
   - **User Experience Success Metrics** (UX-1 through UX-4)
   - **Business Success Metrics** (BS-1 through BS-5)
   - **Operational Success Metrics** (OP-1 through OP-3)
2. Each metric has:
   - Target value
   - Actual value measured
   - Pass/fail status
3. Report includes evidence:
   - CloudWatch logs screenshots
   - Config validation reports
   - Test results
   - Client feedback
4. Report includes overall assessment:
   - All critical metrics passed: Yes/No
   - Blockers for production use: None expected
   - Recommendations for next steps
5. Report reviewed and approved by admin (you)

**Deliverables**:
- Success metrics report document
- Evidence attachments
- Overall project assessment
- Admin sign-off on project completion

---

#### VAL-008: Create Rollback Procedure Documentation
**Description**: Document complete rollback procedure for all deployment stages.

- **Agent**: deployment-specialist
- **Dependencies**: None (can run parallel with other VAL tasks)
- **Effort**: 3 hours
- **Files Created**:
  - `/picasso-config-builder/docs/BEDROCK_INSTRUCTIONS_ROLLBACK_PROCEDURE.md`

**Acceptance Criteria**:
1. Rollback procedure documented for each phase:
   - Lambda rollback (restore previous version)
   - Config rollback (restore from S3 versioning)
   - Config Builder rollback (redeploy previous version)
2. Each rollback includes:
   - When to execute rollback
   - Step-by-step instructions
   - Commands to run
   - Validation steps after rollback
   - Estimated time to complete
3. Emergency contact info included
4. Rollback SLA documented: < 15 minutes for Lambda, < 30 minutes for full rollback
5. Procedure tested on TEST001 (dry-run rollback)
6. Document reviewed by backend engineer

**Deliverables**:
- Rollback procedure document
- Tested rollback on TEST001
- Emergency runbook ready

---

#### VAL-009: Project Completion Report
**Description**: Write final project completion report summarizing implementation, lessons learned, and next steps.

- **Agent**: Product-Manager (you, as admin)
- **Dependencies**: VAL-007 (success metrics report complete)
- **Effort**: 2 hours
- **Files Created**:
  - `/picasso-config-builder/docs/BEDROCK_INSTRUCTIONS_PROJECT_COMPLETION_REPORT.md`

**Acceptance Criteria**:
1. Completion report includes sections:
   - Executive summary (1 paragraph)
   - Implementation timeline (actual vs planned)
   - Success metrics summary
   - Challenges encountered and resolutions
   - Lessons learned
   - Future enhancements (out of scope items from PRD)
   - Next steps
2. Report includes final statistics:
   - Total tasks completed: 50+
   - Total hours invested
   - Total tenants migrated
   - Lines of code changed
3. Report includes acknowledgments (thank agents per SOP)
4. Report approved by admin (you)
5. Project marked as COMPLETE

**Deliverables**:
- Project completion report
- Final statistics
- Lessons learned documented
- Project status updated to COMPLETE

---

#### VAL-010: Celebrate & Archive
**Description**: Archive all project artifacts and celebrate successful completion.

- **Agent**: Product-Manager (you, as admin)
- **Dependencies**: VAL-009 (completion report approved)
- **Effort**: 1 hour

**Acceptance Criteria**:
1. All project documents archived in `/picasso-config-builder/docs/archive/bedrock-instructions/`
2. Archive includes:
   - PRD, TDD, ADRs, Sprint Plan
   - All test reports
   - Migration report
   - Success metrics report
   - Completion report
   - CloudWatch screenshots
3. Git tag created: `bedrock-instructions-v1.0`
4. Changelog updated with release notes
5. Team celebration message posted (thank yourself and agents!)
6. Project retrospective scheduled (1 week later)

**Deliverables**:
- Archived project documents
- Git tag created
- Changelog updated
- Celebration completed 🎉

---

## Sprint Calendar

### Week 1: Lambda Refactoring (Part 1)

**Monday (Day 1)**
- LAMBDA-001: Extract locked helpers (Backend-Engineer, 4h)
- LAMBDA-002: Create unlocked helpers (Backend-Engineer, 4h)

**Tuesday (Day 2)**
- LAMBDA-003: Add DEFAULT_BEDROCK_INSTRUCTIONS (Backend-Engineer, 2h)
- LAMBDA-004: Add PROMPT_VERSION (Backend-Engineer, 1h)
- LAMBDA-005: Refactor buildPrompt() (Backend-Engineer, 4h)

**Wednesday (Day 3)**
- LAMBDA-006: Add validation function (Backend-Engineer, 3h)
- LAMBDA-007: Unit tests for locked helpers (test-engineer, 3h)

**Thursday (Day 4)**
- LAMBDA-008: Unit tests for unlocked helpers (test-engineer, 4h)
- LAMBDA-009: Integration tests for buildPrompt (test-engineer, 5h - starts today, finishes Friday)

**Friday (Day 5)**
- LAMBDA-009: Integration tests (continued, test-engineer, finishes)
- LAMBDA-010: Deploy to staging (deployment-specialist, 2h)

**✅ Week 1 Milestone**: Lambda refactored and deployed to staging

---

### Week 2: Lambda Refactoring (Part 2)

**Monday (Day 6)**
- LAMBDA-011: Validate staging Lambda (test-engineer, 3h)
- LAMBDA-012: Deploy to production (deployment-specialist, 2h - Saturday deployment scheduled)

**Tuesday (Day 7)**
- LAMBDA-013: Monitor production (Backend-Engineer, 2h setup + automated monitoring begins)

**Wednesday - Friday (Days 8-10)**
- LAMBDA-013: Monitor production continues (48-hour period)
- **Parallel**: Start Phase 2 planning

**✅ Week 2 Milestone**: Lambda in production, all tests passing, 48-hour monitoring clean

**Phase Gate 1: Cannot proceed to Phase 2 until:**
- ✅ All unit tests passing (>80% coverage)
- ✅ Integration tests passing
- ✅ Staging validation successful
- ✅ Production deployment successful
- ✅ 48-hour monitoring shows no errors
- ✅ PROMPT_VERSION logged in all requests

---

### Week 3: Manual Config Update

**Monday (Day 11) - Morning (2 hours total)**
- MIG-001-SIMPLE: Manual config update for Austin Angels (Backend-Engineer, 1h)
- MIG-002-SIMPLE: Validate Austin Angels chatbot (test-engineer, 1h)

**Monday (Day 11) - Afternoon through Friday (Day 15)**
- **BUFFER TIME**: 4.5 days freed up from simplified migration
- **Use for**:
  - Early start on Phase 3 (UI work can begin)
  - Additional testing and validation
  - UI polish and refinement
  - Documentation updates
  - Contingency time if Phase 1 overran

**✅ Week 3 Milestone**: Austin Angels config updated successfully, no behavior changes

**Phase Gate 2: Cannot proceed to Phase 3 until:**
- ✅ Austin Angels config updated with `bedrock_instructions`
- ✅ Config validates against schema
- ✅ S3 upload successful with versioned backup
- ✅ Chatbot tested (5 questions, 80%+ similarity to baseline)
- ✅ CloudWatch shows bedrock_instructions present: YES
- ✅ No Lambda errors for Austin Angels

---

### Week 4: Config Builder UI (Part 1)

**Monday (Day 16)**
- UI-001: Create Zod validation schema (typescript-specialist, 3h)
- UI-002: Create BedrockInstructionsEditor structure (Frontend-Engineer, 4h)

**Tuesday (Day 17)**
- UI-003: Create LockedSectionsDisplay (Frontend-Engineer, 3h)
- UI-004: Create RoleInstructionsEditor (Frontend-Engineer, 3h)

**Wednesday (Day 18)**
- UI-005: Create FormattingPreferencesEditor (Frontend-Engineer, 4h)
- UI-006: Create CustomConstraintsEditor (Frontend-Engineer, 4h - starts, continues Thursday)

**Thursday (Day 19)**
- UI-006: Finish CustomConstraintsEditor (Frontend-Engineer, finishes)
- UI-007: Create FallbackMessageEditor (Frontend-Engineer, 2h)

**Friday (Day 20)**
- UI-008: Create PromptPreview (Frontend-Engineer, 5h)

**✅ Week 4 Milestone**: All UI components built, ready for integration

---

### Week 5: Config Builder UI (Part 2)

**Monday (Day 21)**
- UI-009: Add Zustand store slice (Frontend-Engineer, 3h)
- UI-010: Wire up save functionality (Frontend-Engineer, 4h)

**Tuesday (Day 22)**
- UI-011: Unit tests for all components (test-engineer, 6h - starts, continues Wednesday)

**Wednesday (Day 23)**
- UI-011: Unit tests continued (test-engineer, finishes)
- UI-012: Integration tests (test-engineer, 4h)

**Thursday (Day 24)**
- UI-013: Deploy Config Builder to staging (deployment-specialist, 2h)
- **Manual testing in staging**

**Friday (Day 25)**
- UI-014: Deploy Config Builder to production (deployment-specialist, 2h - Saturday 2pm deployment)

**✅ Week 5 Milestone**: Config Builder UI deployed to production

**Phase Gate 3: Cannot proceed to Phase 4 until:**
- ✅ All UI components working
- ✅ Unit tests passing (>80% coverage)
- ✅ Integration tests passing (E2E workflows)
- ✅ Staging deployment successful
- ✅ Manual testing in staging passed
- ✅ Production deployment successful
- ✅ "Bedrock Instructions" tab accessible in production

---

### Week 6: Config Builder UI (Part 3) - Buffer Week

**Monday-Friday (Days 26-30)**
- **Buffer time for any UI polish or bug fixes**
- **Additional testing if needed**
- **Documentation updates**
- **Begin Phase 4 validation work**

**✅ Week 6 Milestone**: UI fully tested and polished

---

### Week 7: Production Validation

**Monday (Day 31)**
- VAL-001: Customize first tenant (Product-Manager, 2h)
- VAL-002: Monitor CloudWatch metrics (Backend-Engineer, 3h setup)

**Tuesday (Day 32)**
- VAL-002: CloudWatch monitoring continues (48-hour period)
- VAL-003: Create user guide (technical-writer, 6h)

**Wednesday (Day 33)**
- VAL-004: Update API documentation (technical-writer, 2h)
- VAL-005: Gather client feedback (Product-Manager, 2h)

**Thursday (Day 34)**
- VAL-006: Performance baseline comparison (Backend-Engineer, 2h)
- VAL-007: Success metrics report (Product-Manager, 3h)
- VAL-008: Create rollback procedure (deployment-specialist, 3h)

**Friday (Day 35)**
- VAL-009: Project completion report (Product-Manager, 2h)
- VAL-010: Celebrate & archive (Product-Manager, 1h)

**✅ Week 7 Milestone**: Project complete, all metrics green, documentation ready

**Phase Gate 4: Project completion criteria:**
- ✅ First tenant customized successfully
- ✅ Client feedback positive (or action items documented)
- ✅ 48-hour monitoring clean
- ✅ Success metrics report shows all targets met
- ✅ User guide and API docs complete
- ✅ Rollback procedure tested
- ✅ Project completion report approved

---

## Resource Allocation

### Backend-Engineer

**Total Hours**: 37 hours (4.6 days) - reduced from 44h due to simplified migration
**Active Weeks**: 1, 2, 3, 7

**Week 1** (18 hours, +2h from v1.0):
- LAMBDA-001: Extract locked helpers (4h)
- LAMBDA-002: Create unlocked helpers (4h)
- LAMBDA-003: Add DEFAULT_BEDROCK_INSTRUCTIONS (2h)
- LAMBDA-004: Add PROMPT_VERSION (1h)
- LAMBDA-005: Refactor buildPrompt() (6h, was 4h)
- LAMBDA-006: Add validation function (3h)

**Week 2** (9 hours, +5h from v1.0):
- LAMBDA-013: Monitor production Lambda setup (2h)
- LAMBDA-013: Monitoring spot checks (2h over 48 hours)
- LAMBDA-014: Preview prompt endpoint (3h, NEW)
- LAMBDA-015: Validation parity tests (2h, NEW - test-engineer may assist)

**Week 3** (1 hour, -12h from v1.0):
- MIG-001-SIMPLE: Manual config update for Austin Angels (1h)

**Week 7** (5 hours):
- VAL-002: Monitor CloudWatch metrics setup (3h)
- VAL-006: Performance baseline comparison (2h)

**Parallel Opportunities**:
- LAMBDA-001 and LAMBDA-002 can run in parallel (Week 1, Day 1)
- Monitoring tasks are mostly automated (spot checks only)

**Handoffs**:
- To test-engineer: After LAMBDA-006 (provide helper functions for testing)
- To deployment-specialist: After tests pass (provide deployment.zip)
- To Frontend-Engineer: After Phase 2 (migration complete, schema finalized)

---

### test-engineer

**Total Hours**: 29 hours (3.6 days) - increased from 28h
**Active Weeks**: 1, 2, 3, 5

**Week 1** (14 hours, +2h from v1.0):
- LAMBDA-007: Unit tests for locked helpers (3h)
- LAMBDA-008: Unit tests for unlocked helpers (4h)
- LAMBDA-009: Integration tests for buildPrompt (7h, was 5h)

**Week 2** (5 hours, +2h from v1.0):
- LAMBDA-011: Validate staging Lambda (3h)
- LAMBDA-011.5: Production baseline for Austin Angels (2h, NEW)

**Week 3** (1 hour, -2h from v1.0):
- MIG-002-SIMPLE: Validate Austin Angels chatbot (1h)

**Week 5** (14 hours, +4h from v1.0):
- UI-011: Unit tests for all UI components (10h, was 6h)
- UI-012: Integration tests E2E (4h)

**Parallel Opportunities**:
- LAMBDA-007 and LAMBDA-008 can run in parallel if separate test files
- UI unit tests and integration tests can partially overlap

**Handoffs**:
- From Backend-Engineer: Receive refactored Lambda code for testing
- To deployment-specialist: Approve deployment after tests pass
- From Frontend-Engineer: Receive UI components for testing

---

### Frontend-Engineer

**Total Hours**: 46 hours (5.75 days) - increased from 44h
**Active Weeks**: 4, 5

**Week 4** (21 hours):
- UI-002: Create BedrockInstructionsEditor structure (4h)
- UI-003: Create LockedSectionsDisplay (3h)
- UI-004: Create RoleInstructionsEditor (3h)
- UI-005: Create FormattingPreferencesEditor (4h)
- UI-006: Create CustomConstraintsEditor (4h)
- UI-007: Create FallbackMessageEditor (2h)

**Week 5** (18 hours, +2h from v1.0):
- UI-008: Create PromptPreview (7h, was 5h - now server-side)
- UI-009: Add Zustand store slice (3h)
- UI-010: Wire up save functionality (4h)

**Week 6** (4 hours buffer):
- Bug fixes, polish, additional features if time

**Parallel Opportunities**:
- UI-003 through UI-007 can be built in parallel if working on separate branches
- Frontend work fully independent from Backend work (schema is contract)

**Handoffs**:
- From typescript-specialist: Receive Zod schema (UI-001)
- To test-engineer: Provide components for unit testing
- To deployment-specialist: Provide built Config Builder for deployment

---

### typescript-specialist

**Total Hours**: 3 hours
**Active Weeks**: 4

**Week 4** (3 hours):
- UI-001: Create Zod validation schema (3h)

**Parallel Opportunities**:
- Can work independently at start of Week 4
- Output (schema) blocks Frontend-Engineer work

**Handoffs**:
- To Frontend-Engineer: Provide Zod schema and TypeScript types
- To test-engineer: Provide schema for validation testing

---

### deployment-specialist

**Total Hours**: 12 hours (1.5 days)
**Active Weeks**: 1, 2, 3, 5

**Week 1** (2 hours):
- LAMBDA-010: Deploy to staging Lambda (2h)

**Week 2** (2 hours):
- LAMBDA-012: Deploy to production Lambda (2h)

**Week 3** (3 hours):
- MIG-005: Create full S3 backup (1h)
- MIG-006: Execute production migration (included in backend time)

**Week 5** (4 hours):
- UI-013: Deploy Config Builder to staging (2h)
- UI-014: Deploy Config Builder to production (2h)

**Week 7** (3 hours):
- VAL-008: Create rollback procedure (3h)

**Parallel Opportunities**:
- Deployment tasks are sequential (cannot parallelize)
- Deployments scheduled for low-traffic windows

**Handoffs**:
- From Backend-Engineer: Receive deployment.zip for Lambda
- From Frontend-Engineer: Receive built Config Builder
- To all: Confirm successful deployment

---

### technical-writer

**Total Hours**: 10 hours (1.25 days) - increased from 8h
**Active Weeks**: 7

**Week 7** (10 hours, +2h from v1.0):
- VAL-003: Create user guide (8h, was 6h)
- VAL-004: Update API documentation (2h)

**Parallel Opportunities**:
- VAL-003 and VAL-004 can run in parallel if separate documents
- Work is independent of other agents

**Handoffs**:
- From Product-Manager: Receive hands-on experience with UI (VAL-001)
- To all: Provide documentation for reference

---

### Product-Manager (You, as Admin)

**Total Hours**: 10 hours (1.25 days)
**Active Weeks**: 7

**Week 7** (10 hours):
- VAL-001: Customize first tenant (2h)
- VAL-005: Gather client feedback (2h)
- VAL-007: Success metrics report (3h)
- VAL-009: Project completion report (2h)
- VAL-010: Celebrate & archive (1h)

**Responsibilities**:
- Orchestrate all agents per SOP
- Review and approve all deliverables
- Make final decisions on trade-offs
- Validate Phase Gates
- Communicate with clients

**Handoffs**:
- To all agents: Provide project requirements and approve work
- From all agents: Review deliverables and provide feedback

---

## Resource Summary

| Agent | Total Hours | v1.0 Hours | Change | Active Weeks | Critical Path? |
|-------|-------------|------------|--------|--------------|----------------|
| Backend-Engineer | 37h (4.6d) | 44h | -7h | 1, 2, 3, 7 | ✅ Yes (Phase 1, 2) |
| test-engineer | 29h (3.6d) | 28h | +1h | 1, 2, 3, 5 | ✅ Yes (blocks deployment) |
| Frontend-Engineer | 46h (5.75d) | 44h | +2h | 4, 5 | ✅ Yes (Phase 3) |
| typescript-specialist | 3h | 3h | 0h | 4 | ⚠️ Partial (blocks UI) |
| deployment-specialist | 12h (1.5d) | 12h | 0h | 1, 2, 3, 5 | ⚠️ Partial (deployment only) |
| technical-writer | 10h (1.25d) | 8h | +2h | 7 | ❌ No (documentation) |
| Product-Manager | 10h (1.25d) | 10h | 0h | 7 | ⚠️ Partial (validation) |

**Total Effort**: 147 hours (~18 days) - reduced from 149h
**Calendar Duration**: 35 business days (7 weeks)
**Efficiency**: 18 days effort / 35 days duration = 51% utilization (good for solo + agents)

**Key Changes from v1.0**:
- Phase 2 simplified: -15h from migration script removal
- Phase 1 additions: +7h (server-side preview endpoint, validation parity, increased estimates)
- Phase 3 additions: +6h (server-side preview UI, increased test estimates)
- Phase 4 additions: +2h (increased documentation estimate)
- Net change: -2h (was 149h, now 147h)

---

## Risk Identification

### Phase 1 Risks

**RISK-P1-001: Lambda Refactoring Breaks Existing Behavior**
- **Impact**: Critical (all tenants break)
- **Likelihood**: Medium (complex refactor)
- **Mitigation**:
  - Comprehensive unit tests (LAMBDA-007, LAMBDA-008)
  - Integration tests with old configs (LAMBDA-009)
  - Staging validation before production (LAMBDA-011)
  - Backward compatibility (defaults used if bedrock_instructions missing)
  - 48-hour production monitoring (LAMBDA-013)
- **Contingency**: Rollback Lambda to v1 (15-minute SLA)

**RISK-P1-002: Performance Degradation**
- **Impact**: Medium (user-visible slowdown)
- **Likelihood**: Low (config reading already cached)
- **Mitigation**:
  - Performance budget: <5ms overhead for buildPrompt()
  - Performance tests before deployment
  - CloudWatch monitoring with alarms
  - Comparison to baseline (VAL-006)
- **Contingency**: Optimize helper functions or rollback

**RISK-P1-003: Deployment Window Missed**
- **Impact**: Low (deployment delayed)
- **Likelihood**: Low (timeline has buffer)
- **Mitigation**:
  - Schedule Saturday 2am deployment (low traffic)
  - Have deployment specialist on-call
  - Rollback plan ready
- **Contingency**: Reschedule to next Saturday

---

### Phase 2 Risks

**RISK-P2-001: Manual Config Update Error**
- **Impact**: Medium (Austin Angels chatbot breaks)
- **Likelihood**: Low (only 1 config, careful manual process)
- **Mitigation**:
  - S3 versioning creates automatic backup
  - Validate config against schema before upload
  - Test thoroughly with baseline comparison (MIG-002-SIMPLE)
  - LAMBDA-011.5 baseline ensures no regressions
- **Contingency**: Restore from S3 version history (5-minute SLA)

**RISK-P2-002: Cache Invalidation Race Condition**
- **Impact**: Low (temporary stale prompts)
- **Likelihood**: Medium (5-minute cache window)
- **Mitigation**:
  - Wait 6 minutes after config upload before testing
  - Document 5-minute TTL clearly in process
  - Monitor CloudWatch for bedrock_instructions usage
- **Contingency**: Accept as expected behavior (documented)

**RISK-P2-003: Austin Angels Regression**
- **Impact**: High (production client impacted)
- **Likelihood**: Low (thorough baseline testing)
- **Mitigation**:
  - LAMBDA-011.5: Record baseline Q&A before production deployment
  - MIG-002-SIMPLE: 80%+ semantic similarity required
  - Quick rollback available via S3 versioning
  - Only 1 customer, so full attention on quality
- **Contingency**: Immediate rollback to previous config version

---

### Phase 3 Risks

**RISK-P3-001: UI Validation Misses Injection Patterns**
- **Impact**: Critical (security vulnerability)
- **Likelihood**: Low (Zod schema tested)
- **Mitigation**:
  - Comprehensive Zod schema (UI-001)
  - Unit tests for validation (UI-011)
  - Lambda validation as defense-in-depth (LAMBDA-006)
  - Security testing with known payloads
- **Contingency**: Lambda rejects invalid configs (failsafe)

**RISK-P3-002: Config Builder Save Fails Silently**
- **Impact**: High (user thinks saved but not)
- **Likelihood**: Low (error handling implemented)
- **Mitigation**:
  - Clear success/error toasts (UI-010)
  - Unsaved changes indicator
  - Integration tests (UI-012)
  - Error logging to CloudWatch
- **Contingency**: Manual S3 edit as workaround

**RISK-P3-003: Preview Doesn't Match Actual Prompt**
- **Impact**: Low (mitigated by server-side preview)
- **Likelihood**: Very Low (server-side preview uses exact Lambda code)
- **Mitigation**:
  - LAMBDA-014: Server-side `/preview-prompt` endpoint (CRITICAL)
  - Preview uses exact same `buildPrompt()` helpers as production
  - UI-008: Calls Lambda endpoint for 100% accurate preview
  - Integration tests validate preview accuracy
  - User explicitly requested this to avoid config version proliferation
- **Contingency**: Preview endpoint failure shows error, user can still save without preview

---

### Phase 4 Risks

**RISK-P4-001: Client Rejects Customized Prompt**
- **Impact**: Low (easy to revert)
- **Likelihood**: Medium (client preferences may differ)
- **Mitigation**:
  - Preview functionality before deployment
  - Gather feedback early (VAL-005)
  - Easy rollback via Config Builder
  - Document customization best practices (VAL-003)
- **Contingency**: Iterate based on feedback, revert to defaults if needed

**RISK-P4-002: Metrics Don't Meet Targets**
- **Impact**: Medium (project not successful)
- **Likelihood**: Low (targets are realistic)
- **Mitigation**:
  - Success metrics defined in PRD
  - Validation throughout implementation
  - Buffer time in Week 6 for polish
- **Contingency**: Document gaps and plan Phase 2 enhancements

---

### Cross-Phase Risks

**RISK-X-001: Timeline Slippage**
- **Impact**: Low (no hard deadline)
- **Likelihood**: Medium (estimates may be off)
- **Mitigation**:
  - Buffer time in Week 6
  - Parallel work where possible
  - Track actual vs estimated hours
  - Adjust timeline if needed (transparency)
- **Contingency**: Extend timeline, deprioritize nice-to-have features

**RISK-X-002: Solo Admin Capacity**
- **Impact**: Medium (admin burnout)
- **Likelihood**: Medium (lots of orchestration)
- **Mitigation**:
  - Agents do heavy lifting (coding, testing, docs)
  - Admin focuses on orchestration and validation
  - Take breaks between phases
  - Celebrate milestones (maintain morale)
- **Contingency**: Extend timeline to reduce daily load

**RISK-X-003: Scope Creep**
- **Impact**: Medium (delays completion)
- **Likelihood**: Medium (tempting to add features)
- **Mitigation**:
  - Strict adherence to PRD
  - Out-of-scope items documented for future
  - Phase Gates enforce completion before moving on
- **Contingency**: Defer new features to Phase 2

---

## Validation Checkpoints

### Phase Gate 1: After Phase 1 (Lambda Refactoring)

**Gate Keeper**: test-engineer + Backend-Engineer
**Review Date**: End of Week 2 (Day 10)

**Validation Criteria**:
- ✅ All unit tests passing (LAMBDA-007, LAMBDA-008)
  - Locked helper tests (4+ test cases)
  - Unlocked helper tests (10+ test cases)
  - Coverage >80%
- ✅ All integration tests passing (LAMBDA-009)
  - buildPrompt with/without bedrock_instructions
  - Includes all locked sections regardless of config
  - Logs PROMPT_VERSION
- ✅ Staging validation successful (LAMBDA-011)
  - TEST001 and TEST002 chatbots working
  - Responses match baseline
  - CloudWatch logs show defaults used
- ✅ Production deployment successful (LAMBDA-012)
  - Canary deployment (10% traffic, no errors)
  - Full deployment (100% traffic, no errors)
- ✅ 48-hour monitoring clean (LAMBDA-013)
  - Error rate ≤ baseline
  - Execution duration within 5% of baseline
  - PROMPT_VERSION logged in all requests
  - No client complaints

**Evidence Required**:
- Test reports (unit, integration)
- Coverage report (>80%)
- Staging validation report (TEST001, TEST002)
- Deployment logs (staging, production)
- 48-hour monitoring report (CloudWatch screenshots)

**Approval Required**: Backend-Engineer signs off, test-engineer signs off, Admin approves

**Blockers to Phase 2**:
- If any tests failing → Fix before proceeding
- If staging broken → Rollback and debug
- If production errors spike → Rollback immediately
- If monitoring shows issues → Investigate and resolve

---

### Phase Gate 2: After Phase 2 (Manual Config Update)

**Gate Keeper**: Backend-Engineer + test-engineer
**Review Date**: Week 3, Day 11 (Monday morning)

**Validation Criteria**:
- ✅ Austin Angels config updated (MIG-001-SIMPLE)
  - `bedrock_instructions` object added to AUS123957-config.json
  - `tone_prompt` migrated to `role_instructions`
  - Tenant-specific overrides applied (emoji_usage: generous, etc.)
  - Config uploaded to S3 successfully
  - S3 versioning created backup
  - Config validates against schema
- ✅ Austin Angels chatbot validated (MIG-002-SIMPLE)
  - 6-minute wait for cache expiry
  - 5 test questions answered successfully
  - Responses 80%+ semantically similar to baseline (from LAMBDA-011.5)
  - CloudWatch shows bedrock_instructions present: YES
  - CloudWatch shows PROMPT_VERSION: 2.0.0
  - No Lambda errors
  - Tone is warm and conversational
  - Mentions free programs for foster families (when relevant)

**Evidence Required**:
- Updated AUS123957-config.json in S3
- S3 version ID for rollback
- Change log documenting update
- Test report comparing post-update vs baseline
- CloudWatch logs showing bedrock_instructions being read

**Approval Required**: Backend-Engineer signs off, test-engineer signs off, Admin approves

**Blockers to Phase 3**:
- If config update fails → Fix and retry
- If validation fails → Rollback and investigate
- If chatbot responses regress → Rollback immediately
- If semantic similarity <80% → Investigate and fix

**Context Change from v1.0**: Simplified from multi-tenant migration to single-tenant manual update. Only 1 customer (Austin Angels in testing), so manual approach is faster and lower risk than migration script.

---

### Phase Gate 3: After Phase 3 (Config Builder UI)

**Gate Keeper**: Frontend-Engineer + test-engineer
**Review Date**: End of Week 5 (Day 25)

**Validation Criteria**:
- ✅ All UI components built (UI-002 through UI-008)
  - BedrockInstructionsEditor renders all tabs
  - LockedSectionsDisplay shows locked sections
  - RoleInstructionsEditor has validation and character count
  - FormattingPreferencesEditor has all dropdowns
  - CustomConstraintsEditor can add/remove constraints
  - FallbackMessageEditor has validation
  - PromptPreview shows real-time updates
- ✅ Zustand store integration working (UI-009)
  - Store slice created
  - Actions update config correctly
  - Selectors return computed values
- ✅ Save functionality working (UI-010)
  - Save button triggers API call
  - S3 config updated successfully
  - Success toast shown
  - Error handling works
- ✅ All unit tests passing (UI-011)
  - Tests for all components
  - Coverage >80%
- ✅ All integration tests passing (UI-012)
  - E2E workflow (edit → save → S3)
  - Tests in Chromium, Firefox, WebKit
- ✅ Staging deployment successful (UI-013)
  - Config Builder accessible in staging
  - "Bedrock Instructions" tab visible
  - Manual test: Edit TEST001, save, verify S3 update
- ✅ Production deployment successful (UI-014)
  - Config Builder accessible in production
  - "Bedrock Instructions" tab visible
  - Manual test: View Austin Angels config

**Evidence Required**:
- Component screenshots
- Test reports (unit, E2E)
- Coverage report (>80%)
- Staging deployment validation
- Production deployment validation

**Approval Required**: Frontend-Engineer signs off, test-engineer signs off, Admin approves

**Blockers to Phase 4**:
- If any tests failing → Fix before proceeding
- If staging broken → Debug and fix
- If production deployment fails → Rollback and retry
- If save functionality not working → Fix critical bug

---

### Phase Gate 4: After Phase 4 (Project Completion)

**Gate Keeper**: Product-Manager (Admin)
**Review Date**: End of Week 7 (Day 35)

**Validation Criteria**:
- ✅ First tenant customized (VAL-001)
  - Austin Angels customized via Config Builder
  - Changes saved to S3
  - Chatbot responses reflect new prompt
  - CloudWatch logs show custom config used
- ✅ Client feedback gathered (VAL-005)
  - Feedback positive OR action items documented
  - Testimonial obtained (if positive)
- ✅ 48-hour monitoring clean (VAL-002)
  - CloudWatch dashboard operational
  - CloudWatch alarms configured
  - No alarms triggered
  - Metrics within expected ranges
- ✅ Success metrics report complete (VAL-007)
  - All metrics measured
  - All critical metrics passed
  - Evidence attached
  - Overall assessment: Success
- ✅ Documentation complete (VAL-003, VAL-004)
  - User guide published
  - API documentation updated
  - Rollback procedure documented
- ✅ Performance baseline comparison clean (VAL-006)
  - No performance degradation
  - Execution duration < 5% increase
  - Cache hit rate >95%
  - Error rate ≤ baseline
- ✅ Project completion report approved (VAL-009)
  - Timeline summary
  - Lessons learned
  - Next steps documented

**Evidence Required**:
- Customized tenant config (Austin Angels)
- Client feedback notes
- CloudWatch monitoring report
- Success metrics report (all targets met)
- User guide and API docs
- Performance comparison report
- Project completion report

**Approval Required**: Admin (you) signs off on project completion

**Blockers to Completion**:
- If critical metrics failing → Investigate and resolve
- If client feedback very negative → Iterate on customization
- If performance degraded → Optimize or rollback
- If documentation incomplete → Finish before closing

---

## Communication Plan

### Weekly Status Updates

**To**: Yourself (solopreneur), optional share with clients
**Format**: Progress summary, completed tasks, blockers, next week plan
**Delivery**: End of each week (Friday EOD)

**Template**:
```markdown
# Weekly Status Update - Week X

**Date**: [Friday date]
**Phase**: [Current phase name]
**Overall Status**: 🟢 On Track / 🟡 Minor Issues / 🔴 Blocked

## This Week
**Completed Tasks**:
- [TASK-ID]: [Task name] ✅
- [TASK-ID]: [Task name] ✅

**In Progress**:
- [TASK-ID]: [Task name] (80% complete)

**Blockers**:
- [Describe blocker if any]

**Hours Invested**: X hours

## Next Week
**Planned Tasks**:
- [TASK-ID]: [Task name]
- [TASK-ID]: [Task name]

**Risks/Concerns**:
- [Any upcoming risks]

**Phase Gate**: [Upcoming gate and criteria]
```

---

### Milestone Notifications

**When**: After each Phase Gate passes
**To**: Yourself (celebrate progress!)
**Format**: Brief announcement

**Examples**:

**Phase 1 Complete**:
```
🎉 Phase 1 Complete: Lambda Refactoring

✅ Lambda refactored and deployed to production
✅ All tests passing (>80% coverage)
✅ 48-hour monitoring clean (no errors)
✅ PROMPT_VERSION tracked in all requests

Next: Phase 2 - Tenant Migration (Week 3)
```

**Phase 2 Complete**:
```
🎉 Phase 2 Complete: Tenant Migration

✅ All tenants migrated successfully (0 failures)
✅ 100% of configs have bedrock_instructions
✅ 24-hour monitoring clean
✅ Spot-check validation passed

Next: Phase 3 - Config Builder UI (Weeks 4-6)
```

**Phase 3 Complete**:
```
🎉 Phase 3 Complete: Config Builder UI

✅ Config Builder deployed to production
✅ All UI components working
✅ All tests passing (unit + E2E)
✅ "Bedrock Instructions" tab accessible

Next: Phase 4 - Production Validation (Week 7)
```

**Project Complete**:
```
🎉 Project Complete: Multi-Tenant Bedrock Prompt Customization

✅ All phases complete
✅ Success metrics report: All targets met
✅ First tenant customized (Austin Angels)
✅ Documentation complete
✅ Client feedback positive

Total Duration: 7 weeks (35 business days)
Total Effort: 149 hours

Thank you to all agents for excellent work! 🙏
```

---

### Client Communication

**When**: After major milestones affecting clients
**To**: Nonprofit decision-makers (optional, based on relationship)
**Format**: Brief email

**After Phase 2 (Migration Complete)**:
```
Subject: Chatbot Update - Behind the Scenes Improvement

Hi [Client Name],

Quick update: We've completed a backend update to your chatbot's AI system.

What changed:
- Technical improvements to how we manage chatbot personalities
- No changes to your chatbot's behavior (it works exactly the same)

What's coming:
- Soon, we'll be able to customize your chatbot's tone and personality to match your brand even better

No action needed from you. Your chatbot continues working as before.

Questions? Let me know!
```

**After Phase 3 (UI Available)**:
```
Subject: New Feature: Customize Your Chatbot's Personality

Hi [Client Name],

Exciting news! We've launched a new feature that lets us customize your chatbot's personality to match your organization's voice.

What we can now customize:
- How the chatbot introduces itself
- Tone (professional vs warm vs casual)
- Emoji usage
- Response style and detail level

Would you like to explore customizing your chatbot's personality? I can schedule a quick call to discuss your brand voice and implement changes.

Let me know if you're interested!
```

**After Phase 4 (First Customization Live)**:
```
Subject: [Organization Name] Chatbot Customization Live!

Hi [Client Name],

Great news! We've customized your chatbot to better reflect your organization's voice.

What changed:
- [List specific customizations, e.g., "More warm and friendly tone"]
- [e.g., "Emphasizes that programs are free for foster families"]

Try it out: [Link to website with chatbot]

Please test it and let me know what you think. We can make adjustments if needed.

Looking forward to your feedback!
```

---

### Agent Communication

**When**: At task handoffs and Phase Gates
**To**: Specialized agents (Backend-Engineer, Frontend-Engineer, etc.)
**Format**: Task assignment template per SOP

**Example Agent Invocation (from SOP)**:
```
Agent: Backend-Engineer

Task: LAMBDA-001 - Extract Locked Helper Functions

Context:
- We're refactoring the Lambda buildPrompt() function to support locked/unlocked architecture
- Current code: /Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js (lines 162-413)
- Goal: Extract anti-hallucination, URL handling, capability boundaries, loop prevention into helper functions

Input Artifacts:
- Current index.js (lines 162-413)
- TDD Section 3.2 (helper function specifications)

Acceptance Criteria:
[List from task breakdown above]

Deliverables:
- Refactored index.js with 4 locked helper functions
- JSDoc comments documenting immutability

Dependencies: None (can start immediately)

Estimated Effort: 4 hours

Please confirm receipt and estimated completion date.
```

**Agent Response Template**:
```
Confirmed: LAMBDA-001

Estimated Completion: [Date/Time]

I will deliver:
- Refactored index.js with locked helper functions
- JSDoc comments

I will notify you when complete for review.
```

---

### Daily Standups (Optional)

**When**: During active development weeks (optional for solo admin)
**Format**: 3 questions

**Questions**:
1. What did I complete yesterday?
2. What will I work on today?
3. Any blockers?

**Example**:
```
Date: 2025-11-18 (Week 1, Day 2)

Yesterday:
- LAMBDA-001 complete (extracted locked helpers)
- LAMBDA-002 complete (created unlocked helpers)

Today:
- LAMBDA-003: Add DEFAULT_BEDROCK_INSTRUCTIONS
- LAMBDA-004: Add PROMPT_VERSION
- LAMBDA-005: Start refactoring buildPrompt()

Blockers: None
```

---

### Retrospectives

**When**: After each phase completion
**Format**: What went well, what could improve, action items

**Example (After Phase 1)**:
```
# Phase 1 Retrospective

Date: [End of Week 2]

## What Went Well
- Unit tests caught several edge cases early
- Staging validation prevented production issues
- Parallel work (LAMBDA-001 + LAMBDA-002) saved time

## What Could Improve
- Integration tests took longer than estimated (5h planned, 6h actual)
- Should have documented helper functions before starting tests
- CloudWatch monitoring setup was manual (could automate)

## Action Items for Phase 2
- Add buffer time to test estimates (20% padding)
- Document functions as we build (not after)
- Create CloudWatch dashboard template for reuse
```

---

## Appendix: Quick Reference

### Task Status Legend

- **Pending**: Not started
- **In Progress**: Currently being worked on
- **Blocked**: Waiting on dependency
- **Complete**: Finished and approved

### Priority Levels

- **P0 (Critical)**: Blocks deployment, must complete
- **P1 (High)**: Important for success, should complete
- **P2 (Nice-to-have)**: Enhances quality, can defer if needed

### Agent Roles Quick Reference

| Agent | Specialization | Primary Phases |
|-------|----------------|----------------|
| Backend-Engineer | Lambda code, Node.js, validation logic | 1, 2 |
| Frontend-Engineer | React, TypeScript, UI components | 3 |
| test-engineer | Unit tests, E2E tests, validation | 1, 2, 3 |
| typescript-specialist | Zod schemas, TypeScript types | 3 |
| deployment-specialist | AWS deployments, S3, rollback | All |
| technical-writer | Documentation, user guides | 4 |
| Product-Manager | Requirements, validation, client comms | 0, 4 |

### Key Files Reference

**Lambda**:
- `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/index.js` (main refactor target)

**Config Builder**:
- `/picasso-config-builder/src/components/editors/BedrockInstructionsEditor/` (UI components)
- `/picasso-config-builder/src/lib/schemas/bedrockInstructions.schema.ts` (Zod schema)
- `/picasso-config-builder/src/store/slices/bedrockInstructions.ts` (Zustand slice)

**Scripts**:
- `/picasso-config-builder/scripts/migrate-bedrock-instructions.js` (migration script)

**Documentation**:
- `/picasso-config-builder/docs/PRD_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md` (PRD)
- `/picasso-config-builder/docs/TDD_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md` (TDD)
- `/picasso-config-builder/docs/ADR_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md` (ADRs)
- `/picasso-config-builder/docs/BEDROCK_INSTRUCTIONS_USER_GUIDE.md` (user guide - to be created)

### CloudWatch Queries Reference

**Check PROMPT_VERSION distribution**:
```sql
fields @timestamp, @message
| filter @message like /PROMPT_VERSION/
| parse @message /PROMPT_VERSION: (?<version>\S+)/
| stats count(*) by version
```

**Check bedrock_instructions usage**:
```sql
fields @timestamp, @message
| filter @message like /Bedrock instructions present/
| stats count(*) by @message
```

**Find validation errors**:
```sql
fields @timestamp, @message, tenant_id
| filter @message like /Invalid bedrock_instructions/
| sort @timestamp desc
```

---

## Document Metadata

**Created**: 2025-11-17
**Author**: Product-Manager (Claude Sonnet 4.5)
**Version**: 1.1
**Last Updated**: 2025-11-17
**Status**: Approved (Revised after Feasibility Review)
**Total Tasks**: 49 tasks (16 Lambda incl. new tasks, 2 Migration, 14 UI, 10 Validation, 5 Cross-Phase)
**Total Effort**: 147 hours (~18 days) - reduced from 149h
**Timeline**: 7 weeks (35 business days)

**Related Documents**:
- PRD: `/picasso-config-builder/docs/PRD_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md`
- TDD: `/picasso-config-builder/docs/TDD_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md`
- ADRs: `/picasso-config-builder/docs/ADR_MULTI_TENANT_BEDROCK_PROMPT_CUSTOMIZATION.md`
- Tech Lead Feasibility Review: (verbal, incorporated into v1.1)

**Revision History**:
- **v1.0** (2025-11-17): Initial approved sprint plan
- **v1.1** (2025-11-17): Revised after feasibility review
  - Simplified Phase 2 migration (only 1 customer)
  - Added server-side preview endpoint (CRITICAL per user request)
  - Added production baseline validation
  - Added validation parity tests
  - Increased underestimated task estimates
  - Updated resource allocation and risks
  - Net change: -2h total effort, Week 3 reduced from 5 days to 0.5 days

**Sign-Off**:
- ✅ Admin (Solopreneur) Approved v1.0: 2025-11-17
- ✅ Tech-Lead-Reviewer Feasibility Review Complete: 2025-11-17
- ✅ Admin (Solopreneur) Approved v1.1 (Revised): [Pending]
- ✅ Ready to Start Phase 1: [Pending Admin Approval]

---

**Let's build this! 🚀**
