# Programs Editor

Complete CRUD interface for managing Program definitions in the Picasso Config Builder.

## Overview

The Programs Editor provides a user-friendly interface for creating, reading, updating, and deleting organizational programs. Programs are top-level entities that forms can be assigned to (e.g., "Volunteer Programs", "Donation Programs").

## Component Architecture

```
ProgramsEditor/
├── ProgramsEditor.tsx       # Main container component
├── ProgramList.tsx          # Grid display of program cards
├── ProgramCard.tsx          # Individual program card
├── ProgramForm.tsx          # Create/edit modal with validation
├── DeleteConfirmation.tsx   # Delete confirmation modal
└── index.ts                 # Barrel export
```

## Features

### ✅ Complete CRUD Operations
- **Create**: Add new programs with validation
- **Read**: Display programs in a sortable grid
- **Update**: Edit existing programs
- **Delete**: Remove programs with dependency checking

### ✅ Validation
- **Client-side validation** using Zod schemas
- **Real-time validation** feedback as user types
- **Field-level errors** displayed below inputs
- **Duplicate ID detection** prevents conflicts
- **Required field enforcement**

### ✅ Dependency Management
- **Form dependency checking** before deletion
- **Usage badges** show how many forms reference each program
- **Warning modals** prevent accidental deletion of in-use programs
- **Dependency listing** shows which forms would be affected

### ✅ User Experience
- **Empty state** when no programs exist
- **Toast notifications** for all operations
- **Loading states** during async operations
- **Keyboard navigation** (Tab, Enter, Escape)
- **Focus management** (auto-focus first field)
- **Responsive design** (1-3 column grid based on screen size)

### ✅ Accessibility
- **ARIA labels** on all interactive elements
- **Screen reader support** for form errors
- **Semantic HTML** structure
- **Keyboard-only navigation** fully supported
- **Error announcements** via `role="alert"`

## Component Details

### ProgramsEditor

Main container component that orchestrates all CRUD operations.

```tsx
import { ProgramsEditor } from '@/components/editors/ProgramsEditor';

<ProgramsEditor />
```

**Responsibilities:**
- Manages modal state (open/close)
- Tracks editing and deleting programs
- Integrates with Zustand store
- Calculates form counts and dependencies
- Renders empty state or list view

### ProgramList

Displays programs in a responsive grid, sorted alphabetically by name.

```tsx
<ProgramList
  programs={programList}
  formCounts={formCounts}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Features:**
- Responsive grid (1-3 columns)
- Automatic alphabetical sorting
- Form usage indicators

### ProgramCard

Individual program card with actions.

```tsx
<ProgramCard
  program={program}
  formCount={3}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Displays:**
- Program name (title)
- Program ID (code badge)
- Description (with placeholder if empty)
- Usage count badge
- Edit and Delete buttons

### ProgramForm

Modal form for creating and editing programs with comprehensive validation.

```tsx
<ProgramForm
  program={editingProgram}
  existingProgramIds={existingIds}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  open={isOpen}
/>
```

**Features:**
- Create and edit modes
- Real-time Zod validation
- Field-level error display
- Duplicate ID checking
- Disabled submit when invalid
- Auto-focus on first field
- Textarea for description

**Validation Rules:**
- `program_id`: Required, unique, lowercase, underscores only, max 50 chars
- `program_name`: Required, min 3 chars, max 100 chars
- `description`: Optional, max 500 chars

### DeleteConfirmation

Confirmation modal for safe program deletion.

```tsx
<DeleteConfirmation
  program={programToDelete}
  dependentFormsCount={3}
  dependentFormNames={['Form 1', 'Form 2']}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  open={isDeleteModalOpen}
/>
```

**Features:**
- Shows program details
- Dependency warning (if forms reference it)
- Lists dependent forms (up to 5, then "...and N more")
- Blocks deletion if dependencies exist
- Confirmation required for delete

## Store Integration

The editor integrates with Zustand store slices:

```typescript
// Get data and actions from store
const {
  programs,              // Record<string, Program>
  forms,                 // Record<string, ConversationalForm>
  createProgram,         // (program: Program) => void
  updateProgram,         // (id: string, updates: Partial<Program>) => void
  deleteProgram,         // (id: string) => void
  getProgramDependencies // (id: string) => Dependencies
} = useConfigStore();
```

**Store behaviors:**
- All CRUD operations automatically mark config as dirty
- Toast notifications are triggered by store actions
- Dependency checking prevents invalid deletions
- Store handles success/error toast messages

## Validation Schema

Validation is powered by Zod:

```typescript
import { programSchema } from '@/lib/schemas';

// Validate program data
try {
  programSchema.parse(formData);
  // Valid - proceed
} catch (error) {
  // Show validation errors
}
```

## TypeScript Types

All components are fully typed:

```typescript
import type { Program } from '@/types/config';
import type { ProgramFormProps } from '@/components/editors/ProgramsEditor';
```

## Success Criteria

✅ All requirements met:

1. **Functionality**
   - ✅ Create programs with validation
   - ✅ Edit existing programs
   - ✅ Delete programs with dependency check
   - ✅ List view shows all programs
   - ✅ Empty state when no programs

2. **Integration**
   - ✅ Zustand store CRUD operations work
   - ✅ isDirty flag updates on changes
   - ✅ Toast notifications display
   - ✅ Dependency checking functional

3. **Validation**
   - ✅ Client-side Zod validation
   - ✅ Real-time validation feedback
   - ✅ Field-level errors
   - ✅ Duplicate ID prevention

4. **UX**
   - ✅ Modal opens/closes properly
   - ✅ Keyboard navigation works
   - ✅ Form resets on open
   - ✅ Loading states during save

5. **Code Quality**
   - ✅ Fully typed (no `any` types)
   - ✅ Builds without errors
   - ✅ TypeScript compiles successfully
   - ✅ Accessible (ARIA labels, keyboard nav)
   - ✅ Documented with JSDoc comments

## Pattern Established

This editor establishes the pattern for other editors (Branches, CTAs, Forms):

1. **Component Structure**: Main container → List → Card → Form + Delete modal
2. **Store Integration**: Use Zustand hooks, call actions, handle toasts
3. **Validation**: Zod schemas with real-time feedback
4. **Dependency Checking**: Prevent deletion of referenced entities
5. **UX Patterns**: Empty state, loading states, confirmations, toasts
6. **TypeScript**: Full typing, exported interfaces
7. **Accessibility**: Keyboard nav, ARIA, focus management

## Future Enhancements

Potential improvements for future iterations:

- **Search/filter**: Add search bar to filter programs by name/ID
- **Bulk operations**: Select multiple programs for batch actions
- **Export/import**: Import programs from JSON
- **Undo/redo**: Revert changes before saving
- **Keyboard shortcuts**: Quick actions (Ctrl+N for new, etc.)
- **Drag-and-drop**: Reorder programs visually
- **Preview**: See how program appears in forms

## Testing

To test the Programs Editor:

1. **Create Program**
   - Click "Create Program"
   - Fill in all fields
   - Verify validation (try invalid program_id)
   - Save and verify toast notification

2. **Edit Program**
   - Click "Edit" on existing program
   - Modify fields
   - Save and verify changes

3. **Delete Program**
   - Click "Delete" on program with no forms
   - Confirm deletion
   - Verify toast notification

4. **Dependency Blocking**
   - Create a form assigned to a program
   - Try to delete that program
   - Verify warning modal blocks deletion

5. **Empty State**
   - Delete all programs
   - Verify empty state displays
   - Click "Create First Program"

## Files Modified

- ✅ Created: `/src/components/editors/ProgramsEditor/ProgramsEditor.tsx`
- ✅ Created: `/src/components/editors/ProgramsEditor/ProgramList.tsx`
- ✅ Created: `/src/components/editors/ProgramsEditor/ProgramCard.tsx`
- ✅ Created: `/src/components/editors/ProgramsEditor/ProgramForm.tsx`
- ✅ Created: `/src/components/editors/ProgramsEditor/DeleteConfirmation.tsx`
- ✅ Created: `/src/components/editors/ProgramsEditor/index.ts`
- ✅ Created: `/src/components/editors/index.ts`
- ✅ Updated: `/src/pages/ProgramsPage.tsx`

## Build Status

✅ **Build successful**: `npm run build:dev` passes without errors
✅ **TypeScript**: No type errors in editor components
✅ **Bundle size**: 1.9 MB (within acceptable range)
