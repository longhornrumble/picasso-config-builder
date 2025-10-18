# Editor Migration Guide

**Quick Reference for Refactoring Editors to Generic CRUD Framework**

---

## Quick Start

For each editor you're migrating, follow these 4 steps:

1. Create `{Entity}FormFields.tsx` component
2. Create `{Entity}CardContent.tsx` component
3. Add validation function to `formValidators.ts`
4. Rewrite `{Entity}Editor.tsx` with configuration

**Expected Time per Editor:** 1-2 hours

---

## Step-by-Step Migration Process

### Step 1: Create FormFields Component

**File:** `src/components/editors/{Entity}Editor/{Entity}FormFields.tsx`

**Template:**

```typescript
import React from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import type { {Entity} } from '@/types/config';
import type { FormFieldsProps } from '@/lib/crud/types';

/**
 * {Entity}FormFields Component
 * Domain-specific form fields for creating/editing {entity}s
 */
export const {Entity}FormFields: React.FC<FormFieldsProps<{Entity}>> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
  isEditMode,
}) => {
  return (
    <>
      {/* ID Field - typically disabled in edit mode */}
      <Input
        label="{Entity} ID"
        id="id_field"
        placeholder="e.g., example_id"
        value={value.id_field}
        onChange={(e) => onChange({ ...value, id_field: e.target.value })}
        onBlur={() => onBlur('id_field')}
        error={touched.id_field ? errors.id_field : undefined}
        helperText={
          isEditMode
            ? 'ID cannot be changed'
            : 'Lowercase letters, numbers, underscores'
        }
        disabled={isEditMode}
        required
        autoFocus={!isEditMode}
      />

      {/* Name Field */}
      <Input
        label="{Entity} Name"
        id="name"
        placeholder="e.g., Example Name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        onBlur={() => onBlur('name')}
        error={touched.name ? errors.name : undefined}
        helperText="Display name shown to users"
        required
        autoFocus={isEditMode}
      />

      {/* Additional fields as needed... */}
    </>
  );
};
```

**Key Points:**
- Receives `value`, `onChange`, `errors`, `touched`, `onBlur` from parent
- Only handles rendering, no validation logic
- Use `autoFocus={!isEditMode}` on ID field, `autoFocus={isEditMode}` on first editable field
- Disable ID field in edit mode if ID shouldn't change
- Always call `onBlur(fieldName)` to enable validation error display

---

### Step 2: Create CardContent Component

**File:** `src/components/editors/{Entity}Editor/{Entity}CardContent.tsx`

**Template:**

```typescript
import React from 'react';
import { Badge } from '@/components/ui';
import type { {Entity} } from '@/types/config';
import type { CardContentProps } from '@/lib/crud/types';

/**
 * {Entity}CardContent Component
 * Domain-specific content display for {entity} cards
 */
export const {Entity}CardContent: React.FC<CardContentProps<{Entity}>> = ({
  entity,
  metadata,
}) => {
  return (
    <div className="space-y-3">
      {/* Primary content */}
      {entity.description ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {entity.description}
        </p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No description provided
        </p>
      )}

      {/* Badges, stats, etc. */}
      {metadata?.someCount > 0 && (
        <div>
          <Badge variant="info">
            {metadata.someCount} {metadata.someCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      )}
    </div>
  );
};
```

**Key Points:**
- Only renders card body content
- Header (title, ID) and footer (edit/delete buttons) handled by `EntityList`
- Use `metadata` prop for computed values (counts, derived data)
- Handle empty states gracefully
- Keep it concise - typically 30-60 lines

---

### Step 3: Add Validation Function

**File:** `src/lib/validation/formValidators.ts` (append to existing file)

**Template:**

```typescript
/**
 * Validate a {entity} entity
 *
 * Checks:
 * - Zod schema validation (required fields, format, length)
 * - Duplicate ID check (only in create mode)
 * - [Any other business logic checks]
 */
export function validate{Entity}(
  data: {Entity},
  context: ValidationContext<{Entity}>
): ValidationErrors {
  const errors: ValidationErrors = {};

  try {
    // 1. Validate with Zod schema
    {entity}Schema.parse(data);

    // 2. Check for duplicate ID (only in create mode or if ID changed)
    if (
      (!context.isEditMode || data.id !== context.originalEntity?.id) &&
      context.existingIds.includes(data.id)
    ) {
      errors.id = 'A {entity} with this ID already exists';
    }

    // 3. Additional business logic validation
    if (data.someField && !data.requiredRelatedField) {
      errors.requiredRelatedField = 'Required when someField is set';
    }
  } catch (error) {
    // 4. Convert Zod errors to field errors
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
  }

  return errors;
}
```

**Key Points:**
- Always try Zod schema validation first
- Add business logic checks (duplicates, relationships, etc.)
- Convert Zod errors to `ValidationErrors` format
- Only check duplicate IDs in create mode or if ID changed
- Use `context.isEditMode`, `context.originalEntity`, `context.existingIds`

---

### Step 4: Rewrite Editor Component

**File:** `src/components/editors/{Entity}Editor/{Entity}Editor.tsx`

**Template:**

```typescript
import React from 'react';
import { SomeIcon } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { {Entity}FormFields } from './{Entity}FormFields';
import { {Entity}CardContent } from './{Entity}CardContent';
import { validate{Entity} } from '@/lib/validation/formValidators';
import { use{Entity}s, useConfigStore } from '@/store';
import type { {Entity} } from '@/types/config';
import type { EntityDependencies } from '@/lib/crud/types';

/**
 * {Entity}Editor - {Entity} management interface using generic framework
 *
 * @example
 * ```tsx
 * <{Entity}Editor />
 * ```
 */
export const {Entity}Editor: React.FC = () => {
  // Get store slices
  const {entity}Store = use{Entity}s();
  const relatedEntities = useConfigStore((state) => state.someRelated.entities);

  // Configure the generic editor
  return (
    <EntityEditor<{Entity}>
      config={{
        // Entity metadata
        metadata: {
          entityType: '{entity}',
          entityName: '{Entity}',
          entityNamePlural: '{Entity}s',
          description: 'Brief description of what this entity represents',
        },

        // Empty state configuration
        emptyState: {
          icon: SomeIcon,
          title: 'No {Entity}s Defined',
          description:
            'Description of what {entity}s are and why they are useful...',
          actionText: 'Create First {Entity}',
        },

        // Store and operations
        useStore: () => ({
          entities: {entity}Store.{entity}s,
          createEntity: ({entity}) => {entity}Store.create{Entity}({entity}),
          updateEntity: (id, {entity}) => {entity}Store.update{Entity}(id, {entity}),
          deleteEntity: (id) => {entity}Store.delete{Entity}(id),
          getDependencies: (id): EntityDependencies => {
            // Get dependencies from store
            const deps = {entity}Store.get{Entity}Dependencies(id);

            // Transform to EntityDependencies format
            const relatedNames = deps.relatedIds.map(
              (relatedId) => relatedEntities[relatedId]?.name || relatedId
            );

            return {
              canDelete: deps.relatedIds.length === 0,
              dependentEntities:
                deps.relatedIds.length > 0
                  ? [
                      {
                        type: 'RelatedEntities',
                        ids: deps.relatedIds,
                        names: relatedNames,
                      },
                    ]
                  : [],
            };
          },
        }),

        // Validation
        validation: validate{Entity},

        // ID and name extraction
        getId: ({entity}) => {entity}.id,
        getName: ({entity}) => {entity}.name,

        // Domain-specific components
        FormFields: {Entity}FormFields,
        CardContent: {Entity}CardContent,
      }}
    />
  );
};
```

**Key Points:**
- Import necessary store hooks and types
- Configure all metadata for UI display
- Map store operations to framework expectations
- Transform dependencies from store format to `EntityDependencies` format
- Provide ID and name extractors
- Wire up domain components

---

## Common Patterns

### Handling Array Fields

**Example:** Branches have `detection_keywords` array field

```typescript
// In FormFields component
<div className="w-full">
  <label className="mb-1.5 block text-sm font-medium">
    Detection Keywords
  </label>
  <div className="space-y-2">
    {value.detection_keywords.map((keyword, index) => (
      <div key={index} className="flex gap-2">
        <Input
          value={keyword}
          onChange={(e) => {
            const newKeywords = [...value.detection_keywords];
            newKeywords[index] = e.target.value;
            onChange({ ...value, detection_keywords: newKeywords });
          }}
          placeholder="e.g., volunteer"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newKeywords = value.detection_keywords.filter((_, i) => i !== index);
            onChange({ ...value, detection_keywords: newKeywords });
          }}
        >
          Remove
        </Button>
      </div>
    ))}
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        onChange({
          ...value,
          detection_keywords: [...value.detection_keywords, ''],
        });
      }}
    >
      Add Keyword
    </Button>
  </div>
</div>
```

### Conditional Fields Based on Selection

**Example:** CTAs have different fields based on `action` type

```typescript
// In FormFields component
<Select
  label="Action"
  value={value.action}
  onChange={(e) => onChange({ ...value, action: e.target.value })}
  options={[
    { value: 'start_form', label: 'Start Form' },
    { value: 'external_link', label: 'External Link' },
    { value: 'send_query', label: 'Send Query' },
  ]}
/>

{/* Conditional field for start_form action */}
{value.action === 'start_form' && (
  <Select
    label="Form"
    value={value.formId || ''}
    onChange={(e) => onChange({ ...value, formId: e.target.value })}
    options={formOptions}
    required
  />
)}

{/* Conditional field for external_link action */}
{value.action === 'external_link' && (
  <Input
    label="URL"
    value={value.url || ''}
    onChange={(e) => onChange({ ...value, url: e.target.value })}
    placeholder="https://example.com"
    required
  />
)}
```

### Select Dropdowns with Dynamic Options

**Example:** Forms need to select from available programs

```typescript
// In Editor component
const programs = useConfigStore((state) => state.programs.programs);

const programOptions = Object.values(programs).map((program) => ({
  value: program.program_id,
  label: program.program_name,
}));

// Pass as metadata to FormFields if needed
// Or access store directly in FormFields component
```

```typescript
// In FormFields component
const programs = useConfigStore((state) => state.programs.programs);

const programOptions = Object.values(programs).map((program) => ({
  value: program.program_id,
  label: program.program_name,
}));

<Select
  label="Program"
  value={value.program}
  onChange={(e) => onChange({ ...value, program: e.target.value })}
  options={programOptions}
  required
/>
```

### Computed Metadata for Cards

**Example:** Show count of related entities on card

```typescript
// In Editor component's CardContent configuration
// (This is handled automatically by EntityList, but you can access it)

// In CardContent component
export const BranchCardContent: React.FC<CardContentProps<ConversationBranch>> = ({
  entity: branch,
  metadata,
}) => {
  const keywordCount = branch.detection_keywords.length;
  const primaryCTA = branch.available_ctas?.primary;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Badge variant="info">{keywordCount} keywords</Badge>
        {primaryCTA && <Badge variant="success">Primary CTA: {primaryCTA}</Badge>}
      </div>
    </div>
  );
};
```

---

## Dependency Transformation Pattern

The framework expects `EntityDependencies` but your store likely returns a simpler format.

**Store Format (typical):**
```typescript
interface Dependencies {
  forms: string[];  // Just IDs
  branches: string[];
}
```

**Framework Format (required):**
```typescript
interface EntityDependencies {
  canDelete: boolean;
  dependentEntities: {
    type: string;        // Display name (e.g., "Forms")
    ids: string[];       // IDs
    names: string[];     // Human-readable names
  }[];
}
```

**Transformation Code:**
```typescript
getDependencies: (id): EntityDependencies => {
  // 1. Get dependencies from store
  const deps = programsStore.getProgramDependencies(id);

  // 2. Get human-readable names
  const formNames = deps.forms.map(
    (formId) => forms[formId]?.title || formId
  );

  // 3. Return in framework format
  return {
    canDelete: deps.forms.length === 0,
    dependentEntities:
      deps.forms.length > 0
        ? [
            {
              type: 'Forms',
              ids: deps.forms,
              names: formNames,
            },
          ]
        : [],
  };
}
```

**Multiple Dependency Types:**
```typescript
getDependencies: (id): EntityDependencies => {
  const deps = branchStore.getBranchDependencies(id);

  const formNames = deps.forms.map((id) => forms[id]?.title || id);
  const cardNames = deps.cards.map((id) => cards[id]?.title || id);

  const dependentEntities = [];

  if (deps.forms.length > 0) {
    dependentEntities.push({
      type: 'Forms',
      ids: deps.forms,
      names: formNames,
    });
  }

  if (deps.cards.length > 0) {
    dependentEntities.push({
      type: 'Cards',
      ids: deps.cards,
      names: cardNames,
    });
  }

  return {
    canDelete: dependentEntities.length === 0,
    dependentEntities,
  };
}
```

---

## Validation Tips

### When to Check for Duplicates

```typescript
// Only check duplicates in create mode OR if ID changed
if (
  (!context.isEditMode || data.id !== context.originalEntity?.id) &&
  context.existingIds.includes(data.id)
) {
  errors.id = 'Duplicate ID';
}
```

### Cross-Field Validation

```typescript
// Example: formId required when action is 'start_form'
if (data.action === 'start_form' && !data.formId) {
  errors.formId = 'Form ID is required for start_form action';
}
```

### Array Field Validation

```typescript
// Example: At least one keyword required
if (!data.detection_keywords || data.detection_keywords.length === 0) {
  errors.detection_keywords = 'At least one keyword is required';
}
```

### Nested Object Validation

```typescript
// Example: Primary CTA must be set
if (!data.available_ctas?.primary) {
  errors.primary_cta = 'Primary CTA is required';
}
```

---

## Testing Checklist

For each migrated editor:

### Functionality Tests

- [ ] **Create:**
  - [ ] Valid data creates entity successfully
  - [ ] Duplicate ID is rejected
  - [ ] Required fields are enforced
  - [ ] Toast notification shown on success

- [ ] **Update:**
  - [ ] Edit form pre-populates correctly
  - [ ] ID field disabled (if applicable)
  - [ ] Changes save successfully
  - [ ] Toast notification shown on success

- [ ] **Delete:**
  - [ ] Delete without dependencies succeeds
  - [ ] Delete with dependencies is blocked
  - [ ] Dependent entity names displayed correctly
  - [ ] Toast notification shown on success

### Validation Tests

- [ ] **Required Fields:**
  - [ ] Red border shown on blur if empty
  - [ ] Error message displays below field
  - [ ] Save button triggers validation

- [ ] **Duplicate IDs:**
  - [ ] Create mode rejects existing ID
  - [ ] Edit mode allows keeping same ID
  - [ ] Edit mode rejects changing to existing ID

- [ ] **Business Logic:**
  - [ ] Cross-field validation works
  - [ ] Conditional requirements enforced
  - [ ] Array field validation works

### UI Tests

- [ ] **Empty State:**
  - [ ] Shows when no entities exist
  - [ ] Icon, title, description display correctly
  - [ ] "Create" button opens form

- [ ] **List Display:**
  - [ ] Cards display in responsive grid
  - [ ] ID shown in card header
  - [ ] Name shown in card header
  - [ ] CardContent displays correctly
  - [ ] Edit/Delete buttons work

- [ ] **Form Modal:**
  - [ ] Opens on "Create" click
  - [ ] Opens on "Edit" click
  - [ ] Pre-populates in edit mode
  - [ ] Closes on "Cancel"
  - [ ] Closes on successful save
  - [ ] Escape key closes modal

- [ ] **Delete Modal:**
  - [ ] Opens on "Delete" click
  - [ ] Shows entity name
  - [ ] Shows dependencies (if any)
  - [ ] Blocks deletion with dependencies
  - [ ] Allows deletion without dependencies
  - [ ] Closes on "Cancel"
  - [ ] Closes on successful delete

### Responsive Tests

- [ ] Mobile (< 768px): 1 column grid
- [ ] Tablet (768-1024px): 2 column grid
- [ ] Desktop (> 1024px): 3 column grid
- [ ] Form modal responsive on all sizes

---

## Common Issues & Solutions

### Issue 1: Type Error on Dependencies

**Error:** `Type 'Dependencies' is missing properties from 'EntityDependencies'`

**Solution:** Transform dependencies in `getDependencies`:
```typescript
getDependencies: (id): EntityDependencies => {
  const deps = store.getDependencies(id);
  return {
    canDelete: deps.someArray.length === 0,
    dependentEntities: deps.someArray.length > 0 ? [
      { type: 'SomeType', ids: deps.someArray, names: [...] }
    ] : [],
  };
}
```

### Issue 2: Validation Not Triggering

**Problem:** Errors don't show on blur

**Solution:** Ensure `onBlur` called with field name:
```typescript
<Input
  onBlur={() => onBlur('fieldName')}  // Must call with field name!
/>
```

### Issue 3: Form Not Closing After Save

**Problem:** Modal stays open after successful save

**Solution:** Verify store operations are synchronous or await promises:
```typescript
// If store operation is async:
createEntity: async (entity) => {
  await store.createEntity(entity);
}
```

### Issue 4: ID Field Editable in Edit Mode

**Problem:** ID should be immutable but can be edited

**Solution:** Set `disabled={isEditMode}` on ID field:
```typescript
<Input
  disabled={isEditMode}
  helperText={isEditMode ? 'ID cannot be changed' : 'Lowercase...'}
/>
```

### Issue 5: Array Field Errors Not Showing

**Problem:** Array field validation errors not displayed

**Solution:** Use top-level error for array fields:
```typescript
// In validator:
if (!data.arrayField || data.arrayField.length === 0) {
  errors.arrayField = 'At least one item required';
}

// In FormFields:
{touched.arrayField && errors.arrayField && (
  <p className="text-sm text-red-600">{errors.arrayField}</p>
)}
```

---

## Remaining Editors

### Branches Editor

**Complexity:** Medium-High
**Estimated Time:** 1.5 hours

**Key Challenges:**
- Separate ID pattern (`branch-{tenantId}-{name}`)
- Array field for keywords
- Multiple CTA references (primary, secondary, tertiary)

**Files to Create:**
- `src/components/editors/BranchesEditor/BranchFormFields.tsx` (~120 lines)
- `src/components/editors/BranchesEditor/BranchCardContent.tsx` (~60 lines)
- `src/components/editors/BranchesEditor/BranchesEditor.tsx` (~100 lines)
- Add `validateBranch()` to `formValidators.ts` (~50 lines)

### CTAs Editor

**Complexity:** Medium
**Estimated Time:** 1 hour

**Key Challenges:**
- Conditional fields based on action type
- Action-specific validation

**Files to Create:**
- `src/components/editors/CTAsEditor/CTAFormFields.tsx` (~100 lines)
- `src/components/editors/CTAsEditor/CTACardContent.tsx` (~50 lines)
- `src/components/editors/CTAsEditor/CTAsEditor.tsx` (~95 lines)
- Add `validateCTA()` to `formValidators.ts` (~50 lines)

### Forms Editor

**Complexity:** High
**Estimated Time:** 2 hours

**Key Challenges:**
- Most complex entity type
- Nested field management (array of field objects)
- Field type selection with different options per type
- Program reference

**Files to Create:**
- `src/components/editors/FormsEditor/FormFormFields.tsx` (~150 lines)
- `src/components/editors/FormsEditor/FormCardContent.tsx` (~70 lines)
- `src/components/editors/FormsEditor/FormsEditor.tsx` (~120 lines)
- Add `validateForm()` to `formValidators.ts` (~70 lines)
- Possibly: `FieldEditor.tsx` for nested field CRUD (~100 lines)

---

## Quick Reference

### Import Statements

```typescript
// Generic framework
import { EntityEditor } from '../generic/EntityEditor';
import type { EntityDependencies, FormFieldsProps, CardContentProps } from '@/lib/crud/types';

// Validation
import { validate{Entity} } from '@/lib/validation/formValidators';
import type { ValidationErrors, ValidationContext } from '@/types/validation';

// Store
import { use{Entity}s, useConfigStore } from '@/store';

// Types
import type { {Entity} } from '@/types/config';

// UI components
import { Input, Textarea, Select, Button, Badge } from '@/components/ui';

// Icons
import { SomeIcon } from 'lucide-react';
```

### Validation Function Signature

```typescript
export function validate{Entity}(
  data: {Entity},
  context: ValidationContext<{Entity}>
): ValidationErrors
```

### FormFields Props

```typescript
interface FormFieldsProps<T extends BaseEntity> {
  value: T;
  onChange: (value: T) => void;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
  isEditMode: boolean;
}
```

### CardContent Props

```typescript
interface CardContentProps<T extends BaseEntity> {
  entity: T;
  metadata?: Record<string, unknown>;
}
```

---

## Summary

The generic CRUD framework reduces each editor to:

1. **FormFields Component** (~80-150 lines) - Just render inputs
2. **CardContent Component** (~45-70 lines) - Just display data
3. **Validation Function** (~50-70 lines) - Zod + business logic
4. **Editor Configuration** (~90-120 lines) - Wire it all together

**Total:** ~265-410 lines per editor (down from ~200-350 lines of duplicated code)

The upfront investment is slightly higher, but you get:
- ✅ Zero duplication
- ✅ Type safety
- ✅ Consistent behavior
- ✅ Easier maintenance
- ✅ Reusable patterns

---

**Last Updated:** October 16, 2025
**Framework Version:** 1.0.0
