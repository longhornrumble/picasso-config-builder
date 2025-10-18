# Integration Test Fixes Required

## Issues Identified

### 1. Store Reset Issue
**Problem:** Tests attempt to directly assign to read-only store properties
```typescript
// WRONG:
result.current.programs.programs = {};

// CORRECT:
resetConfigStore(useConfigStore);
```

**Solution:** Use the `resetConfigStore()` helper function created in `testUtils.ts`

**Files to Fix:**
- ctaBranchWorkflow.test.tsx
- validationPipeline.test.tsx
- errorHandling.test.tsx
- edgeCases.test.tsx

### 2. Method Name Issues
**Problem:** Tests use incorrect method names
```typescript
// WRONG:
await result.current.config.loadFromS3('TENANT_ID');
await result.current.config.saveToS3();
await result.current.config.deployToS3();

// CORRECT:
await result.current.config.loadConfig('TENANT_ID');
await result.current.config.saveConfig();
await result.current.config.deployConfig();
```

**Files to Fix:**
- deploymentWorkflow.test.tsx
- errorHandling.test.tsx
- edgeCases.test.tsx

### 3. Mock Implementation Issues
**Problem:** Vitest mocking syntax incorrect
```typescript
// WRONG:
vi.mocked(configOps.loadConfig).mockImplementation(...)

// CORRECT:
// Need to check if module is properly mocked or use different mocking approach
```

**Solution:** Either:
- Use `vi.spyOn` instead of `vi.mocked`
- Or ensure the module mock is set up correctly

**Files to Fix:**
- deploymentWorkflow.test.tsx
- errorHandling.test.tsx
- edgeCases.test.tsx

### 4. Config Structure Mismatch
**Problem:** Mock configs use incorrect property names
```typescript
// WRONG:
config.ctas // This might be incorrect

// CORRECT:
config.cta_definitions // Check actual schema
config.conversation_branches // Not just branches
```

**Files to Check:**
- All files using `createTestTenantConfig`

### 5. Validation State Access
**Problem:** Some tests assume validation results exist immediately
```typescript
// May need to wait for validation to complete
act(() => {
  result.current.validation.validateAll();
});
// Results may not be immediately available
```

## Fix Strategy

### Phase 1: Update All Test Files with resetConfigStore

```typescript
import { resetConfigStore } from './testUtils';

beforeEach(() => {
  resetIdCounter();
  resetConfigStore(useConfigStore);
});
```

### Phase 2: Fix Method Names in Deployment Tests

Replace all instances:
- `loadFromS3` → `loadConfig`
- `saveToS3` → `saveConfig`
- `deployToS3` → `deployConfig`

### Phase 3: Fix Mocking Approach

Option A - Use vi.spyOn:
```typescript
const loadConfigSpy = vi.spyOn(configOps, 'loadConfig');
loadConfigSpy.mockImplementation((tenantId) => mockS3.loadConfig(tenantId));
```

Option B - Direct module mock:
```typescript
vi.mock('@/lib/api/config-operations', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  deployConfig: vi.fn(),
  // ...
}));
```

### Phase 4: Verify Config Schema

Check `src/types/config.ts` for correct property names:
- `conversational_forms` or `forms`?
- `cta_definitions` or `ctas`?
- `conversation_branches` or `routing.conversation_branches`?

Update mock factories accordingly.

## Quick Fix Script

```bash
# Run this in picasso-config-builder directory

# 1. Update imports
find src/__tests__/integration -name "*.test.tsx" -exec sed -i '' 's/resetIdCounter,$/resetIdCounter,\\n  resetConfigStore,/g' {} \\;

# 2. Fix method names
find src/__tests__/integration -name "*.test.tsx" -exec sed -i '' 's/loadFromS3/loadConfig/g' {} \\;
find src/__tests__/integration -name "*.test.tsx" -exec sed -i '' 's/saveToS3/saveConfig/g' {} \\;
find src/__tests__/integration -name "*.test.tsx" -exec sed -i '' 's/deployToS3/deployConfig/g' {} \\;

# 3. Update beforeEach blocks (requires manual review)
```

## Test Coverage Summary (Once Fixed)

### Complete Workflows (6 tests)
1. ✅ Form creation with all field types
2. ✅ CTA creation with all action types
3. ✅ Branch creation with keyword management
4. ✅ Validation pipeline end-to-end
5. ✅ Deployment with S3 mocks
6. ✅ Error handling workflows

### Integration Scenarios (23+ tests)
- Form field management (add, update, delete, reorder)
- CTA and branch assignment
- Dependency validation
- Cross-entity validation
- S3 operations (load, save, deploy)
- Multi-tenant handling
- Backup creation

### Error Handling (13 tests)
- S3 load failures
- Network timeouts
- Validation blocking deployment
- Missing references
- Invalid config structure
- Circular dependencies
- Concurrent modifications

### Edge Cases (16 tests)
- Empty configs
- Large configs (20+ forms, 30+ CTAs)
- Missing references
- Malformed data
- Special characters
- Very long strings
- Unicode and emoji
- Zero-length arrays
- Rapid updates

## Total Test Count: ~30 Integration Tests

Once fixed, these tests will provide comprehensive coverage of:
- Complete user workflows
- Multi-step operations
- State management across slices
- API integration (mocked)
- Error recovery
- Edge cases and boundary conditions
