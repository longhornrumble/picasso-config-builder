# CTAEditor Component

Complete CRUD interface for managing Call-to-Action (CTA) definitions in the Picasso Config Builder.

## Overview

The CTAEditor provides a full-featured interface for creating, viewing, editing, and deleting CTA buttons with action-specific configuration.

## Components

### CTAEditor (Main Container)

Main container component that orchestrates the CTA management interface.

**Features:**
- Create/Edit/Delete CTAs
- Empty state when no CTAs exist
- Integration with Zustand store
- Modal-based forms
- Dependency checking before deletion

**Usage:**
```tsx
import { CTAEditor } from '@/components/editors/CTAEditor';

<CTAEditor />
```

### CTAList

Displays CTAs in a responsive grid layout (1-3 columns based on screen size).

**Props:**
- `ctas`: Record of CTA definitions
- `onEdit`: Edit callback
- `onDelete`: Delete callback

### CTACard

Individual CTA card with action-specific display and edit/delete actions.

**Features:**
- Visual icon based on action type
- Color-coded badge for style (primary=green, secondary=blue, info=gray)
- Action-specific content display:
  - `start_form`: Shows form ID badge
  - `external_link`: Shows clickable URL link
  - `send_query`: Shows query text preview
  - `show_info`: Shows prompt text preview
- Edit and Delete buttons

**Props:**
- `ctaId`: CTA identifier
- `cta`: CTA definition
- `onEdit`: Edit callback
- `onDelete`: Delete callback

### CTAForm

Modal form for creating and editing CTAs with conditional field rendering.

**Features:**
- Auto-generated CTA ID from label (create mode)
- Conditional fields based on action type:
  - `start_form` → Shows form dropdown (requires forms)
  - `external_link` → Shows URL input with validation
  - `send_query` → Shows query textarea
  - `show_info` → Shows prompt textarea
- Auto-populated CTA type based on action selection
- Real-time Zod validation
- Duplicate CTA ID detection
- Disabled type field (auto-managed)

**Action to Type Mapping:**
- `start_form` → `form_trigger`
- `external_link` → `external_link`
- `send_query` → `bedrock_query`
- `show_info` → `info_request`

**Props:**
- `ctaId`: CTA ID being edited (null for create)
- `cta`: CTA being edited (null for create)
- `existingCtaIds`: Array of existing IDs for validation
- `availableForms`: Record of forms for dropdown
- `onSubmit`: Submit callback
- `onCancel`: Cancel callback
- `open`: Modal open state

### DeleteConfirmation

Confirmation dialog for CTA deletion with dependency checking.

**Features:**
- Shows CTA details (label, ID, action)
- Displays referenced form (if action is start_form)
- Lists branches that reference this CTA
- Prevents deletion if branches depend on this CTA
- Warning messages for safe deletions

**Dependency Rules:**
- **Cannot delete** if referenced by any branches (primary or secondary)
- **Can delete** even if it references a form (form won't be deleted)

**Props:**
- `cta`: CTA to delete
- `ctaId`: CTA ID to delete
- `dependencies`: Dependencies from store
- `onConfirm`: Confirm callback
- `onCancel`: Cancel callback
- `open`: Modal open state

## CTA Data Structure

```typescript
interface CTADefinition {
  text?: string; // Legacy field
  label: string; // Button text
  action: 'start_form' | 'external_link' | 'send_query' | 'show_info';
  formId?: string; // Required if action = 'start_form'
  url?: string; // Required if action = 'external_link'
  query?: string; // Required if action = 'send_query'
  prompt?: string; // Required if action = 'show_info'
  type: 'form_trigger' | 'external_link' | 'bedrock_query' | 'info_request';
  style: 'primary' | 'secondary' | 'info';
}
```

## Validation

### Zod Schema (`src/lib/schemas/cta.schema.ts`)

- **label**: Required, max 100 characters
- **action**: Must be one of the four action types
- **type**: Must match the action type
- **style**: Must be one of the three style types
- **Conditional fields**: Required based on action type:
  - `start_form` requires `formId`
  - `external_link` requires valid `url`
  - `send_query` requires `query`
  - `show_info` requires `prompt`

### Form Validation

- **CTA ID**: Auto-generated from label, lowercase alphanumeric with underscores
- **Duplicate check**: Prevents creating CTAs with existing IDs
- **URL validation**: Full URL validation for external_link action
- **Required fields**: Enforced based on selected action type

## Store Integration

### Actions Used
- `createCTA(cta, ctaId)`: Create new CTA
- `updateCTA(ctaId, updates)`: Update existing CTA
- `deleteCTA(ctaId)`: Delete CTA (with dependency check)
- `getCTADependencies(ctaId)`: Get branches and forms that reference this CTA

### State Structure
```typescript
{
  ctas: {
    ctas: Record<string, CTADefinition>;
    activeCtaId: string | null;
  }
}
```

## Dependencies

### Forward Dependencies (CTA references these)
- **Forms**: When action is `start_form`, CTA references a form via `formId`

### Backward Dependencies (These reference CTA)
- **Branches**: Can reference CTAs in `available_ctas.primary` or `available_ctas.secondary`

## Conditional Field Logic

The form dynamically renders different fields based on the selected action:

```tsx
// Pseudocode for conditional rendering
switch (action) {
  case 'start_form':
    return <Select options={forms} value={formId} />
  case 'external_link':
    return <Input type="url" value={url} />
  case 'send_query':
    return <Textarea value={query} />
  case 'show_info':
    return <Textarea value={prompt} />
}
```

## UI Components Used

- `Button`, `Input`, `Textarea`, `Select` from `@/components/ui`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Badge` with variants: `success`, `info`, `secondary`, `outline`
- `Modal`, `ModalContent`, `ModalHeader`, `ModalFooter`
- `Alert`, `AlertDescription` with variants: `error`, `warning`, `info`
- Icons from `lucide-react`: `Edit`, `Trash2`, `ExternalLink`, `Send`, `Info`, `FileText`, `AlertTriangle`, `MousePointerClick`, `Plus`

## Color Coding

CTAs are color-coded by style:
- **Primary**: Green (#4CAF50) - `success` badge variant
- **Secondary**: Blue - `info` badge variant
- **Info**: Gray - `secondary` badge variant

## Testing Checklist

- [ ] Create new CTA with all action types
- [ ] Edit existing CTA
- [ ] Delete CTA without dependencies
- [ ] Attempt to delete CTA with branch dependencies (should be blocked)
- [ ] Auto-generated CTA ID updates when label changes (create mode)
- [ ] CTA ID is disabled in edit mode
- [ ] Type auto-populates when action changes
- [ ] Conditional fields render correctly for each action type
- [ ] URL validation works for external_link
- [ ] Form dropdown populates from forms store
- [ ] Warning when no forms available for start_form action
- [ ] Duplicate CTA ID detection works
- [ ] Empty state displays when no CTAs
- [ ] Responsive grid layout (1-3 columns)
- [ ] Toast notifications appear for CRUD operations
- [ ] TypeScript compiles without errors

## Notes

- CTA IDs are auto-generated from labels and cannot be changed after creation
- Type field is auto-managed based on action selection and should not be manually edited
- Deleting a CTA does NOT delete any forms it references
- CTAs can only be deleted if no branches reference them
- When action changes, any previously entered conditional field data is preserved but won't be used
- The forms dropdown will show a warning if no forms are available when action is `start_form`
