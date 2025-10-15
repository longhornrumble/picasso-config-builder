# Branch Editor

The Branch Editor component provides a complete interface for managing conversation branches in the Picasso Config Builder. Branches route conversations based on keyword detection and assign CTAs (Call-to-Actions) to guide users.

## Features

- **CRUD Operations**: Create, read, update, and delete conversation branches
- **Keyword Management**: Add/remove keywords that trigger branch routing
- **CTA Assignment**: Assign primary and up to 2 secondary CTAs per branch
- **Validation**: Real-time Zod validation with helpful error messages
- **Dependency Tracking**: Shows which CTAs are referenced by branches
- **Responsive Design**: Grid layout adapts from 1-3 columns based on screen size
- **Empty State**: Helpful guidance when no branches exist

## Components

### BranchEditor (Main Container)

The main container component that orchestrates the entire branch editing experience.

```tsx
import { BranchEditor } from '@/components/editors/BranchEditor';

function BranchesPage() {
  return <BranchEditor />;
}
```

**Features:**
- Empty state with call-to-action
- Create/Edit modal management
- Delete confirmation with dependency checking
- Integration with Zustand store

### BranchList

Responsive grid display of branch cards.

```tsx
import { BranchList } from '@/components/editors/BranchEditor/BranchList';

<BranchList
  branches={branchList}
  ctas={ctas}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Props:**
- `branches`: Array of `{ id: string; branch: ConversationBranch }`
- `ctas`: Record of available CTAs for display
- `onEdit`: Callback for edit action
- `onDelete`: Callback for delete action

### BranchCard

Individual branch card display with keywords and CTAs.

```tsx
import { BranchCard } from '@/components/editors/BranchEditor/BranchCard';

<BranchCard
  branchId="volunteer_branch"
  branch={branch}
  ctas={ctas}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Displays:**
- Branch ID as title
- Detection keywords (up to 5 shown, with "+N more" badge)
- Primary CTA with success badge
- Secondary CTAs with info badges
- Edit and Delete action buttons

### BranchForm

Modal form for creating and editing branches with advanced input controls.

```tsx
import { BranchForm } from '@/components/editors/BranchEditor/BranchForm';

<BranchForm
  branchId={editingBranchId}
  branch={editingBranch}
  existingBranchIds={existingIds}
  availableCTAs={ctas}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  open={isOpen}
/>
```

**Features:**
- **Branch ID Field**: Lowercase alphanumeric with underscores, disabled when editing
- **Keywords Input**:
  - Chip/badge display with removal
  - Add keywords by pressing Enter or comma
  - Automatic lowercase conversion
  - Duplicate detection
  - Max 20 keywords per branch
- **Primary CTA Selector**: Required dropdown of available CTAs
- **Secondary CTAs**: Add up to 2 secondary CTAs with chip display
- **Real-time Validation**: Zod schema validation with field-level errors
- **Duplicate Detection**: Prevents duplicate branch IDs

**Validation Rules:**
- Branch ID: Required, lowercase alphanumeric with underscores, must be unique
- Keywords: At least 1 required, max 50 chars each, max 20 total
- Primary CTA: Required, must exist in CTAs store
- Secondary CTAs: Optional, max 2, cannot duplicate primary

### DeleteConfirmation

Confirmation modal for branch deletion with dependency information.

```tsx
import { DeleteConfirmation } from '@/components/editors/BranchEditor/DeleteConfirmation';

<DeleteConfirmation
  branchId="volunteer_branch"
  branch={branchToDelete}
  dependentCTAsCount={2}
  dependentCTANames={['Apply Now', 'Learn More']}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  open={isOpen}
/>
```

**Features:**
- Shows branch details (ID, keywords, associated CTAs)
- Lists referenced CTAs (informational only)
- Warning alert about permanent deletion
- Does not block deletion (unlike programs with forms)

## Data Flow

### Store Integration

The Branch Editor integrates with the Zustand store for state management:

```typescript
// Read branches
const branches = useConfigStore(state => state.branches.branches);
const branch = useConfigStore(state => state.branches.getBranch(branchId));

// Create/Update/Delete
const createBranch = useConfigStore(state => state.branches.createBranch);
const updateBranch = useConfigStore(state => state.branches.updateBranch);
const deleteBranch = useConfigStore(state => state.branches.deleteBranch);

// Dependencies
const deps = useConfigStore(state => state.branches.getBranchDependencies(branchId));
```

### Data Structure

Branches follow the `ConversationBranch` type:

```typescript
interface ConversationBranch {
  detection_keywords: string[];
  available_ctas: {
    primary: string;      // CTA ID
    secondary: string[];  // Array of CTA IDs (max 2)
  };
}
```

Branches are stored as a record with branch IDs as keys:

```typescript
Record<string, ConversationBranch>
```

## Validation Schema

The Branch Editor uses Zod for validation:

```typescript
import { conversationBranchSchema } from '@/lib/schemas';

const branchSchema = z.object({
  detection_keywords: z
    .array(z.string().min(1).max(50).toLowerCase().regex(/^[a-z0-9\s\-_]+$/))
    .min(1, 'At least one keyword required')
    .max(20, 'Maximum 20 keywords per branch'),
  available_ctas: z.object({
    primary: z.string().min(1, 'Primary CTA ID is required'),
    secondary: z.array(z.string().min(1)).max(2, 'Maximum 2 secondary CTAs'),
  }),
});
```

Additional validation:
- No duplicate keywords
- Keywords should be topic-based, not full questions
- Primary CTA cannot also be in secondary list
- Total CTAs (1 primary + N secondary) should not exceed 3

## Styling

The Branch Editor follows the established design system:

- **Primary Color**: Green (#4CAF50) for primary actions
- **Card Layout**: Responsive grid (1-3 columns)
- **Dark Mode**: Full support with dark: variants
- **Typography**: Consistent with other editors
- **Spacing**: Standard spacing scale (space-y-4, gap-4)

## Accessibility

- **Keyboard Navigation**: Full keyboard support in forms and modals
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Error Messages**: Associated with inputs via `aria-describedby`
- **Focus Management**: Proper focus on modal open/close
- **Screen Readers**: Semantic HTML with role attributes

## Usage Examples

### Basic Usage

```tsx
import { BranchEditor } from '@/components/editors/BranchEditor';

export const BranchesPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <BranchEditor />
    </div>
  );
};
```

### Creating a Branch

1. Click "Create Branch" button
2. Enter branch ID (e.g., "volunteer_branch")
3. Add keywords (e.g., "volunteer", "help", "serve")
4. Select primary CTA (required)
5. Optionally add up to 2 secondary CTAs
6. Click "Create Branch"

### Editing a Branch

1. Click "Edit" on a branch card
2. Modify keywords (add/remove)
3. Change CTA assignments
4. Click "Update Branch"

### Deleting a Branch

1. Click "Delete" on a branch card
2. Review branch details and associated CTAs
3. Confirm deletion
4. Branch and keyword routing are permanently removed

## Dependencies

The Branch Editor depends on:

- **Store**: `@/store` (Zustand)
- **UI Components**: `@/components/ui`
- **Schemas**: `@/lib/schemas`
- **Types**: `@/types/config`
- **Icons**: `lucide-react`

## Related Components

- **Programs Editor**: Similar CRUD pattern for programs
- **Forms Editor**: Manages conversational forms
- **CTAs Editor**: Manages call-to-action buttons referenced by branches
- **Cards Editor**: Manages smart response cards

## Future Enhancements

Potential improvements for future versions:

- Branch testing/preview
- Keyword suggestions based on existing content
- Analytics for branch routing effectiveness
- Bulk operations (import/export branches)
- Branch templates
- Priority/weight system for overlapping keywords
- Advanced keyword patterns (regex, synonyms)
