# CTA Explicit Branch Routing - MVP Implementation Plan

**Version**: 1.0
**Date**: 2025-10-29
**Status**: Ready for Implementation
**Estimated Time**: 6 hours
**Priority**: MVP Critical

---

## Overview

Implement Lex-style conditional branching for Picasso using explicit CTA → Branch mapping. This enables predictable conversation flows where CTAs route to specific branches, eliminating ambiguity from keyword-only matching.

### Problem Statement

Currently, CTA-triggered queries rely solely on keyword matching for branch detection. This can cause:
- Wrong branch selection when keywords overlap
- Unpredictable routing for CTA-generated queries
- Broken conversation flows when expected branch doesn't match

### Solution

Add explicit branch routing to CTAs, creating a hierarchy:
1. **Explicit routing** (highest priority) - CTA specifies target branch
2. **Keyword matching** (fallback) - For user-typed queries
3. **Fallback branch** (last resort) - When no match found
4. **No CTAs** (default) - Return empty array

---

## Scope

### In Scope (5 hours)

1. **Schema Updates** (30 min) - Add `target_branch`, `fallback_branch` fields ✅ COMPLETE
2. **Lambda Explicit Routing** (2 hours) - Implement routing hierarchy in response_enhancer.js ✅ COMPLETE
3. **Frontend Metadata** (1 hour) - Pass CTA metadata to Lambda for explicit routing ✅ COMPLETE
4. **Config Builder UI** (1.5 hours) - Add branch selection dropdowns to CTA editor and global settings

### Removed from Scope

- ~~**Form Completion Routing** - NOT NEEDED: Existing Post-Submission Actions already provide this functionality with "Continue Conversation" action type and explicit buttons. User's current implementation is superior to automatic routing.~~

### Out of Scope

- ❌ Branch priority field (explicit routing handles most cases)
- ❌ Conditional routing based on form data (Phase 2)
- ❌ Multi-condition AND/OR logic (Phase 2)
- ❌ Session context tracking (Phase 2)
- ❌ Confidence scoring (Phase 3)

---

## Workflow Compliance

This implementation follows **SOP_DEVELOPMENT_WORKFLOW.md** standard task workflow:

### Phase 1: Planning ✅
- [x] Review task requirements
- [x] Identify acceptance criteria
- [x] Determine specialized agents needed
- [x] Create implementation plan document

### Phase 2: Implementation
Each task will:
1. Launch appropriate specialized agent with detailed prompt
2. Monitor agent progress and review deliverables
3. Verify all files created
4. **VALIDATE** before proceeding (mandatory)

### Phase 3: Validation (MANDATORY)
After each task completion:
1. ✅ Run `npm run validate:quick`
2. ✅ Complete manual checklist
3. ✅ Deploy qa-automation-specialist for complex logic
4. ✅ Run `npm run validate` before phase completion

### Phase 4: Commit & Update
1. Stage all files with `git add`
2. Commit with SOP-compliant message format
3. Update AGENT_ORCHESTRATION_PLAN.md
4. Update todo list with TodoWrite
5. Generate task completion summary

---

## Task Breakdown

### Task 1: Schema Updates (30 min)

**Agent**: typescript-specialist

**Files to Modify**:
- `src/types/config.ts`
- `src/lib/schemas/*.ts` (Zod validation schemas)

**Changes Required**:

```typescript
// CTA interface additions
interface CTA {
  // ... existing fields ...
  target_branch?: string;  // Branch to route to when clicked (navigation CTAs)
  on_completion_branch?: string;  // Branch after form completes (form CTAs)
}

// Form interface additions
interface ConversationalForm {
  // ... existing fields ...
  on_completion_branch?: string;  // Branch to show after successful submission
}

// Global settings additions
interface CTASettings {
  fallback_branch?: string;  // Branch when no match found
  max_ctas_per_response?: number;  // Limit CTAs shown (default: 4)
}

interface TenantConfig {
  // ... existing fields ...
  cta_settings?: CTASettings;
}
```

**Validation Checklist**:
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] No `any` types introduced
- [ ] Zod schemas enforce correct types
- [ ] Fields are optional (backward compatible)
- [ ] Type exports are correct

**Deliverables**:
- Updated TypeScript types
- Updated Zod validation schemas
- No breaking changes to existing configs

---

### Task 2: Lambda Routing Logic (2 hours)

**Agent**: Backend-Engineer

**Files to Modify**:
- `lambda-repo/Bedrock_Streaming_Handler_Staging/response_enhancer.js`

**Changes Required**:

Implement routing hierarchy in `selectCTAsForResponse()` function:

```javascript
/**
 * Select CTAs for response using routing hierarchy
 *
 * Priority:
 * 1. Explicit CTA routing (target_branch)
 * 2. Keyword-based branch detection
 * 3. Fallback branch (if configured)
 * 4. No CTAs
 */
function selectCTAsForResponse(userQuery, bedrockResponse, tenantConfig, requestMetadata = {}) {
    const { conversation_branches, ctas, cta_settings } = tenantConfig;

    // STEP 1: Check for explicit CTA routing (highest priority)
    if (requestMetadata.cta_triggered && requestMetadata.cta_id) {
        const triggeredCTA = ctas[requestMetadata.cta_id];

        if (triggeredCTA?.target_branch) {
            console.log(`🎯 Explicit routing: CTA ${requestMetadata.cta_id} → ${triggeredCTA.target_branch}`);
            return getCtasForBranch(triggeredCTA.target_branch, conversation_branches, ctas);
        }
    }

    // STEP 2: Keyword-based branch detection (for user-typed queries)
    const branchNames = Object.keys(conversation_branches || {});
    const userQueryLower = userQuery.toLowerCase();
    const responseLower = bedrockResponse.toLowerCase();

    for (const branchName of branchNames) {
        const branch = conversation_branches[branchName];

        const userIntentMatch = branch.detection_keywords.some(keyword =>
            userQueryLower.includes(keyword.toLowerCase())
        );

        const responseContextMatch = branch.detection_keywords.some(keyword =>
            responseLower.includes(keyword.toLowerCase())
        );

        if (userIntentMatch || responseContextMatch) {
            console.log(`✓ Branch detected via keywords: ${branchName}`);
            return getCtasForBranch(branchName, conversation_branches, ctas);
        }
    }

    // STEP 3: Fallback branch (if configured)
    if (cta_settings?.fallback_branch) {
        console.log(`⚠️ Using fallback branch: ${cta_settings.fallback_branch}`);
        return getCtasForBranch(cta_settings.fallback_branch, conversation_branches, ctas);
    }

    // STEP 4: No CTAs
    console.log('No branch matched, no fallback configured - returning empty CTAs');
    return [];
}

/**
 * Get CTAs for a specific branch
 */
function getCtasForBranch(branchName, conversation_branches, ctas) {
    const branch = conversation_branches[branchName];
    if (!branch) {
        console.log(`⚠️ Branch not found: ${branchName}`);
        return [];
    }

    const branchCTAs = Object.values(ctas).filter(cta =>
        cta.conversation_branch === branchName
    );

    console.log(`Returning ${branchCTAs.length} CTAs for branch: ${branchName}`);
    return branchCTAs;
}
```

**Validation Checklist**:
- [ ] Lambda packages successfully (`npm run package`)
- [ ] Unit tests created by test-engineer
- [ ] All routing paths tested
- [ ] Logging is comprehensive
- [ ] No breaking changes to existing logic

**Deliverables**:
- Updated response_enhancer.js with routing hierarchy
- Unit tests for routing logic
- Lambda deployment package (deployment.zip)

**Testing Requirements** (test-engineer):
- Explicit routing takes precedence over keywords
- Keyword matching works when no explicit route
- Fallback branch triggers when no match
- Empty array returned when no fallback configured
- Metadata handling is robust

---

### Task 3: Frontend CTA Metadata (1 hour)

**Agent**: Frontend-Engineer

**Files to Modify**:
- `Picasso/src/components/chat/ResponseCard.jsx` (or CTA component)
- `Picasso/src/context/StreamingChatProvider.jsx`
- `Picasso/src/context/HTTPChatProvider.jsx`

**Changes Required**:

```javascript
// In ResponseCard.jsx or CTA component
const handleCTAClick = (cta) => {
    if (cta.action === 'show_info' && cta.bedrock_query) {
        // Send query with metadata for explicit routing
        sendMessage(cta.bedrock_query, {
            cta_triggered: true,
            cta_id: cta.cta_id,
            source_branch: currentBranchId  // Optional: track user journey
        });
    } else if (cta.action === 'start_form') {
        startForm(cta.form_id, {
            on_completion_branch: cta.on_completion_branch
        });
    } else if (cta.action === 'external_link') {
        window.open(cta.url, '_blank');
    }
};

// In ChatProvider - update sendMessage signature
const sendMessage = async (message, metadata = {}) => {
    const payload = {
        query: message,
        tenant_hash: tenantId,
        conversation_id: conversationId,
        metadata: metadata  // Pass through to Lambda
    };

    // Send to Master_Function → Bedrock Handler
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // Process response...
};
```

**Validation Checklist**:
- [ ] Metadata reaches Lambda (verify with CloudWatch logs)
- [ ] No console errors in browser
- [ ] Manual testing with browser dev tools
- [ ] All CTA action types handled
- [ ] Backward compatible with existing CTAs

**Deliverables**:
- Updated CTA click handler
- Updated ChatProvider with metadata support
- Manual test results

---

### Task 4: Form Completion Routing (30 min)

**Agent**: Frontend-Engineer

**Files to Modify**:
- `Picasso/src/context/FormModeContext.jsx`
- `lambda-repo/Master_Function_Staging/lambda_function.py`

**Changes Required**:

```javascript
// In FormModeContext.jsx
const handleFormCompletion = async (formData) => {
    // Submit form to Master_Function
    const response = await submitForm(formData);

    // Show completion message
    setCompletionMessage(response.completion_message);

    // Check for branch routing
    if (response.on_completion_branch) {
        // Trigger Bedrock query to transition to new branch
        const transitionQuery = `Form completed successfully`;
        await sendMessage(transitionQuery, {
            cta_triggered: true,
            force_branch: response.on_completion_branch  // Force specific branch
        });
    }

    // Exit form mode
    exitFormMode();
};
```

```python
# In Master_Function lambda_function.py (form submission handler)
def handle_form_submission(event, tenant_config):
    form_id = event['form_id']
    form_data = event['form_data']

    # Get form definition
    form_def = tenant_config['conversational_forms'][form_id]

    # Process form (email, webhook, etc.)
    # ... existing form processing logic ...

    # Return completion response with routing info
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'completion_message': form_def.get('completion_message', 'Thank you!'),
            'on_completion_branch': form_def.get('on_completion_branch')  # Send to frontend
        })
    }
```

**Validation Checklist**:
- [ ] Form completion triggers branch transition
- [ ] Correct branch CTAs appear after form
- [ ] Works with and without on_completion_branch
- [ ] Completion message displays correctly
- [ ] End-to-end form flow works

**Deliverables**:
- Updated FormModeContext
- Updated Master_Function form handler
- End-to-end test results

---

### Task 5: Config Builder UI (2 hours)

**Agent**: Frontend-Engineer

**Files to Modify**:
- `picasso-config-builder/src/components/ctas/CTAForm.tsx`
- `picasso-config-builder/src/components/settings/GlobalSettings.tsx`

**Changes Required**:

#### A) CTA Editor - Add Target Branch Field

```tsx
// In CTAForm.tsx
import { useConfigStore } from '@/store';

export const CTAForm: React.FC<CTAFormProps> = ({ cta, onChange }) => {
  const branches = useConfigStore((state) => state.branches.branches);

  return (
    <>
      {/* Existing fields: label, action, etc. */}

      {/* Show target_branch for navigation CTAs */}
      {(cta.action === 'show_info' || cta.action === 'bedrock_query') && (
        <FormField
          label="Target Branch"
          helpText="Branch to show after clicking (leave empty for auto-detect via keywords)"
        >
          <Select
            value={cta.target_branch || ''}
            onChange={(e) => onChange({ ...cta, target_branch: e.target.value || undefined })}
          >
            <option value="">Auto-detect from keywords</option>
            {Object.entries(branches).map(([id, branch]) => (
              <option key={id} value={id}>
                {branch.display_name || id}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {/* Show on_completion_branch for form CTAs */}
      {cta.action === 'start_form' && (
        <FormField
          label="After Completion"
          helpText="Branch to show after form is submitted successfully"
        >
          <Select
            value={cta.on_completion_branch || ''}
            onChange={(e) => onChange({ ...cta, on_completion_branch: e.target.value || undefined })}
          >
            <option value="">None (stay in current context)</option>
            {Object.entries(branches).map(([id, branch]) => (
              <option key={id} value={id}>
                {branch.display_name || id}
              </option>
            ))}
          </Select>
        </FormField>
      )}
    </>
  );
};
```

#### B) Global Settings - Add Fallback Branch

```tsx
// In GlobalSettings.tsx (or create CTASettings.tsx)
export const CTASettings: React.FC = () => {
  const branches = useConfigStore((state) => state.branches.branches);
  const ctaSettings = useConfigStore((state) => state.config.baseConfig.cta_settings || {});
  const updateConfig = useConfigStore((state) => state.config.updateConfig);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">CTA Behavior</h3>

      <FormField
        label="Fallback Branch"
        helpText="Show these CTAs when no branch matches user query (recommended: general_help)"
      >
        <Select
          value={ctaSettings.fallback_branch || ''}
          onChange={(e) => updateConfig({
            cta_settings: {
              ...ctaSettings,
              fallback_branch: e.target.value || undefined
            }
          })}
        >
          <option value="">None (no CTAs shown when no match)</option>
          {Object.entries(branches).map(([id, branch]) => (
            <option key={id} value={id}>
              {branch.display_name || id}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Max CTAs Per Response"
        helpText="Maximum number of CTAs to show at once (default: 4)"
      >
        <Input
          type="number"
          min={1}
          max={10}
          value={ctaSettings.max_ctas_per_response || 4}
          onChange={(e) => updateConfig({
            cta_settings: {
              ...ctaSettings,
              max_ctas_per_response: parseInt(e.target.value) || 4
            }
          })}
        />
      </FormField>
    </div>
  );
};
```

**Validation Checklist**:
- [ ] Fields appear in correct context (navigation vs form CTAs)
- [ ] Dropdown shows all available branches
- [ ] Values save to Zustand store
- [ ] Config deploys successfully to S3
- [ ] UI is responsive and accessible
- [ ] No TypeScript errors
- [ ] No console errors

**Deliverables**:
- Updated CTA editor with routing fields
- Updated global settings with fallback configuration
- Build succeeds (`npm run build:production`)
- Deployed to S3

---

## Quality Gates

### Task-Level Gate (Before Marking Task Complete)
- ✅ Automated validation passes (`npm run validate:quick`)
- ✅ Manual checklist complete
- ✅ QA agent validates (for Tasks 2 and 5)
- ✅ All files committed
- ✅ No TypeScript errors
- ✅ No console errors

### Phase-Level Gate (Before Final Deployment)
- ✅ All 5 tasks complete
- ✅ Full validation suite passes (`npm run validate`)
- ✅ Integration tests pass
- ✅ End-to-end testing complete
- ✅ Performance acceptable (<2s load time)
- ✅ AGENT_ORCHESTRATION_PLAN.md updated

---

## Integration Testing Checklist

### Scenario 1: Nav Button → Keyword Match → CTAs
**Setup**: Click "What are your programs?" nav button
**Expected**:
- Bedrock responds with program info
- Keyword "programs" matches `programs_overview` branch
- CTAs for programs appear

### Scenario 2: CTA with Explicit Routing
**Setup**: Click "Learn about Love Box" CTA (has `target_branch: "lovebox_info"`)
**Expected**:
- Query sent with metadata: `{ cta_triggered: true, cta_id: "cta_learn_lovebox" }`
- Lambda uses explicit routing to `lovebox_info` branch
- Love Box enrollment CTAs appear

### Scenario 3: Fallback Branch
**Setup**: User types gibberish query, no keywords match
**Expected**:
- No keyword match found
- Fallback branch `general_help` used
- Generic CTAs appear: [Programs] [Volunteer] [Donate] [Contact]

### Scenario 4: Form Completion Routing
**Setup**: Complete "Enroll in Love Box" form
**Expected**:
- Form submits successfully
- Completion message appears
- Transition to `lovebox_enrolled` branch
- Thank you CTAs appear: [View Programs] [Contact Us]

### Scenario 5: Config Builder Round Trip
**Setup**: Create CTA with `target_branch`, deploy config
**Expected**:
- Field saves in Zustand store
- Config deploys to S3 successfully
- Lambda reads `target_branch` correctly
- Routing works as configured

---

## Commit Message Standards

Each task commit must follow this format:

```
<type>: <subject>

<body>

<footer>
```

### Example Commit Message

```
feat: Add explicit CTA branch routing (Task 2)

Implemented routing hierarchy in response_enhancer.js to support Lex-style
conditional branching:

1. Explicit CTA routing (target_branch) - highest priority
2. Keyword-based branch detection - for user-typed queries
3. Fallback branch - when no match found
4. No CTAs - default behavior

Key Changes:
- Added selectCTAsForResponse() with 4-level routing hierarchy
- Added getCtasForBranch() helper function
- Enhanced logging for debugging routing decisions
- Maintains backward compatibility with keyword-only matching

Agent: Backend-Engineer
Files Modified: 1
Lines of Code: ~80
Validation: ✅ All validations passed

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Success Criteria

### Functional Requirements
- ✅ CTA clicks with `target_branch` route correctly 100% of time
- ✅ Keyword matching works for user-typed queries
- ✅ Fallback branch shows when no match found
- ✅ Form completion transitions work correctly
- ✅ Config Builder fields save and deploy correctly

### Quality Requirements
- ✅ Zero TypeScript errors
- ✅ Zero console errors
- ✅ Test coverage >80% for routing logic
- ✅ All validation gates pass
- ✅ Build size <2MB (production)
- ✅ Load time <2s

### Documentation Requirements
- ✅ Schema changes documented in types
- ✅ Lambda routing logic commented
- ✅ UI fields have helpful tooltips
- ✅ Implementation plan updated with results

---

## Implementation Order

1. **Schema updates** (types + validation) - Foundation for all other tasks
2. **Lambda routing logic** - Core functionality with tests
3. **Frontend metadata passing** - Enable explicit routing
4. **Form completion routing** - Complete the routing flow
5. **Config Builder UI** - Make it configurable by users
6. **Full integration testing** - Validate end-to-end
7. **QA automation validation** - Final quality check

---

## Deployment Steps

### Lambda Deployment
```bash
# Bedrock Streaming Handler
cd lambda-repo/Bedrock_Streaming_Handler_Staging
npm run package
aws lambda update-function-code \
  --function-name Bedrock_Streaming_Handler_Staging \
  --zip-file fileb://deployment.zip \
  --profile ai-developer

# Master Function
cd lambda-repo/Master_Function_Staging
zip -r deployment.zip . -x "*.pyc" -x "__pycache__/*"
aws lambda update-function-code \
  --function-name Master_Function_Staging \
  --zip-file fileb://deployment.zip \
  --profile ai-developer
```

### Frontend Deployment (Picasso)
```bash
cd Picasso
npm run build:production
# Deploy to S3 or hosting platform
```

### Config Builder Deployment
```bash
cd picasso-config-builder
npm run build:production
aws s3 sync dist/ s3://picasso-config-builder-prod/ \
  --profile ai-developer \
  --delete
```

---

## Risk Mitigation

### Risk 1: Breaking Changes to Existing Configs
**Mitigation**: All new fields are optional, backward compatible

### Risk 2: Lambda Metadata Not Reaching Response Enhancer
**Mitigation**: Add comprehensive logging, test with CloudWatch

### Risk 3: UI Complexity Confusing Users
**Mitigation**: Clear tooltips, default to auto-detect (keyword matching)

### Risk 4: Performance Impact from Additional Logic
**Mitigation**: Routing logic is simple O(1) or O(n) operations, minimal impact

---

## Related Documents

- `docs/SOP_DEVELOPMENT_WORKFLOW.md` - Standard workflow being followed
- `docs/WEB_CONFIG_BUILDER_PRD.md` - Product requirements
- `docs/ARCHITECTURE.md` - System architecture
- `AGENT_ORCHESTRATION_PLAN.md` - Agent deployment tracking

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-29 | Initial implementation plan | Claude Code |

---

**Last Updated**: 2025-10-29
**Status**: Ready for Implementation
**Approval**: Awaiting user confirmation to begin
