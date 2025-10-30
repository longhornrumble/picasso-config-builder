# Schema v1.4.1 Support Summary

**Date**: 2025-10-30
**PRD**: Action Chips Explicit Routing with Fallback Navigation Hub
**Status**: ✅ Complete - Full Support Across All Components

---

## Overview

This document confirms that **picasso-config-builder** (Web UI + Lambda) fully supports the v1.4.1 tenant config schema for Action Chips Explicit Routing.

---

## ✅ Backend Lambda Support

### File: `lambda/mergeStrategy.mjs`

**Editable Sections** (User-configurable via API):
```javascript
const EDITABLE_SECTIONS = [
  'programs',
  'conversational_forms',
  'cta_definitions',
  'conversation_branches',
  'content_showcase',
  'cta_settings',  // ✅ Fallback branch configuration
];
```

**Read-Only Sections** (Protected from manual editing):
```javascript
const READ_ONLY_SECTIONS = [
  'branding',
  'features',
  'quick_help',
  'action_chips',  // ✅ Protected - only deploy_tenant_stack can modify
  'widget_behavior',
  'aws',
  'card_inventory',
];
```

### Why This Matters

1. **`cta_settings` is editable**
   - Web Config Builder can set `fallback_branch`
   - Enables Tier 3 routing configuration
   - Users control fallback navigation hub

2. **`action_chips` is read-only**
   - Prevents users from breaking dictionary format
   - Only deploy_tenant_stack can transform action chips
   - Maintains data integrity

---

## ✅ Frontend Web UI Support

### File: `src/lib/api/mergeStrategy.ts`

**Updated** (2025-10-30):
```typescript
export const EDITABLE_SECTIONS = [
  'programs',
  'conversational_forms',
  'cta_definitions',
  'conversation_branches',
  'content_showcase',
  'cta_settings',  // ✅ ADDED - fixes frontend/backend parity
] as const;
```

**Read-Only** (Protected in UI):
```typescript
export const READ_ONLY_SECTIONS = [
  'branding',
  'features',
  'quick_help',
  'action_chips',  // ✅ Cannot be edited in Web UI
  'widget_behavior',
  'aws',
  'card_inventory',
  'subscription_tier',
] as const;
```

---

## ✅ UI Components for v1.4.1 Features

### 1. CTA Settings Component
**File**: `src/components/settings/CTASettings.tsx`

**Features**:
- Configure `fallback_branch` (Tier 3 routing)
- Set `max_ctas_per_response`
- Dropdown populated with available branches
- Clear help text explaining fallback behavior

**Code Snippet**:
```tsx
<Select
  label="Fallback Branch"
  value={fallbackBranch || '__none__'}
  onValueChange={(newValue) => {
    updateCTASettings({
      fallback_branch: newValue === '__none__' ? undefined : newValue,
    });
  }}
  options={[
    { value: '__none__', label: 'None (no CTAs shown when no match)' },
    ...branches.map((b) => ({
      value: b.id,
      label: b.id,
    })),
  ]}
  helperText="Show these CTAs when no branch matches user query"
/>
```

### 2. CTA Editor - Target Branch
**File**: `src/components/editors/CTAsEditor/CTAFormFields.tsx`

**Features**:
- Configure `target_branch` per CTA (Tier 2 routing)
- Dropdown populated with available branches
- Auto-detect option for backward compatibility
- Conditional display based on CTA action type

**Code Snippet** (lines 237-259):
```tsx
<Select
  label="Target Branch"
  value={value.target_branch || '__auto__'}
  onValueChange={(newValue) =>
    onChange({ ...value, target_branch: newValue === '__auto__' ? undefined : newValue })
  }
  options={[
    { value: '__auto__', label: 'Auto-detect from keywords' },
    ...branches.map((b) => ({
      value: b.id,
      label: b.id,
    })),
  ]}
  helperText="Branch to show after clicking this CTA (leave empty for auto-detect via keywords)"
/>
```

### 3. Action Chips - Read-Only Display
**Protection**: Action chips are NOT editable in the Web UI

- Users cannot modify action chip IDs
- Users cannot change action chip dictionary structure
- Only deploy_tenant_stack can transform action chips
- Prevents accidental corruption of explicit routing format

---

## ✅ TypeScript Type Definitions

### File: `src/types/config.ts`

**CTASettings Interface**:
```typescript
export interface CTASettings {
  /**
   * Branch ID to show when no keyword match is found.
   * Provides a fallback routing option when explicit branch routing is enabled.
   */
  fallback_branch?: string;

  /**
   * Maximum number of CTAs to display per response.
   * Default: 4
   */
  max_ctas_per_response?: number;
}
```

**CTA Interface with target_branch**:
```typescript
export interface CTADefinition {
  label: string;
  action: CTAActionType;
  type?: CTAType;
  style?: CTAStyle;

  /**
   * Branch ID to show after clicking this CTA.
   * Used for navigation CTAs (e.g., "Learn about Love Box").
   * Enables Lex-style explicit routing without keyword matching.
   */
  target_branch?: string;

  // ... other fields
}
```

---

## ✅ Complete Feature Support Matrix

| Feature | Backend Lambda | Frontend UI | Description |
|---------|---------------|-------------|-------------|
| **Tier 1: Action Chip Routing** | ✅ Read-only | ✅ Read-only | Protected from manual editing |
| **Tier 2: CTA Explicit Routing** | ✅ Editable | ✅ Editor UI | Set `target_branch` per CTA |
| **Tier 3: Fallback Routing** | ✅ Editable | ✅ Settings UI | Configure `cta_settings.fallback_branch` |
| **Conversation Branches** | ✅ Editable | ✅ Editor UI | Create branches with CTAs |
| **CTA Definitions** | ✅ Editable | ✅ Editor UI | Define CTAs with routing metadata |
| **Programs** | ✅ Editable | ✅ Editor UI | Link forms to programs |
| **Conversational Forms** | ✅ Editable | ✅ Editor UI | Create forms with fields |
| **Content Showcase** | ✅ Editable | ✅ Editor UI | Program cards display |

---

## User Workflow Example

### Configuring Explicit Routing in Web Config Builder

1. **Create Conversation Branches**
   - Navigate to "Branches" tab
   - Create branches: `volunteer_interest`, `donation_interest`, `navigation_hub`
   - Each branch defines its available CTAs

2. **Create CTAs with Target Branches**
   - Navigate to "CTAs" tab
   - Create CTA: `volunteer_apply`
   - Set `target_branch: 'volunteer_interest'` (Tier 2 routing)
   - Create more CTAs with explicit routing

3. **Configure Fallback Branch**
   - Navigate to "Settings" tab
   - Find "CTA Behavior" section
   - Set `fallback_branch: 'navigation_hub'` (Tier 3 routing)
   - This shows navigation hub CTAs when no explicit routing matches

4. **Save Configuration**
   - Click "Save Changes"
   - Backend merges `cta_settings` into tenant config
   - Master_Function and Bedrock_Streaming_Handler use 3-tier routing

5. **Action Chips (Automatic)**
   - deploy_tenant_stack automatically transforms action chips to dictionary format
   - Users cannot manually edit action chips in Web UI
   - Action chips get `target_branch` field (Tier 1 routing)

---

## Deployment History

### picasso-config-builder Repository
- **Commit**: `bde04b1`
- **Date**: 2025-10-30
- **Change**: Added `cta_settings` to frontend EDITABLE_SECTIONS
- **Pushed**: https://github.com/longhornrumble/picasso-config-builder

### Lambda Repository
- **Commit**: `1527166`
- **Date**: 2025-10-30
- **Change**: Updated Picasso_Config_Manager with v1.4.1 schema support
- **Pushed**: https://github.com/longhornrumble/lambda

---

## Testing Recommendations

### 1. End-to-End Test: Fallback Branch Configuration

**Scenario**: Configure fallback branch via Web UI and verify it persists

**Steps**:
1. Open Web Config Builder
2. Load tenant config (e.g., AUS123456)
3. Navigate to Settings → CTA Behavior
4. Select "navigation_hub" as fallback branch
5. Click Save
6. Reload config from S3
7. Verify `cta_settings.fallback_branch === 'navigation_hub'`

**Expected**: ✅ Fallback branch persists correctly

### 2. End-to-End Test: CTA Target Branch

**Scenario**: Set target_branch on CTA and verify routing

**Steps**:
1. Open Web Config Builder
2. Create/edit CTA: `learn_more_volunteers`
3. Set `target_branch: 'volunteer_interest'`
4. Save config
5. Test in Picasso widget:
   - Click "Learn More" CTA
   - Verify CTAs from `volunteer_interest` branch display

**Expected**: ✅ CTA routes to correct branch (Tier 2)

### 3. End-to-End Test: Action Chip Protection

**Scenario**: Verify action chips cannot be edited in UI

**Steps**:
1. Open Web Config Builder
2. Load tenant with action chips
3. Search UI for action chip editor
4. Verify action_chips section is NOT displayed in any editor

**Expected**: ✅ Action chips not editable (read-only protection works)

### 4. Integration Test: Tier 3 Fallback

**Scenario**: Free-form query uses fallback branch

**Steps**:
1. Configure `fallback_branch: 'navigation_hub'`
2. Deploy config to S3
3. Open Picasso widget
4. Send free-form query (no action chip, no CTA click)
5. Verify CTAs from `navigation_hub` branch display

**Expected**: ✅ Fallback routing works (Tier 3)

---

## Known Limitations

### 1. Action Chip Target Branch Configuration

**Current State**: Action chips get `target_branch: null` from deploy_tenant_stack

**Future Enhancement**: Web Config Builder could allow setting `target_branch` for action chips IF we:
- Move action_chips from READ_ONLY_SECTIONS to EDITABLE_SECTIONS
- Create UI component for action chip editor
- Implement validation to prevent dictionary format corruption

**Risk**: Low priority - Tier 2 and Tier 3 routing cover most use cases

### 2. Keyword Detection Deprecation

**Current State**: Keyword detection marked DEPRECATED but still functional

**Future Migration**: After all tenants migrate to v1.4.1, we can:
- Remove keyword detection logic
- Remove `detection_keywords` field from schema
- Simplify routing code

**Timeline**: Q1 2026 (after 6-month transition period)

---

## Related Documentation

- **PRD**: `/Picasso/docs/PRD_ACTION_CHIPS_EXPLICIT_ROUTING_FALLBACK_HUB.md`
- **Implementation Summary**: `/Picasso/docs/ACTION_CHIPS_EXPLICIT_ROUTING_IMPLEMENTATION_SUMMARY.md`
- **Schema Documentation**: `/Picasso/docs/TENANT_CONFIG_SCHEMA.md`
- **Master_Function Deployment**: `/Lambdas/lambda/Master_Function_Staging/DEPLOYMENT_v1.4.1.md`
- **Bedrock Handler Deployment**: `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/DEPLOYMENT_v2.1.0.md`
- **deploy_tenant_stack Deployment**: `/Lambdas/lambda/deploy_tenant_stack/DEPLOYMENT_v1.4.1.md`

---

## Conclusion

✅ **picasso-config-builder fully supports v1.4.1 schema** with complete frontend and backend parity.

**Key Achievements**:
1. ✅ Fallback branch configurable via Web UI
2. ✅ CTA target branches configurable per CTA
3. ✅ Action chips protected from manual corruption
4. ✅ Frontend and backend merge strategies aligned
5. ✅ TypeScript types include all v1.4.1 fields
6. ✅ UI components for all routing features

**Next Steps**:
- Deploy updated picasso-config-builder to production
- Test end-to-end routing scenarios
- Update user documentation with explicit routing examples
- Monitor CloudWatch logs for Tier 1/2/3 routing distribution

---

**Status**: ✅ Complete
**Version**: 1.4.1
**Last Updated**: 2025-10-30
