# Content Showcase Editor - Test Plan

## Manual Testing Checklist

### 1. Basic UI Tests

#### Empty State
- [ ] Navigate to Cards page
- [ ] Verify "No Showcase Items" empty state displays
- [ ] Verify Sparkles icon shows
- [ ] Verify "Create First Showcase Item" button appears
- [ ] Click button and modal opens

#### Header
- [ ] Verify page header shows "Showcase Items"
- [ ] Verify description text appears
- [ ] Verify "Add Showcase Item" button visible (when items exist)

#### Dark Mode
- [ ] Toggle dark mode
- [ ] Verify all text is readable
- [ ] Verify contrast meets standards
- [ ] Verify badges, buttons, inputs all styled correctly
- [ ] Verify borders visible but not harsh

### 2. Create Showcase Item Tests

#### Required Fields Validation
- [ ] Open create modal
- [ ] Try to submit empty form
- [ ] Verify error messages show for: ID, Name, Tagline, Description, Type, Keywords
- [ ] Error messages appear on blur
- [ ] Red asterisk marks required fields

#### ID Field
- [ ] Enter valid ID (e.g., "test_program")
- [ ] Try invalid characters (spaces, special chars)
- [ ] Verify format validation error shows
- [ ] Verify ID cannot be changed in edit mode
- [ ] Verify duplicate ID prevented

#### Type Selection
- [ ] Select each type: Program, Event, Initiative, Campaign
- [ ] Verify selection works
- [ ] Verify type badge updates in card after save

#### Basic Content Fields
- [ ] Enter Name (required)
- [ ] Enter Tagline (required)
- [ ] Enter Description in textarea (required)
- [ ] Verify character limits if any
- [ ] Verify line breaks preserved in description

#### Optional Fields
- [ ] Enter Image URL (valid format)
- [ ] Enter invalid URL, verify error
- [ ] Enter Stats text
- [ ] Enter Testimonial in textarea
- [ ] Leave some fields empty, verify saves successfully

#### Keywords (Required, Tag Input)
- [ ] Type keyword and press Enter
- [ ] Verify tag added
- [ ] Type keyword and click + button
- [ ] Verify tag added
- [ ] Try to add duplicate keyword
- [ ] Verify duplicate ignored
- [ ] Click X on tag to remove
- [ ] Verify tag removed
- [ ] Try to submit with 0 keywords
- [ ] Verify error: "At least one keyword required"
- [ ] Add 5+ keywords, verify all display

#### Highlights (Optional, Tag Input)
- [ ] Type highlight and press Enter
- [ ] Verify tag added with Sparkles icon
- [ ] Type highlight and click + button
- [ ] Click X to remove highlight
- [ ] Add 5+ highlights, verify all save
- [ ] Leave highlights empty, verify still saves

#### CTA Linking
- [ ] If no CTAs exist, verify warning message
- [ ] If CTAs exist, verify dropdown populated
- [ ] Select a CTA
- [ ] Verify selection saves
- [ ] Select "None" option
- [ ] Verify CTA unlinked

#### Enabled Toggle
- [ ] Verify toggle defaults to ON
- [ ] Click toggle to disable
- [ ] Save and verify "Disabled" badge shows in card
- [ ] Edit and re-enable
- [ ] Verify badge removed

#### Save Operation
- [ ] Fill all fields correctly
- [ ] Click Save
- [ ] Verify modal closes
- [ ] Verify success toast appears
- [ ] Verify new card appears in list

### 3. Edit Showcase Item Tests

#### Edit Modal
- [ ] Click Edit button on a card
- [ ] Verify modal opens with existing data
- [ ] Verify ID field is disabled
- [ ] Verify all other fields editable
- [ ] Verify keywords display as tags
- [ ] Verify highlights display as tags

#### Update Fields
- [ ] Change Name
- [ ] Change Tagline
- [ ] Modify Description
- [ ] Add/remove keywords
- [ ] Add/remove highlights
- [ ] Change linked CTA
- [ ] Toggle enabled status
- [ ] Click Save
- [ ] Verify changes reflected in card

#### Cancel Edit
- [ ] Make changes
- [ ] Click Cancel
- [ ] Verify changes not saved
- [ ] Verify card unchanged

### 4. Delete Showcase Item Tests

#### Delete Confirmation
- [ ] Click Delete button
- [ ] Verify confirmation modal opens
- [ ] Verify item name shown in warning
- [ ] Click Cancel
- [ ] Verify modal closes, item not deleted

#### Confirm Delete
- [ ] Click Delete again
- [ ] Click Confirm in modal
- [ ] Verify item removed from list
- [ ] Verify success toast appears
- [ ] If was last item, verify empty state returns

### 5. Card Display Tests

#### Type Badges
- [ ] Create items of each type
- [ ] Verify correct icon: 📚 Program, 📅 Event, 🎯 Initiative, 📢 Campaign
- [ ] Verify correct badge color per type
- [ ] Verify "Disabled" badge shows when disabled

#### Content Display
- [ ] Verify Name shown as card title
- [ ] Verify Tagline shown in italics
- [ ] Verify Description truncated to 2 lines
- [ ] Verify Stats section shows if present
- [ ] Verify Keywords display (first 5 + count)
- [ ] Verify Highlights display (first 3 + count)
- [ ] Verify Linked CTA shows CTA label

#### Card Actions
- [ ] Verify Edit button visible
- [ ] Verify Delete button visible
- [ ] Hover over buttons, verify hover states
- [ ] Click Edit, verify opens modal
- [ ] Click Delete, verify confirmation

### 6. List View Tests

#### Multiple Items
- [ ] Create 5+ showcase items
- [ ] Verify all display in grid
- [ ] Verify grid responsive (1 col mobile, 2 tablet, 3 desktop)
- [ ] Scroll list, verify smooth scrolling
- [ ] Verify no layout issues

#### Ordering
- [ ] Items appear in creation order (or ID order)
- [ ] Verify consistent ordering

### 7. Validation Edge Cases

#### Boundary Tests
- [ ] Very long name (100+ chars)
- [ ] Very long description (1000+ chars)
- [ ] 20+ keywords
- [ ] 10+ highlights
- [ ] URL with special characters
- [ ] ID with max allowed length

#### Special Characters
- [ ] Name with emojis
- [ ] Description with line breaks
- [ ] Keywords with spaces
- [ ] Testimonial with quotes

#### Invalid Inputs
- [ ] Empty strings for required fields
- [ ] Whitespace-only strings
- [ ] Invalid URL formats
- [ ] Non-existent CTA ID

### 8. Store Integration Tests

#### State Persistence
- [ ] Create item
- [ ] Refresh page (if persistence implemented)
- [ ] Navigate away and back
- [ ] Verify data retained in session

#### Dirty Flag
- [ ] Make change
- [ ] Verify config marked as dirty
- [ ] Save config
- [ ] Verify dirty flag cleared

### 9. Cross-Editor Tests

#### CTA Integration
- [ ] Create CTA first
- [ ] Create showcase item linked to CTA
- [ ] Edit CTA label
- [ ] Verify showcase item shows new label
- [ ] Delete CTA
- [ ] Verify showcase item shows CTA ID as fallback

#### Form Integration (if applicable)
- [ ] Ensure no conflicts with Forms editor
- [ ] Test concurrent editing

### 10. Performance Tests

#### Rendering
- [ ] Create 50 showcase items
- [ ] Verify list renders smoothly
- [ ] Verify search/filter if implemented
- [ ] Verify no lag when typing

#### Memory
- [ ] Open and close modals 20 times
- [ ] Verify no memory leaks
- [ ] Check browser console for warnings

### 11. Accessibility Tests

#### Keyboard Navigation
- [ ] Tab through form fields
- [ ] Verify logical tab order
- [ ] Press Enter in keyword input
- [ ] Verify keyword added
- [ ] Press Escape in modal
- [ ] Verify modal closes

#### Screen Reader
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify labels announced
- [ ] Verify error messages announced
- [ ] Verify button purposes clear

#### Focus Management
- [ ] Open modal
- [ ] Verify focus on first field
- [ ] Close modal
- [ ] Verify focus returns to trigger button

### 12. Error Handling Tests

#### Network Errors (if applicable)
- [ ] Simulate save failure
- [ ] Verify error message
- [ ] Retry operation

#### Validation Errors
- [ ] Submit with multiple errors
- [ ] Verify all errors display
- [ ] Fix one error
- [ ] Verify error clears on blur
- [ ] Fix all errors
- [ ] Verify form submits

## Automated Test Ideas (Future)

```typescript
// Example test structure
describe('ContentShowcaseEditor', () => {
  it('should display empty state when no items', () => {});
  it('should validate required fields', () => {});
  it('should create showcase item successfully', () => {});
  it('should update showcase item', () => {});
  it('should delete showcase item with confirmation', () => {});
  it('should handle keyword tag input', () => {});
  it('should link to existing CTA', () => {});
  it('should show correct type badge', () => {});
});
```

## Known Issues to Watch For

1. Tag input: Duplicate prevention working?
2. CTA dropdown: Handles empty list gracefully?
3. Image URL: Preview functionality needed?
4. Dark mode: All edges have proper contrast?
5. Long text: Truncation working correctly?

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Pass Criteria

All checkboxes above must be checked for release-ready status.

Priority Issues:
- P0: Prevents core functionality (create/edit/delete)
- P1: Degrades UX significantly
- P2: Minor issues, can be addressed post-launch
- P3: Enhancement requests

## Test Results

| Test Category | Pass/Fail | Notes |
|--------------|-----------|-------|
| Empty State | ⏳ Pending | |
| Create Item | ⏳ Pending | |
| Edit Item | ⏳ Pending | |
| Delete Item | ⏳ Pending | |
| Validation | ⏳ Pending | |
| Card Display | ⏳ Pending | |
| Dark Mode | ⏳ Pending | |
| Accessibility | ⏳ Pending | |
| Performance | ⏳ Pending | |

## Sign-Off

- [ ] Developer: ________________ Date: ________
- [ ] QA: ________________ Date: ________
- [ ] Product: ________________ Date: ________
