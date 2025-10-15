# Picasso Config Builder - Zustand Store

This is the central state management system for the Config Builder application. Built with Zustand, Immer, and TypeScript for a type-safe, performant, and developer-friendly experience.

## Architecture Overview

The store is organized into **domain slices** (programs, forms, CTAs, branches, cards) and **cross-cutting slices** (UI, validation, config lifecycle).

```
ConfigBuilderState
├── programs        → Program CRUD operations
├── forms           → Form & field management
├── ctas            → CTA definitions with validation
├── branches        → Conversation routing
├── cardInventory   → Smart cards (read-only for MVP)
├── ui              → Application UI state
├── validation      → Error/warning tracking
└── config          → Load/save/deploy lifecycle
```

### Why This Architecture?

1. **Single Store**: Simplifies data flow and avoids sync issues
2. **Domain Slices**: Each entity type is self-contained
3. **Dependency Tracking**: Cross-slice selectors prevent orphaned references
4. **Validation First**: Real-time validation integrated into all mutations
5. **Optimistic Updates**: UI updates immediately, API calls happen async

## Middleware Stack

```typescript
useConfigStore = create()(
  devtools(      // Redux DevTools integration
    persist(     // LocalStorage for UI preferences only
      immer(     // Immutable updates with mutable syntax
        // Store implementation
      )
    )
  )
)
```

### Immer Integration

All `set()` calls use Immer, so you can write mutations as if mutating state directly:

```typescript
set((state) => {
  state.forms.forms[formId] = newForm;  // Looks mutable, actually immutable!
  state.config.isDirty = true;
})
```

### Persistence Strategy

Only UI preferences are persisted (active tab, sidebar state). **Config data is never persisted** to localStorage - it's always loaded fresh from S3.

## Usage Patterns

### 1. Using Convenience Hooks

```typescript
import { usePrograms, useForms, useUI, useConfig } from '@/store';

function MyComponent() {
  const programs = usePrograms();
  const { addToast } = useUI();
  const { loadConfig, isDirty } = useConfig();

  // Use slice methods directly
  programs.createProgram({
    program_id: 'new-program',
    program_name: 'New Program'
  });
}
```

### 2. Accessing Nested State

```typescript
import { useConfigStore } from '@/store';

function FormEditor({ formId }: { formId: string }) {
  // Select specific form (prevents unnecessary re-renders)
  const form = useConfigStore(state => state.forms.getForm(formId));
  const updateForm = useConfigStore(state => state.forms.updateForm);

  if (!form) return <div>Form not found</div>;

  return <div>{form.title}</div>;
}
```

### 3. Using Selector Hooks

```typescript
import { useForm, useProgram, useAllForms } from '@/store';

function FormList() {
  const allForms = useAllForms();  // Returns array of all forms

  return (
    <ul>
      {allForms.map(form => (
        <li key={form.form_id}>{form.title}</li>
      ))}
    </ul>
  );
}
```

## Domain Slices

### Programs Slice

Manages organizational programs/services.

```typescript
const programs = usePrograms();

// Create
programs.createProgram({
  program_id: 'youth-mentorship',
  program_name: 'Youth Mentorship Program',
  description: 'One-on-one mentorship for at-risk youth'
});

// Update
programs.updateProgram('youth-mentorship', {
  description: 'Updated description'
});

// Delete (checks dependencies first)
programs.deleteProgram('youth-mentorship'); // Will fail if forms reference it

// Duplicate
programs.duplicateProgram('youth-mentorship');

// Get
const program = programs.getProgram('youth-mentorship');
const allPrograms = programs.getAllPrograms();

// Check dependencies
const deps = programs.getProgramDependencies('youth-mentorship');
// Returns: { programs: [], forms: ['form1', 'form2'], ctas: [], branches: [] }
```

### Forms Slice

Manages conversational forms with field collections.

```typescript
const forms = useForms();

// Create
forms.createForm({
  enabled: true,
  form_id: 'volunteer-application',
  program: 'youth-mentorship',
  title: 'Volunteer Application',
  description: 'Apply to become a mentor',
  trigger_phrases: ['apply', 'volunteer', 'sign up'],
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      prompt: 'What is your full name?',
      required: true
    }
  ]
});

// Update form
forms.updateForm('volunteer-application', {
  title: 'New Title'
});

// Field management
forms.addField('volunteer-application', {
  id: 'email',
  type: 'email',
  label: 'Email',
  prompt: 'What is your email address?',
  required: true
});

forms.updateField('volunteer-application', 0, {
  label: 'Full Legal Name'
});

forms.deleteField('volunteer-application', 0);

forms.reorderFields('volunteer-application', 0, 2); // Move field 0 to position 2

// Get forms by program
const programForms = forms.getFormsByProgram('youth-mentorship');
```

### CTAs Slice

Manages call-to-action buttons with action-specific validation.

```typescript
const ctas = useCTAs();

// Create (with automatic validation)
ctas.createCTA({
  label: 'Apply Now',
  action: 'start_form',
  formId: 'volunteer-application',
  type: 'form_trigger',
  style: 'primary'
}, 'apply-cta');

// Update
ctas.updateCTA('apply-cta', {
  label: 'Apply Today!'
});

// Get CTAs by form
const formCTAs = ctas.getCTAsByForm('volunteer-application');

// Action-specific validation
// This will fail if URL is invalid:
ctas.createCTA({
  label: 'Learn More',
  action: 'external_link',
  url: 'not-a-valid-url',  // Validation error!
  type: 'external_link',
  style: 'secondary'
}, 'learn-more-cta');
```

### Branches Slice

Manages conversation routing based on keyword detection.

```typescript
const branches = useBranches();

// Create
branches.createBranch({
  detection_keywords: ['volunteer', 'help', 'mentor'],
  available_ctas: {
    primary: 'apply-cta',
    secondary: ['learn-more-cta', 'contact-cta']
  }
}, 'volunteer-branch');

// Keyword management
branches.addKeyword('volunteer-branch', 'serve');
branches.removeKeyword('volunteer-branch', 'help');

// CTA management
branches.setPrimaryCTA('volunteer-branch', 'different-cta');
branches.addSecondaryCTA('volunteer-branch', 'new-cta');
branches.removeSecondaryCTA('volunteer-branch', 'old-cta');
```

### Card Inventory Slice

Manages smart response cards (mostly read-only for MVP).

```typescript
const cardInventory = useCardInventory();

// Update
cardInventory.updateCardInventory({
  strategy: 'exploration_first',
  readiness_thresholds: {
    show_requirements: 0.2,
    show_programs: 0.4,
    show_cta: 0.6,
    show_forms: 0.8
  }
});

// Get
const cards = cardInventory.getCardInventory();
```

## Cross-Cutting Slices

### UI Slice

Manages application UI state: tabs, modals, toasts, loading states.

```typescript
const ui = useUI();

// Navigation
ui.setActiveTab('forms');
ui.toggleSidebar();

// Editor state
ui.openEditor('forms', 'volunteer-application');
ui.closeEditor();

// Modals
ui.pushModal('delete-confirmation', { entityId: 'form-123' });
ui.popModal();
ui.clearModals();

// Loading states
ui.setLoading('save', true);
ui.setLoading('save', false);

// Toasts
ui.addToast({
  type: 'success',
  message: 'Form saved successfully'
});

ui.addToast({
  type: 'error',
  message: 'Failed to load config',
  duration: 10000  // 10 seconds
});

ui.dismissToast('toast-id');
```

### Validation Slice

Tracks validation errors and warnings across the entire config.

```typescript
const validation = useValidation();

// Run validation
await validation.validateAll();

// Check validation state
const isValid = validation.isValid;
const hasErrors = validation.hasErrors();
const hasWarnings = validation.hasWarnings();

// Get errors for specific entity
const formErrors = validation.getErrorsForEntity('form-volunteer-application');

// Set errors manually (usually done automatically)
validation.setErrors('form-123', [
  { field: 'title', message: 'Title is required', severity: 'error' }
]);

validation.clearErrors('form-123');
```

### Config Slice

Manages configuration lifecycle: load, save, deploy, and merge operations.

```typescript
const config = useConfig();

// Load config from S3
await config.loadConfig('TENANT123');

// Check dirty state
if (config.isDirty) {
  console.log('Unsaved changes exist');
}

// Save config (validates first)
await config.saveConfig();

// Deploy config (validates + saves)
await config.deployConfig();

// Reset to last saved state
config.resetConfig();

// Get merged config (combines all slices back into TenantConfig format)
const mergedConfig = config.getMergedConfig();
```

## Selectors

### Dependency Selectors

Track relationships between entities to prevent orphaned references.

```typescript
import {
  getEntityDependencies,
  canDeleteEntity,
  getDeleteBlockerMessage,
  findOrphanedEntities,
  getConfigStatistics
} from '@/store';

// Check if entity can be deleted
const canDelete = canDeleteEntity(state, 'program', 'youth-mentorship');

// Get human-readable blocker message
const message = getDeleteBlockerMessage(state, 'program', 'youth-mentorship');
// Returns: "Cannot delete: used by 3 form(s)"

// Find all orphaned entities (forms referencing non-existent programs, etc.)
const orphaned = findOrphanedEntities(state);
// Returns: [{ type: 'form', id: 'form-123', issue: 'References non-existent program: deleted-program' }]

// Get statistics
const stats = getConfigStatistics(state);
// Returns: { programs: 5, forms: 12, ctas: 20, branches: 8, totalFields: 48, orphanedEntities: 0 }
```

### Validation Selectors

Query validation state across the entire config.

```typescript
import {
  getAllErrors,
  getErrorCount,
  isConfigDeployable,
  getDeploymentBlockers,
  getValidationSummary
} from '@/store';

// Get all errors
const allErrors = getAllErrors(state);

// Get error count
const errorCount = getErrorCount(state);

// Check if deployable
if (isConfigDeployable(state)) {
  await config.deployConfig();
} else {
  const blockers = getDeploymentBlockers(state);
  console.log('Cannot deploy:', blockers);
  // ['5 validation error(s) must be fixed', '2 orphaned entities detected']
}

// Get summary for dashboard
const summary = getValidationSummary(state);
// Returns: { isValid, errorCount, warningCount, lastValidated, criticalIssues: [...] }
```

## Best Practices

### 1. Use Specific Selectors

Avoid selecting the entire slice if you only need part of it:

```typescript
// Bad: Re-renders on any forms change
const forms = useForms();

// Good: Only re-renders when this specific form changes
const form = useConfigStore(state => state.forms.getForm(formId));
```

### 2. Handle Async Operations Gracefully

All API operations are async and may fail:

```typescript
try {
  await config.loadConfig('TENANT123');
  // Success toast shown automatically
} catch (error) {
  // Error toast shown automatically
  console.error('Failed to load config:', error);
}
```

### 3. Check Dependencies Before Deleting

The store will show an error toast, but you can also check programmatically:

```typescript
const deps = programs.getProgramDependencies('program-id');

if (deps.forms.length > 0) {
  // Show custom UI explaining what needs to be deleted first
} else {
  programs.deleteProgram('program-id');
}
```

### 4. Validate Before Saving

Always validate before deployment:

```typescript
await validation.validateAll();

if (validation.isValid) {
  await config.deployConfig();
} else {
  // Show validation errors in UI
  const errors = validation.errors;
}
```

### 5. Mark Dirty on Manual Changes

If you need to update state directly (rare), remember to mark dirty:

```typescript
set((state) => {
  // Make changes
  state.forms.forms[formId].title = 'New Title';

  // Mark dirty
  state.config.markDirty();
});
```

## Testing

### Mock Store for Tests

```typescript
import { create } from 'zustand';
import type { ConfigBuilderState } from '@/store';

export function createMockStore(initialState?: Partial<ConfigBuilderState>) {
  return create<ConfigBuilderState>()((set, get) => ({
    // Default state
    programs: { programs: {}, /* ... */ },
    forms: { forms: {}, /* ... */ },
    // ... other slices

    // Override with initialState
    ...initialState,
  }));
}
```

### Testing Store Actions

```typescript
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';

test('createProgram adds program and marks dirty', () => {
  const { result } = renderHook(() => useConfigStore());

  act(() => {
    result.current.programs.createProgram({
      program_id: 'test-program',
      program_name: 'Test Program'
    });
  });

  expect(result.current.programs.getProgram('test-program')).toBeDefined();
  expect(result.current.config.isDirty).toBe(true);
});
```

## Performance Considerations

### Selector Optimization

Zustand uses shallow comparison by default. For deep comparisons:

```typescript
import { shallow } from 'zustand/shallow';

const formFields = useConfigStore(
  state => state.forms.getForm(formId)?.fields || [],
  shallow
);
```

### Large Lists

For rendering large lists of entities, use React.memo and specific selectors:

```typescript
const FormListItem = React.memo(({ formId }: { formId: string }) => {
  const form = useConfigStore(state => state.forms.getForm(formId));
  return <div>{form?.title}</div>;
});

function FormList() {
  const formIds = useConfigStore(state => Object.keys(state.forms.forms));

  return (
    <ul>
      {formIds.map(id => <FormListItem key={id} formId={id} />)}
    </ul>
  );
}
```

## Debugging

### Redux DevTools

Open Redux DevTools in your browser to:
- Inspect state changes
- Time-travel debug
- See action history
- Export/import state

### Console Debugging

```typescript
// Get current state
const state = useConfigStore.getState();
console.log('Current state:', state);

// Subscribe to changes
const unsubscribe = useConfigStore.subscribe(
  (state) => console.log('State changed:', state)
);
```

## Migration from Previous Architecture

If you're migrating from a different state management solution:

1. Replace Redux actions with direct slice method calls
2. Replace Redux selectors with Zustand selectors
3. Remove Redux middleware and use Zustand middleware
4. Replace Redux reducers with Immer-based slice implementations
5. Update tests to use Zustand's testing utilities

## Future Enhancements

- **Undo/Redo**: Currently stubbed, can be implemented with history tracking
- **Real-time Collaboration**: Add WebSocket sync for multi-user editing
- **Offline Support**: Cache configs for offline editing
- **Optimistic UI Updates**: Enhance API integration with optimistic updates
- **Advanced Validation**: Schema-based validation with Zod integration

---

**Questions?** Check the [Architecture docs](../../docs/ARCHITECTURE.md) or review the [type definitions](./types.ts).
