# Test Session Ready! 🧪

**Development Server:** ✅ Running at http://localhost:3000
**Build Status:** ✅ No errors
**Ready to Test:** Programs, Branches, and CTAs Editors

---

## Quick Start

### 1. Open the Application
Visit: **http://localhost:3000**

### 2. Navigate to Editors
Use the sidebar to access:
- **Programs Editor** - `/programs`
- **Branches Editor** - `/branches`
- **CTAs Editor** - `/ctas`

### 3. Follow the Test Plan
Comprehensive checklist: **`PHASE_3_TEST_PLAN.md`**

---

## Recommended Testing Order

### Step 1: Programs Editor (Simplest)
1. Create a program: `test_program` / "Test Program"
2. Edit it → Change name
3. Try to create duplicate ID → Should error
4. Delete it

### Step 2: CTAs Editor (Moderate Complexity)
1. Create a CTA (start_form): `test_cta` / "Test CTA"
2. Test conditional fields:
   - Change action to "External Link" → URL field appears
   - Change to "Send Query" → Query field appears
3. Create a few more CTAs
4. Edit one
5. Delete one

### Step 3: Branches Editor (Most Complex)
1. **Prerequisites:** Need at least one CTA first
2. Create a branch: `test_branch`
3. Add keywords: "test", "sample", "demo"
4. Select primary CTA
5. Add secondary CTA (optional)
6. Save and verify card display
7. Edit and update
8. Delete

### Step 4: Test Dependencies
1. Create: Program → (later: Form) → CTA → Branch
2. Try to delete CTA that's used in branch → Should block
3. Remove branch first → Then can delete CTA

---

## What to Look For

### ✅ Good Signs
- Modals open/close smoothly
- Toast notifications appear on actions
- Validation errors show on blur
- IDs are required and validated
- Cards display all information correctly
- Edit/Delete buttons work
- Responsive grid (1-3 columns)

### ⚠️ Potential Issues to Check
- Console errors (F12 → Console tab)
- Form doesn't close after save
- Toast doesn't appear
- Validation doesn't trigger
- Modal backdrop not clickable (by design)
- Duplicate ID not caught

---

## Testing Tools

### Browser DevTools
- **Console (F12):** Check for errors
- **Network Tab:** Monitor requests
- **Responsive Mode (Ctrl+Shift+M):** Test mobile/tablet views

### Test Data Examples

**Programs:**
```
ID: volunteer_program
Name: Volunteer Programs
Description: Community volunteer opportunities
```

**CTAs:**
```
Start Form:
  ID: apply_volunteer
  Label: Apply to Volunteer
  Action: start_form
  Form: (select after creating form)

External Link:
  ID: learn_more
  Label: Learn More
  Action: external_link
  URL: https://example.com/volunteer

Send Query:
  ID: ask_question
  Label: Ask a Question
  Action: send_query
  Query: I have a question about volunteering

Show Info:
  ID: show_info
  Label: Program Info
  Action: show_info
  Prompt: Our volunteer program helps...
```

**Branches:**
```
ID: volunteer_inquiry
Keywords: volunteer, help, community, serve
Primary CTA: apply_volunteer
Secondary CTAs: learn_more, ask_question
```

---

## Expected Results

### Programs Editor
- **Lines Reduced:** 213 → 94 (56% reduction)
- **Features:**
  - Create/Edit/Delete programs
  - Duplicate ID validation
  - Dependency checking (if forms exist)
  - Toast notifications
  - Empty state

### Branches Editor
- **Lines Reduced:** 604 → 450 (25% reduction)
- **Features:**
  - Keyword management (add/remove badges)
  - Primary CTA selection (required)
  - Secondary CTAs (optional, max 2)
  - Always deletable (no dependencies)
  - Conditional UI if no CTAs exist

### CTAs Editor
- **Lines Reduced:** 580 → 495 (15% reduction)
- **Features:**
  - 4 action types with conditional fields
  - start_form → form dropdown
  - external_link → URL field
  - send_query → query textarea
  - show_info → prompt textarea
  - Dependency checking (branches may reference)

---

## Performance Benchmarks

Expected performance:
- **Initial Load:** < 2 seconds
- **Create/Edit/Delete:** Instant (< 100ms)
- **Modal Open/Close:** Smooth animation
- **Validation:** Real-time, no input lag
- **Grid Rendering:** Smooth scrolling with 20+ items

---

## Common Test Scenarios

### Scenario 1: Happy Path
1. Create program
2. Create CTA
3. Create branch with that CTA
4. Edit each one
5. Delete in reverse order

### Scenario 2: Validation Path
1. Try to create with empty fields → Errors
2. Try invalid ID formats → Errors
3. Try duplicate IDs → Errors
4. Fix all issues → Success

### Scenario 3: Dependency Path
1. Create CTA
2. Assign to branch
3. Try to delete CTA → Blocked
4. Remove from branch
5. Delete CTA → Success

### Scenario 4: Edge Cases
1. Create with very long names/descriptions
2. Create with special characters
3. Create 20+ entities
4. Test responsive design (resize browser)

---

## If Something Breaks

### Check Console
```bash
# Open browser DevTools (F12)
# Go to Console tab
# Look for red errors
```

### Common Issues

**Modal doesn't open:**
- Check console for errors
- Verify React rendering

**Form doesn't save:**
- Check validation errors
- Check console for errors
- Verify all required fields filled

**Dependencies not blocking delete:**
- Verify relationship created correctly
- Check getDependencies function in store

**Styling issues:**
- Check Tailwind classes
- Verify dark mode works
- Test responsive breakpoints

---

## Success Criteria

✅ **Must Pass:**
- All CRUD operations work (Create, Read, Update, Delete)
- Validation catches errors
- Dependencies block deletion appropriately
- Toast notifications appear
- No console errors during normal operations
- Responsive design works (mobile, tablet, desktop)

⚠️ **Nice to Have:**
- Smooth animations
- Perfect responsive layout
- All edge cases handled
- Keyboard shortcuts work

---

## After Testing

### If All Tests Pass:
1. Mark test tasks complete in todo list
2. Proceed with Forms Editor refactor (most complex)
3. Final comprehensive testing of all 4 editors

### If Issues Found:
1. Document in bug report format
2. Include console errors
3. Provide reproduction steps
4. I'll fix issues before proceeding

---

## Quick Access Links

- **Test Plan:** `PHASE_3_TEST_PLAN.md`
- **Implementation Docs:** `PHASE_3_REWRITE_COMPLETION.md`
- **Migration Guide:** `EDITOR_MIGRATION_GUIDE.md`
- **Dev Server:** http://localhost:3000

---

**Ready to test!** Open http://localhost:3000 and start with the Programs Editor.

Let me know what you find! 🚀
