# Phase 3 Test Plan

**Test Environment:** http://localhost:3000
**Date:** October 16, 2025
**Testing:** Refactored Programs, Branches, and CTAs Editors

---

## Test Checklist

### 1. Programs Editor (`/programs`)

#### Create Operations
- [ ] Click "Add Program" button
- [ ] Modal opens with empty form
- [ ] **Test ID Field:**
  - [ ] Try empty ID → Should show "Program ID is required"
  - [ ] Try invalid characters (spaces, special chars) → Should reject
  - [ ] Enter valid ID (e.g., `test_program_1`)
  - [ ] Auto-focus on ID field in create mode
- [ ] **Test Name Field:**
  - [ ] Try empty name → Should show error on blur
  - [ ] Enter valid name (e.g., "Test Program 1")
  - [ ] Auto-focus on name field in edit mode
- [ ] **Test Description Field:**
  - [ ] Optional field, no error if empty
  - [ ] Enter description
- [ ] Click "Save" → Should create program
- [ ] Toast notification shows "Program created"
- [ ] Modal closes
- [ ] New program appears in grid

#### Duplicate ID Validation
- [ ] Click "Add Program" again
- [ ] Try using same ID as existing program
- [ ] Should show "A program with this ID already exists"
- [ ] Cannot save until ID is unique

#### Read Operations
- [ ] Program card displays correctly:
  - [ ] ID shown in header (gray badge)
  - [ ] Name shown in header (title)
  - [ ] Description shown in body
  - [ ] "No description provided" if empty
  - [ ] Form count badge (if program has forms)
- [ ] Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)

#### Update Operations
- [ ] Click "Edit" on a program
- [ ] Modal opens with pre-populated data
- [ ] ID field is **disabled** (cannot change)
- [ ] Helper text shows "Program ID cannot be changed"
- [ ] Change program name
- [ ] Change description
- [ ] Click "Save" → Updates successfully
- [ ] Toast shows "Program updated"
- [ ] Modal closes
- [ ] Card updates with new data

#### Delete Operations
- [ ] Create a program with no forms
- [ ] Click "Delete" → Confirmation modal opens
- [ ] Shows program name
- [ ] Shows "No dependencies" message
- [ ] Click "Delete" → Program deleted
- [ ] Toast shows success
- [ ] Create a program and assign it to a form (in Forms editor)
- [ ] Try to delete that program
- [ ] Should show dependency warning
- [ ] Lists dependent forms by name
- [ ] Delete button disabled
- [ ] Cannot delete until dependencies removed

#### Empty State
- [ ] Delete all programs
- [ ] Should show empty state:
  - [ ] Icon (ListChecks)
  - [ ] Title "No Programs Defined"
  - [ ] Description text
  - [ ] "Create First Program" button
- [ ] Click button → Opens create form

---

### 2. Branches Editor (`/branches`)

#### Create Operations
- [ ] **Prerequisite:** Create at least one CTA first (in CTAs editor)
- [ ] Click "Add Branch" or "Create First Branch"
- [ ] Modal opens
- [ ] **Test Branch ID:**
  - [ ] Try empty → Error
  - [ ] Try invalid chars → Error
  - [ ] Enter valid ID (e.g., `volunteer_branch`)
- [ ] **Test Detection Keywords:**
  - [ ] Try to save with no keywords → Error "At least one keyword required"
  - [ ] Type keyword in input field
  - [ ] Press Enter or click "+" → Keyword added as badge
  - [ ] Keyword shows with Tag icon
  - [ ] Click "X" on badge → Removes keyword
  - [ ] Add multiple keywords
  - [ ] Keywords show in wrapped flex layout
- [ ] **Test Primary CTA:**
  - [ ] Required field
  - [ ] Dropdown shows all available CTAs
  - [ ] Select one
  - [ ] Try to save without selection → Error
- [ ] **Test Secondary CTAs:**
  - [ ] Optional
  - [ ] Dropdown shows available CTAs (excluding primary)
  - [ ] Select one → Adds as badge
  - [ ] Click "X" → Removes secondary CTA
  - [ ] Can add up to 2 secondary CTAs
- [ ] Click "Save" → Branch created
- [ ] Toast notification appears
- [ ] Modal closes

#### Read Operations
- [ ] Branch card shows:
  - [ ] Branch ID in header
  - [ ] Detection keywords section with badges
  - [ ] Shows up to 5 keywords, "+N more" if more than 5
  - [ ] Primary CTA badge (green/success variant)
  - [ ] Secondary CTAs badges (if any)

#### Update Operations
- [ ] Click "Edit" on branch
- [ ] ID field disabled
- [ ] Keywords pre-populated
- [ ] Can add/remove keywords
- [ ] Can change primary CTA
- [ ] Can add/remove secondary CTAs
- [ ] Save updates successfully

#### Delete Operations
- [ ] Branches have no dependencies (nothing references them)
- [ ] Click "Delete" → Confirmation modal
- [ ] Shows "No dependencies"
- [ ] Can delete immediately
- [ ] Toast confirms deletion

#### Empty State
- [ ] If no CTAs exist, shows warning:
  - [ ] Amber warning card
  - [ ] "No CTAs Available" message
  - [ ] Create button disabled
- [ ] If no branches exist (and CTAs do):
  - [ ] Empty state with icon
  - [ ] "Create First Branch" button

---

### 3. CTAs Editor (`/ctas`)

#### Create Operations
- [ ] Click "Add CTA" or "Create First CTA"
- [ ] Modal opens
- [ ] **Test CTA ID:**
  - [ ] Try empty → Error
  - [ ] Try invalid chars → Error
  - [ ] Enter valid ID (e.g., `apply_btn`)
- [ ] **Test Label:**
  - [ ] Required field
  - [ ] Enter label (e.g., "Apply Now")
- [ ] **Test Action Types:**
  - [ ] Select "Start Form":
    - [ ] "Form" dropdown appears (required)
    - [ ] Shows all available forms
    - [ ] Must select a form
    - [ ] Try to save without form → Error
  - [ ] Select "External Link":
    - [ ] "URL" field appears (required)
    - [ ] Enter URL (e.g., https://example.com)
    - [ ] Try to save without URL → Error
  - [ ] Select "Send Query":
    - [ ] "Query" textarea appears (required)
    - [ ] Enter query text
    - [ ] Try to save without query → Error
  - [ ] Select "Show Info":
    - [ ] "Prompt" textarea appears (required)
    - [ ] Enter prompt text
    - [ ] Try to save without prompt → Error
- [ ] **Test Type & Style:**
  - [ ] Type dropdown (form_trigger, external_link, etc.)
  - [ ] Style dropdown (primary, secondary, info)
  - [ ] Both required
- [ ] Save CTA successfully

#### Read Operations
- [ ] CTA card shows:
  - [ ] CTA ID in header (gray badge)
  - [ ] Label in header (title)
  - [ ] Action badge (colored by type):
    - [ ] start_form → green
    - [ ] external_link → blue
    - [ ] send_query → yellow
    - [ ] show_info → gray
  - [ ] Type badge (outline)
  - [ ] Style badge (outline)
  - [ ] Action-specific info:
    - [ ] start_form → Shows linked form name
    - [ ] external_link → Shows URL (truncated)
    - [ ] send_query → Shows query text (2 line clamp)
    - [ ] show_info → Shows prompt text (2 line clamp)

#### Update Operations
- [ ] Click "Edit" on CTA
- [ ] ID field disabled
- [ ] All other fields editable
- [ ] Change action type:
  - [ ] Conditional fields update dynamically
  - [ ] Old action data preserved but not shown
  - [ ] New action's required field appears
- [ ] Save updates successfully

#### Delete Operations
- [ ] Create a CTA that's not used in any branch
- [ ] Click "Delete" → Can delete
- [ ] Create a CTA and assign it to a branch
- [ ] Try to delete → Shows dependency warning
- [ ] Lists dependent branches
- [ ] Delete button disabled
- [ ] Cannot delete until removed from branches

#### Empty State
- [ ] Delete all CTAs
- [ ] Shows empty state with description
- [ ] "Create First CTA" button

---

## 4. Cross-Editor Integration Tests

### Dependency Chain Testing
1. [ ] Create: Program → Form → CTA → Branch
2. [ ] Try to delete in reverse order (should work)
3. [ ] Try to delete out of order:
   - [ ] Cannot delete program if forms exist
   - [ ] Cannot delete CTA if branches reference it
4. [ ] Remove dependencies and verify deletion becomes enabled

### Workflow Test: Complete Setup
1. [ ] Create program: "volunteer_program" / "Volunteer Programs"
2. [ ] Create form: Assign to "volunteer_program"
3. [ ] Create CTA (start_form): Link to that form
4. [ ] Create branch:
   - [ ] Keywords: "volunteer", "help", "community"
   - [ ] Primary CTA: The form CTA you created
5. [ ] Verify all show up correctly in cards
6. [ ] Edit each entity
7. [ ] Delete in safe order (branch → CTA → form → program)

---

## 5. Validation Testing

### Field-Level Validation
- [ ] **Empty Required Fields:**
  - [ ] Try to save with empty required fields
  - [ ] Errors appear inline below fields
  - [ ] Errors are red text
  - [ ] Save button does NOT submit
- [ ] **Touch Tracking:**
  - [ ] Errors only show after field is "touched" (blurred)
  - [ ] Typing in field doesn't show error immediately
  - [ ] Tabbing out of field shows error if invalid
- [ ] **Real-Time Validation:**
  - [ ] Type invalid data, blur → Error appears
  - [ ] Fix data → Error disappears on next blur
  - [ ] Save button enables when form valid

### ID Format Validation
- [ ] Test invalid characters in IDs:
  - [ ] Spaces: `test program` → Error
  - [ ] Special chars: `test@program!` → Error
  - [ ] Mixed case: `TestProgram` → Allowed
  - [ ] Valid: `test_program`, `test-program`, `testProgram123` → OK

### Duplicate ID Validation
- [ ] **Create Mode:**
  - [ ] Try to create with existing ID → Error
  - [ ] Error message: "A [entity] with this ID already exists"
  - [ ] Must change ID to save
- [ ] **Edit Mode:**
  - [ ] ID field disabled → Cannot create duplicate
  - [ ] Keeping same ID → No error (expected)

---

## 6. UI/UX Testing

### Modal Behavior
- [ ] Modal opens smoothly
- [ ] Click outside modal → Does NOT close (prevents accidental loss)
- [ ] Click "Cancel" → Closes modal
- [ ] Press Escape → Closes modal
- [ ] Modal has backdrop (dark overlay)
- [ ] Form is centered on screen

### Toast Notifications
- [ ] **Create Success:**
  - [ ] Green toast appears
  - [ ] Message: "[Entity] created successfully"
  - [ ] Auto-dismisses after ~3 seconds
- [ ] **Update Success:**
  - [ ] Green toast
  - [ ] Message: "[Entity] updated successfully"
- [ ] **Delete Success:**
  - [ ] Green toast
  - [ ] Message: "[Entity] deleted successfully"
- [ ] Multiple toasts stack vertically

### Responsive Design
- [ ] **Mobile (< 768px):**
  - [ ] Grid: 1 column
  - [ ] Cards stack vertically
  - [ ] Edit/Delete buttons stack in card footer
  - [ ] Form fields stack vertically
- [ ] **Tablet (768-1024px):**
  - [ ] Grid: 2 columns
  - [ ] Cards side-by-side
- [ ] **Desktop (> 1024px):**
  - [ ] Grid: 3 columns
  - [ ] Optimal card layout

### Accessibility
- [ ] Labels associated with inputs (click label focuses input)
- [ ] Required fields marked with `*`
- [ ] Error messages have `role="alert"`
- [ ] Buttons have descriptive `aria-label` attributes
- [ ] Tab order is logical
- [ ] Focus visible on all interactive elements

---

## 7. Edge Cases

### Empty States
- [ ] All three editors show appropriate empty states when no entities exist
- [ ] Empty states have icons, titles, descriptions
- [ ] Call-to-action buttons work

### Large Datasets
- [ ] Create 20+ entities
- [ ] Grid scrolls properly
- [ ] Performance remains smooth
- [ ] Cards render correctly

### Long Content
- [ ] **Long IDs:**
  - [ ] ID truncates or wraps gracefully in header
- [ ] **Long Labels/Names:**
  - [ ] Wraps to multiple lines if needed
- [ ] **Long Descriptions:**
  - [ ] Uses `line-clamp` for card preview
  - [ ] Full text visible in edit mode
- [ ] **Many Keywords (Branches):**
  - [ ] Shows "+N more" badge after 5 keywords
  - [ ] All keywords editable in edit mode

### Special Characters
- [ ] **In Descriptions/Labels:**
  - [ ] Quotes, apostrophes → Display correctly
  - [ ] Emojis (if used) → Display correctly
  - [ ] Line breaks → Preserved
- [ ] **In IDs:**
  - [ ] Only alphanumeric, hyphens, underscores allowed
  - [ ] Other chars rejected

---

## 8. Error Recovery

### Network Errors
- [ ] Simulate: Open DevTools → Network tab → Set to "Offline"
- [ ] Try to create entity → Should handle gracefully
- [ ] Re-enable network → Retry should work

### Browser Refresh
- [ ] Make changes (don't save)
- [ ] Refresh page → Changes lost (expected, no auto-save)
- [ ] Create and save entity
- [ ] Refresh page → Entity persists (in Zustand store)

### Cancel Operations
- [ ] Start creating entity
- [ ] Fill out form
- [ ] Click "Cancel" → Modal closes, no changes saved
- [ ] Reopen form → Starts fresh (not previous draft)

---

## 9. Performance Testing

### Initial Load
- [ ] App loads in < 2 seconds
- [ ] No console errors
- [ ] No console warnings (unless expected)

### CRUD Operations
- [ ] Create operation completes instantly
- [ ] Update reflects immediately in UI
- [ ] Delete removes card immediately
- [ ] No visible lag or stuttering

### Validation
- [ ] Real-time validation doesn't cause input lag
- [ ] Typing feels responsive
- [ ] Error messages appear/disappear smoothly

---

## 10. Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

Check for:
- [ ] Consistent layout
- [ ] Proper styling
- [ ] Form controls work
- [ ] No JavaScript errors

---

## Known Issues / Expected Behavior

1. **Forms Editor Not Yet Refactored:**
   - Forms editor still uses old implementation
   - Will be refactored in next phase

2. **No Server Persistence:**
   - All data stored in Zustand (in-memory)
   - Data lost on full page refresh
   - This is expected behavior for development

3. **Validation May Be Strict:**
   - All required fields strictly enforced
   - This is intentional for data integrity

---

## Bug Reporting Template

If you find an issue, report it with:

**Editor:** [Programs/Branches/CTAs]
**Operation:** [Create/Read/Update/Delete]
**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Console Errors:**
```
[Paste any errors from browser console]
```

**Screenshot:**
[If applicable]

---

## Testing Complete!

Once all checkboxes are complete:
- [ ] All 3 editors tested thoroughly
- [ ] No critical bugs found
- [ ] Ready to proceed with Forms Editor refactor

**Tester Name:** ___________________
**Date Completed:** ___________________
**Overall Status:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
