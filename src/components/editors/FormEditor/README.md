# FormEditor Component

The FormEditor is the most complex editor in the Picasso Config Builder, responsible for managing conversational forms with dynamic field management, multiple field types, and post-submission configuration.

## Components

### FormEditor (Main Container)
Main container component that manages CRUD operations for conversational forms.

**Usage:**
```tsx
import { FormEditor } from '@/components/editors/FormEditor';

<FormEditor />
```

**Features:**
- Create, read, update, delete forms
- Empty state when no forms exist
- Dependency checking before deletion
- Integration with Zustand store

### FormList
Grid display component that renders forms in a responsive layout (1-3 columns).

**Props:**
- `forms`: Array of form objects with IDs
- `programs`: Programs lookup for displaying program names
- `onEdit`: Edit callback
- `onDelete`: Delete callback

### FormCard
Individual form display card showing key information.

**Displays:**
- Form title and description
- Enabled/disabled status
- Program badge
- Field count
- First 3 trigger phrases
- Optional CTA text
- Edit and Delete actions

### FormForm (Main Modal)
Large modal form for creating/editing forms with extensive configuration options.

**Features:**
- Form ID auto-generation from title
- Program selection (required in v1.3+)
- Title, description, CTA text
- Trigger phrases array input
- Fields management via FieldsManager
- Post-submission configuration (collapsible)
- Real-time Zod validation
- Programs availability check

### FieldsManager
Component for managing the fields array within a form.

**Features:**
- Add, edit, delete fields
- Reorder fields with up/down arrows
- Field type badges (text, email, phone, select, etc.)
- Required and eligibility gate indicators
- Empty state when no fields
- Opens FieldEditor modal for field CRUD

### FieldEditor (Nested Modal)
Nested modal for creating/editing individual form fields.

**Features:**
- Field ID auto-generation from label
- Field type selection (text, email, phone, select, textarea, number, date)
- Label, prompt, hint inputs
- Required checkbox
- **Conditional rendering:**
  - Options array for select fields (min 2 options)
  - Failure message for eligibility gates
- Real-time Zod validation

**Field Types:**
- `text`: Single-line text input
- `email`: Email validation
- `phone`: Phone number input
- `select`: Dropdown with custom options
- `textarea`: Multi-line text input
- `number`: Numeric input
- `date`: Date picker

### PostSubmissionSection
Collapsible section for configuring post-submission behavior.

**Current Status:**
- Basic confirmation message input
- Placeholder for advanced features (Phase 2)
- Future features: next steps, actions, fulfillment methods

**Planned Features (Phase 2):**
- Next steps array
- Post-submission actions (start form, external link, etc.)
- Fulfillment methods (email, webhook, DynamoDB, Google Sheets)

### DeleteConfirmation
Modal for confirming form deletion with dependency checking.

**Features:**
- Shows form details
- Checks for dependent CTAs
- Prevents deletion if dependencies exist
- Lists all dependent CTA names
- Warning about permanent deletion

## Field Type Specifications

### Text Field
Standard single-line text input.

**Schema:**
```typescript
{
  id: "full_name",
  type: "text",
  label: "Full Name",
  prompt: "What is your full name?",
  required: true
}
```

### Email Field
Validates email format.

**Schema:**
```typescript
{
  id: "email_address",
  type: "email",
  label: "Email Address",
  prompt: "What is your email address?",
  required: true
}
```

### Select Field
Dropdown with custom options (requires `options` array).

**Schema:**
```typescript
{
  id: "volunteer_type",
  type: "select",
  label: "Volunteer Type",
  prompt: "What type of volunteer role are you interested in?",
  options: [
    { value: "direct_service", label: "Direct Service" },
    { value: "administrative", label: "Administrative" },
    { value: "fundraising", label: "Fundraising" }
  ],
  required: true
}
```

### Eligibility Gate Field
Field that can disqualify users (requires `failure_message`).

**Schema:**
```typescript
{
  id: "age_verification",
  type: "number",
  label: "Age",
  prompt: "How old are you?",
  required: true,
  eligibility_gate: true,
  failure_message: "Unfortunately, you must be 18 or older to apply for this program."
}
```

## Validation Rules

### Form Level
- Form ID: Required, lowercase letters/numbers/underscores, starts with letter, unique
- Program: Required (v1.3+)
- Title: Required, max 100 chars
- Description: Required, max 500 chars
- CTA Text: Optional, max 50 chars
- Trigger Phrases: At least 1 required, max 100 chars each
- Fields: At least 1 required, at least 1 must be required

### Field Level
- Field ID: Required, lowercase letters/numbers/underscores, starts with letter, unique within form
- Type: Required, one of valid types
- Label: Required, max 100 chars
- Prompt: Required, max 500 chars
- Hint: Optional, max 200 chars
- Required: Boolean
- Options: Required for select fields (min 1 option)
- Eligibility Gate: Boolean
- Failure Message: Required if eligibility_gate is true, max 500 chars

## Store Integration

The FormEditor integrates with the following Zustand store actions:

```typescript
// Form CRUD
createForm(form: ConversationalForm)
updateForm(formId: string, updates: Partial<ConversationalForm>)
deleteForm(formId: string)
duplicateForm(formId: string)

// Field management (not used in current implementation)
addField(formId: string, field: FormField)
updateField(formId: string, fieldIndex: number, updates: Partial<FormField>)
deleteField(formId: string, fieldIndex: number)
reorderFields(formId: string, fromIndex: number, toIndex: number)

// Selectors
getForm(formId: string)
getAllForms()
getFormsByProgram(programId: string)
getFormDependencies(formId: string)
```

## Workflow

### Creating a Form
1. User clicks "Create Form"
2. FormForm modal opens
3. User fills in basic info (title, description, program)
4. Form ID auto-generates from title
5. User adds trigger phrases
6. User clicks "Add Field" to open FieldsManager
7. FieldEditor modal opens for each field
8. User defines field type and properties
9. For select fields, user adds options
10. For eligibility gates, user adds failure message
11. User saves field, returns to FormForm
12. Repeat for all fields
13. User optionally configures post-submission (basic for now)
14. User saves form

### Editing a Form
1. User clicks "Edit" on FormCard
2. FormForm modal opens with existing data
3. Form ID is disabled (cannot change)
4. User modifies any fields
5. FieldsManager allows editing existing fields
6. User saves changes

### Deleting a Form
1. User clicks "Delete" on FormCard
2. DeleteConfirmation modal opens
3. System checks for dependent CTAs
4. If dependencies exist, deletion is blocked
5. User must remove dependencies first
6. If no dependencies, user confirms deletion

## Accessibility

- All form inputs have proper labels
- Required fields marked with asterisk
- Error messages displayed inline
- Keyboard navigation supported
- ARIA attributes on modals
- Focus management on modal open/close

## Performance Notes

- Forms list uses memoized arrays to prevent unnecessary re-renders
- Field validation debounced on blur, not on every keystroke
- Modal content lazy-loaded
- Large forms (>20 fields) may benefit from virtualization (future enhancement)

## Future Enhancements

### Phase 2 - Post-Submission
- Full post-submission actions (start form, external link)
- Fulfillment methods (email, webhook, DynamoDB, Sheets)
- Next steps array
- Email templates

### Phase 3 - Advanced Features
- Field conditional logic (show/hide based on other fields)
- Field validation rules (regex, min/max, custom)
- Multi-page forms
- Progress indicator
- Draft/preview mode
- Form templates
- Import/export forms

### Phase 4 - Analytics
- Form submission tracking
- Field completion rates
- Drop-off analysis
- A/B testing

## Dependencies

- React 18+
- Zustand (state management)
- Zod (validation)
- Radix UI (primitives)
- Lucide React (icons)
- TypeScript 5+

## Related Documentation

- [Tenant Config Schema](../../../docs/TENANT_CONFIG_SCHEMA.md)
- [Forms Implementation Plan](../../../docs/FORMS_CONFIG_ADMIN_IMPLEMENTATION_GUIDE.md)
- [Zod Schemas](../../../lib/schemas/form.schema.ts)
- [Store Slices](../../../store/slices/forms.ts)
