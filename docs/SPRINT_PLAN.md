# PICASSO CONFIG BUILDER - MVP SPRINT PLAN

**Version**: 1.0
**Date**: 2025-10-15
**Owner**: Product Team
**Status**: Ready for Execution
**Timeline**: 2 weeks (10 working days)

---

## 1. SPRINT OVERVIEW

### Sprint Goal

> **"Deliver a production-ready web-based configuration tool that enables operations teams to deploy forms-enabled tenants in under 10 minutes with zero configuration errors."**

### Key Milestones

| Milestone | Date | Deliverables |
|-----------|------|--------------|
| **M1: Foundation Complete** | Day 3 (Wed) | Types, schemas, store setup, shared components, S3 service layer |
| **M2: MVP Functionality Complete** | Day 5 (Fri) | All 4 editors working (Programs, Forms, CTAs, Branches), validation engine |
| **M3: Testing Complete** | Day 7 (Tue) | Unit tests (>80% coverage), integration tests, E2E tests passing |
| **M4: Production Launch** | Day 10 (Fri) | 5 tenants deployed successfully, zero config errors, ops team trained |

### Definition of Done (MVP)

- [ ] All 15 PRD acceptance criteria met (lines 52-93)
- [ ] All validation rules implemented (PRD lines 109-284)
- [ ] Test coverage >80% (unit + integration)
- [ ] E2E tests passing for critical paths
- [ ] Load time <2s
- [ ] Zero configuration errors in first 5 tenant deployments
- [ ] Operations team trained and satisfied (>4/5 rating)
- [ ] Documentation complete (user guide, API docs, troubleshooting)
- [ ] Deployed to production with monitoring

### Success Criteria

From PRD lines 299-309:

| Metric | Baseline | Target | Measurement Period |
|--------|----------|--------|-------------------|
| Time to add forms to tenant | 60+ min (manual) | <10 min | First 90 days |
| Config validation error rate | 15% (estimated) | <1% | Ongoing |
| Config-related support tickets | 8/month (estimated) | <4/month | First 90 days |
| User satisfaction (ops team) | N/A | 4.5/5 | After 2 weeks of use |
| Tenants deployed with builder | 0 | 25+ | First 90 days |

---

## 2. DETAILED TASK BREAKDOWN

### Phase 1: Planning & Architecture (Complete ✅)

**Task 1.1: System Architecture Design**
- Agent: system-architect
- Time: 1 hour
- Status: ✅ Complete
- Deliverable: `docs/ARCHITECTURE.md`

**Task 1.2: Sprint Planning**
- Agent: Product-Manager
- Time: 1 hour
- Status: ✅ Complete
- Deliverable: `docs/SPRINT_PLAN.md`

### Phase 2: Foundation (Days 1-3)

**Task 2.1: Define TypeScript Types & Zod Schemas** (AC #2, #3, #4, #5, #6, #7, #8)
- Agent: typescript-specialist
- Time: 3 hours
- Dependencies: Architecture (1.1)
- Description: Create all type definitions for domain entities (Program, Form, CTA, Branch), API types, validation types, and Zod schemas
- Acceptance:
  - [ ] Types for all config entities defined
  - [ ] Zod schemas match TypeScript types
  - [ ] No `any` types
  - [ ] Type guards for discriminated unions
- Testing: `npm run typecheck` passes
- Deliverables:
  - `src/types/config.ts`
  - `src/types/api.ts`
  - `src/types/validation.ts`
  - `src/lib/schemas/*.schema.ts`

**Task 2.2: Build Shared UI Components** (All ACs)
- Agent: Frontend-Engineer
- Time: 4 hours
- Dependencies: Types (2.1)
- Description: Create reusable UI components using Radix UI primitives and Tailwind CSS
- Acceptance:
  - [ ] All shared components built (Button, Input, Select, Card, Modal, Toast)
  - [ ] Components use Tailwind with green theme (#4CAF50)
  - [ ] Accessible (ARIA attributes)
  - [ ] Type-safe props
- Testing: Component renders without errors
- Deliverables:
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Input.tsx`
  - `src/components/ui/Select.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Dialog.tsx`
  - `src/components/ui/Toast.tsx`
  - `src/components/layout/Layout.tsx`

**Task 2.3: Set Up Zustand Store** (All ACs)
- Agent: Frontend-Engineer
- Time: 2 hours
- Dependencies: Types (2.1)
- Description: Create Zustand store with domain slices (programs, forms, ctas, branches, validation, ui, config)
- Acceptance:
  - [ ] Store structure matches architecture design
  - [ ] All slices defined with actions and selectors
  - [ ] DevTools middleware enabled
  - [ ] Persist middleware for sessionStorage
- Testing: Store actions update state correctly
- Deliverables:
  - `src/store/index.ts`
  - `src/store/slices/*.slice.ts`

**Task 2.4: Implement S3 Service Layer** (AC #1, #2, #13)
- Agent: Backend-Engineer
- Time: 3 hours
- Dependencies: Types (2.1)
- Description: Create S3 client, tenant operations, config read/write with error handling
- Acceptance:
  - [ ] Can list tenants from S3
  - [ ] Can load config from S3
  - [ ] Can save config to S3
  - [ ] Error handling with retry logic
  - [ ] Loading states tracked
- Testing: Mock S3 operations, test error scenarios
- Deliverables:
  - `src/lib/api/s3-client.ts`
  - `src/lib/api/config-api.ts`
  - `src/hooks/useConfig.ts`

**Task 2.5: Build App Shell & Routing** (AC #1)
- Agent: Frontend-Engineer
- Time: 2 hours
- Dependencies: Shared components (2.2), Store (2.3)
- Description: Create app layout with header, sidebar, routing structure
- Acceptance:
  - [ ] Routes defined for all editors
  - [ ] Navigation works
  - [ ] Tenant selector in header
  - [ ] Responsive layout
- Testing: All routes navigate correctly
- Deliverables:
  - `src/App.tsx` (updated)
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`

### Phase 3: Core Editors (Days 3-5)

**Task 3.1: Build Programs Editor** (AC #3)
- Agent: Frontend-Engineer
- Time: 2 hours
- Dependencies: Foundation complete (2.1-2.5)
- Description: CRUD interface for programs (program_id, program_name, description)
- Acceptance:
  - [ ] Can create program
  - [ ] Can edit program
  - [ ] Can delete program (with dependency warning)
  - [ ] List view shows all programs
  - [ ] Validation on required fields
- Testing: Create, edit, delete program flows
- Deliverables:
  - `src/components/editors/programs/ProgramsEditor.tsx`
  - `src/components/editors/programs/ProgramForm.tsx`

**Task 3.2: Build Branch Editor** (AC #8)
- Agent: Frontend-Engineer
- Time: 4 hours
- Dependencies: Programs editor (3.1), CTAs created (3.4)
- Description: CRUD interface for conversation branches with detection keywords, priority, CTA assignment
- Acceptance:
  - [ ] Can create branch with keywords array
  - [ ] Can assign primary CTA
  - [ ] Can assign secondary CTAs (max 2)
  - [ ] Priority/sort order controls
  - [ ] Validation: keywords shouldn't be user queries
  - [ ] Validation: max 3 total CTAs warning
- Testing: Create branch, assign CTAs, validation tests
- Deliverables:
  - `src/components/editors/branches/BranchesEditor.tsx`
  - `src/components/editors/branches/BranchForm.tsx`
  - `src/components/editors/branches/KeywordInput.tsx`

**Task 3.3: Build CTA Editor** (AC #7)
- Agent: Frontend-Engineer
- Time: 4 hours
- Dependencies: Programs (3.1), Forms (3.4)
- Description: CRUD interface for CTAs with 3 action types (start_form, external_link, show_info)
- Acceptance:
  - [ ] Can create CTA with action type selector
  - [ ] Conditional fields based on action:
    - start_form → formId dropdown
    - external_link → URL input
    - show_info → prompt textarea
  - [ ] Button text editor
  - [ ] Validation per action type
  - [ ] Dependency tracking (which branches use this)
- Testing: Create each CTA type, validation tests
- Deliverables:
  - `src/components/editors/ctas/CTAsEditor.tsx`
  - `src/components/editors/ctas/CTAForm.tsx`
  - `src/components/editors/ctas/ActionTypeSelector.tsx`

**Task 3.4: Build Form Editor** (AC #4, #5, #6, #10)
- Agent: Frontend-Engineer
- Time: 6 hours
- Dependencies: Programs (3.1)
- Description: CRUD interface for forms with field collection, trigger phrases, post-submission config
- Acceptance:
  - [ ] Can create form with metadata (form_id, title, program)
  - [ ] Can add/edit/delete/reorder fields
  - [ ] Field types: text, email, phone, select, textarea
  - [ ] Field validation rules per type
  - [ ] Trigger phrases array input
  - [ ] Post-submission settings (message, next steps, actions)
  - [ ] Form-level validation
- Testing: Create form with 5+ fields, all field types, validation
- Deliverables:
  - `src/components/editors/forms/FormsEditor.tsx`
  - `src/components/editors/forms/FormMetadata.tsx`
  - `src/components/editors/forms/FieldCollection.tsx`
  - `src/components/editors/forms/FieldEditor.tsx`
  - `src/components/editors/forms/PostSubmission.tsx`

**Task 3.5: Build Content Showcase Editor** (AC #9 - Optional)
- Agent: Frontend-Engineer
- Time: 3 hours
- Dependencies: Programs (3.1), CTAs (3.3)
- Description: Configure content showcase with rich visual items (programs, events, campaigns, initiatives) using ad inventory model
- Acceptance:
  - [ ] Can create/edit/delete showcase items (CRUD)
  - [ ] Can set item type (program, event, initiative, campaign)
  - [ ] Can configure content (name, tagline, description, image_url)
  - [ ] Can add supporting details (stats, testimonial, highlights array)
  - [ ] Can define keyword triggers (array input)
  - [ ] Can link to existing CTAs (dropdown selector)
  - [ ] Can enable/disable showcase items (toggle)
  - [ ] Validation: cta_id must reference existing CTA
  - [ ] Validation: type must be one of allowed values
  - [ ] Validation: at least one keyword required
- Testing: Create showcase item, link to CTA, keyword matching
- Deliverables:
  - `src/components/editors/showcase/ContentShowcaseEditor.tsx`
  - `src/components/editors/showcase/ShowcaseItemForm.tsx`
  - `src/components/editors/showcase/KeywordInput.tsx` (can reuse from branches)

### Phase 4: Validation Engine (Day 5)

**Task 4.1: Implement Comprehensive Validation** (AC #11, #12)
- Agent: Backend-Engineer
- Time: 4 hours
- Dependencies: All editors (3.1-3.5)
- Description: Build validation engine with all rules from PRD lines 109-284
- Acceptance:
  - [ ] Field-level validation (Zod)
  - [ ] Entity-level validation (forms, CTAs, branches)
  - [ ] Cross-entity validation (relationships)
  - [ ] Dependency tracking
  - [ ] Pre-deployment validation suite
  - [ ] User-friendly error messages
  - [ ] Warning vs error distinction
- Testing: ~30 validation tests covering all rules
- Deliverables:
  - `src/lib/validation/ctaValidation.ts`
  - `src/lib/validation/formValidation.ts`
  - `src/lib/validation/branchValidation.ts`
  - `src/lib/validation/relationshipValidation.ts`
  - `src/lib/validation/dependencyTracking.ts`

**Task 4.2: Build Validation Panel UI** (AC #11)
- Agent: Frontend-Engineer
- Time: 2 hours
- Dependencies: Validation engine (4.1)
- Description: Real-time validation display panel showing errors and warnings
- Acceptance:
  - [ ] Shows all validation errors
  - [ ] Shows all validation warnings
  - [ ] Groups by entity type
  - [ ] Click to navigate to error location
  - [ ] Color-coded (red=error, yellow=warning)
- Testing: Display various validation states
- Deliverables:
  - `src/components/layout/ValidationPanel.tsx`

**Task 4.3: Implement Dependency Warnings** (AC #12)
- Agent: Frontend-Engineer
- Time: 2 hours
- Dependencies: Validation engine (4.1)
- Description: Show dependency warnings before deleting entities
- Acceptance:
  - [ ] Modal shows all dependencies before delete
  - [ ] Lists forms, CTAs, branches using entity
  - [ ] "Delete Anyway" vs "Cancel" options
  - [ ] Cascade delete option (if safe)
- Testing: Delete program with dependencies, verify warning
- Deliverables:
  - `src/components/ui/DependencyWarningDialog.tsx`

### Phase 5: Deployment Workflow (Day 6)

**Task 5.1: Implement Config Merge Strategy** (AC #13)
- Agent: Backend-Engineer
- Time: 2 hours
- Dependencies: S3 layer (2.4), All editors (3.1-3.5)
- Description: Merge edited sections back into full config for deployment
- Acceptance:
  - [ ] Merges programs, forms, CTAs, branches, cards
  - [ ] Preserves read-only sections (branding, features, aws)
  - [ ] Increments version number
  - [ ] Updates generated_at timestamp
- Testing: Load config, edit, merge, verify structure
- Deliverables:
  - `src/lib/api/mergeStrategy.ts`

**Task 5.2: Build Deployment UI** (AC #13)
- Agent: Frontend-Engineer
- Time: 3 hours
- Dependencies: Merge strategy (5.1), Validation (4.1)
- Description: Deploy button, confirmation dialog, deployment summary
- Acceptance:
  - [ ] Deploy button enabled only when valid
  - [ ] Shows deployment summary before confirm
  - [ ] Lists: X programs, Y forms, Z CTAs, W branches
  - [ ] Shows non-blocking warnings
  - [ ] Progress indicator during upload
  - [ ] Success/error feedback
- Testing: Deploy valid config, test error scenarios
- Deliverables:
  - `src/components/deploy/DeployButton.tsx`
  - `src/components/deploy/DeployDialog.tsx`
  - `src/components/deploy/DeploymentSummary.tsx`


**Task 5.3: Implement Auto-Save to SessionStorage** (AC #13)
- Agent: Backend-Engineer
- Time: 1 hour
- Dependencies: Store (2.3)
- Description: Auto-save drafts every 30 seconds, recover on reload
- Acceptance:
  - [ ] Saves to sessionStorage every 30s (debounced)
  - [ ] Recovers unsaved work on page reload
  - [ ] Clears on successful deployment
  - [ ] Shows "Unsaved changes" indicator
- Testing: Edit, reload, verify recovery
- Deliverables:
  - `src/hooks/useAutoSave.ts`

### Phase 6: Quality Assurance (Days 7-8)

**Task 6.1: Write Unit Tests** (Coverage Target: >80%)
- Agent: test-engineer
- Time: 6 hours
- Dependencies: All implementation complete
- Description: Unit tests for validation, store, utilities, type guards
- Acceptance:
  - [ ] Validation engine: ~30 tests
  - [ ] Store slices: ~20 tests
  - [ ] Type guards: ~10 tests
  - [ ] Utility functions: ~15 tests
  - [ ] Component tests: ~25 tests
  - [ ] Coverage >80%
- Testing Framework: Vitest + React Testing Library
- Deliverables:
  - `src/lib/validation/__tests__/*.test.ts`
  - `src/store/__tests__/*.test.ts`
  - `src/components/**/__tests__/*.test.tsx`

**Task 6.2: Write Integration Tests**
- Agent: test-engineer
- Time: 3 hours
- Dependencies: Unit tests (6.1)
- Description: Test full workflows (load → edit → validate → deploy)
- Acceptance:
  - [ ] Test complete form creation workflow
  - [ ] Test CTA creation and branch assignment
  - [ ] Test validation pipeline
  - [ ] Test deployment with S3 mocks
  - [ ] ~20-30 integration tests
- Testing: Full user workflows
- Deliverables:
  - `src/__tests__/integration/*.test.tsx`

**Task 6.3: Write E2E Tests**
- Agent: qa-automation-specialist
- Time: 4 hours
- Dependencies: App deployed to test environment
- Description: E2E tests for critical paths using Playwright
- Acceptance:
  - [ ] Test: Load tenant → Edit form → Validate → Deploy
  - [ ] Test: Create branch → Link CTAs → Save
  - [ ] Test: Delete with dependency warning
  - [ ] Test: Validation error blocking deployment
  - [ ] Test: Cross-browser (Chrome, Firefox, Safari)
  - [ ] 5 critical path tests
- Testing Framework: Playwright
- Deliverables:
  - `e2e/form-creation.spec.ts`
  - `e2e/branch-editor.spec.ts`
  - `e2e/deployment.spec.ts`
  - `e2e/validation.spec.ts`

**Task 6.4: Code Review**
- Agent: code-reviewer
- Time: 2 hours
- Dependencies: All code complete
- Description: Comprehensive code review for quality, performance, security
- Acceptance:
  - [ ] Review architecture adherence
  - [ ] Check type safety
  - [ ] Identify performance issues
  - [ ] Security concerns
  - [ ] Accessibility issues
  - [ ] Documentation gaps
- Deliverable: Code review report with recommendations

### Phase 7: Documentation & Polish (Day 9)

**Task 7.1: Write User Guide**
- Agent: technical-writer
- Time: 3 hours
- Dependencies: App complete
- Description: Step-by-step user guide with screenshots
- Acceptance:
  - [ ] Getting started section
  - [ ] Walkthrough for each editor
  - [ ] Validation guide
  - [ ] Deployment process
  - [ ] Troubleshooting section
- Deliverable: `docs/USER_GUIDE.md`

**Task 7.2: Write API Documentation**
- Agent: technical-writer
- Time: 2 hours
- Dependencies: Implementation complete
- Description: Document S3 integration, config schema, validation API
- Acceptance:
  - [ ] S3 operations documented
  - [ ] Config schema v1.3 explained
  - [ ] Validation rules reference
  - [ ] Code examples
- Deliverable: `docs/API_DOCUMENTATION.md`

**Task 7.3: DX Improvements**
- Agent: dx-engineer
- Time: 2 hours
- Dependencies: User feedback (if available)
- Description: Improve error messages, loading states, keyboard shortcuts
- Acceptance:
  - [ ] Clear error messages with suggestions
  - [ ] Better loading indicators
  - [ ] Keyboard shortcuts (Ctrl+S to save, etc.)
  - [ ] Better validation feedback
- Deliverable: UX improvements merged

### Phase 8: Deployment & Launch (Day 10)

**Task 8.1: Production Build & Deployment** (AC #14, #15)
- Agent: Release-Manager
- Time: 2 hours
- Dependencies: All testing complete
- Description: Build for production, deploy to hosting, configure environment
- Acceptance:
  - [ ] Production build created
  - [ ] Deployed to S3 + CloudFront (or similar)
  - [ ] Environment variables configured
  - [ ] SSL certificate active
  - [ ] Monitoring configured
- Deliverable: Production URL

**Task 8.2: Deploy 5 Test Tenants** (AC #15)
- Agent: Release-Manager
- Time: 2 hours
- Dependencies: Production deployed (8.1)
- Description: Deploy 5 tenant configs to verify zero errors
- Acceptance:
  - [ ] 5 tenants configured and deployed
  - [ ] Zero configuration errors
  - [ ] Forms work in production Picasso widget
  - [ ] CTAs and branches function correctly
  - [ ] Time to deploy <10 min per tenant
- Success Criteria: AC #14 and #15 met

**Task 8.3: Operations Team Training**
- Agent: technical-writer + ops team
- Time: 2 hours
- Dependencies: Production live (8.1)
- Description: Train operations team, provide documentation
- Acceptance:
  - [ ] 2-hour training session completed
  - [ ] User guide shared
  - [ ] Video walkthrough recorded (15 min)
  - [ ] Q&A session
  - [ ] Satisfaction survey: >4/5 rating
- Deliverable: Trained operations team

---

## 3. DEPENDENCY MAP

### Critical Path (42 hours)

```
1.1 Architecture (1h)
  ↓
2.1 Types (3h) ──────────┐
  ↓                      │
2.2 Shared Components (4h)
  ↓
2.3 Store Setup (2h)
  ↓
2.5 App Shell (2h)
  ↓
3.1 Programs Editor (2h)
  ↓
3.4 Form Editor (6h) ────┤
  ↓                      │
3.3 CTA Editor (4h) ─────┤
  ↓                      │
3.2 Branch Editor (4h)   │
  ↓                      │
4.1 Validation (4h) ←────┘
  ↓
4.2 Validation UI (2h)
  ↓
5.1 Merge Strategy (2h)
  ↓
5.2 Deployment UI (3h)
  ↓
6.1 Unit Tests (6h)
  ↓
8.1 Deployment (2h)
  ↓
8.2 Test Tenants (2h)
────────────────────────
Total: 42 hours = 5.25 days
```

### Parallel Work Opportunities

**Days 1-3: Foundation Phase**
- 2.4 S3 Service Layer (3h) can run parallel to 2.2/2.3

**Days 3-5: Editor Phase**
- 3.5 Card Inventory (2h) can run parallel to other editors

**Days 7-8: QA Phase**
- 6.1 Unit Tests (6h)
- 6.2 Integration Tests (3h)  ← Can run parallel
- 6.3 E2E Tests (4h)           ← Can run parallel

**Day 9: Documentation Phase**
- 7.1 User Guide (3h)
- 7.2 API Docs (2h)      ← Can run parallel
- 7.3 DX Improvements (2h) ← Can run parallel

### Bottleneck: Frontend-Engineer

Frontend-Engineer is on critical path for 29 hours:
- 2.2 Shared Components: 4h
- 2.3 Store: 2h
- 2.5 App Shell: 2h
- 3.1 Programs: 2h
- 3.2 Branches: 4h
- 3.3 CTAs: 4h
- 3.4 Forms: 6h
- 4.2 Validation UI: 2h
- 5.2 Deployment UI: 3h

**Mitigation**: Break editors into worktrees if needed (Phase 3 decision).

---

## 4. RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigation | Owner | Timeline |
|------|-----------|--------|------------|-------|----------|
| **R1: Config corruption breaks production widgets** | Medium | Critical | • Backup system before save<br>• S3 versioning enabled<br>• Rollback plan documented<br>• Server-side validation | Backend-Engineer | Day 6 |
| **R2: S3 permission issues block deployments** | Medium | High | • Test S3 access on Day 1<br>• Least-privilege IAM policies<br>• Clear error messages<br>• Fallback to read-only mode | Backend-Engineer | Day 1 |
| **R3: Validation gaps cause runtime errors** | Medium | High | • Comprehensive test coverage (>80%)<br>• All PRD rules implemented<br>• E2E tests for critical paths | test-engineer, qa-automation-specialist | Days 7-8 |
| **R4: Poor UX leads to low adoption** | Low | High | • User testing with ops team<br>• Clear validation messages<br>• Contextual help tooltips<br>• Video walkthrough | dx-engineer, technical-writer | Days 8-10 |
| **R5: Performance degradation with large configs** | Low | Medium | • Virtualized lists<br>• Lazy validation (debounced)<br>• Code splitting<br>• Bundle size monitoring | Frontend-Engineer | Days 1-5 |
| **R6: Timeline pressure causes scope creep** | High | Medium | • Daily tracking<br>• Clear scope boundaries<br>• Defer Phase 2/3 features<br>• Focus on 15 MVP criteria only | Product-Manager | Daily |
| **R7: Complex validation logic has bugs** | Medium | Medium | • 30+ validation tests<br>• Edge case coverage<br>• Dependency tracking tests | test-engineer | Day 7 |
| **R8: S3 writes fail silently** | Low | Medium | • Explicit error handling<br>• Retry logic with exponential backoff<br>• Toast notifications | Backend-Engineer | Day 6 |
| **R9: Type mismatches between config versions** | Low | Low | • Zod runtime validation<br>• Migration warnings<br>• Schema version checks | typescript-specialist | Day 1 |
| **R10: Merge conflicts if parallel editors** | Medium | Low | • Clear component boundaries<br>• Use worktrees<br>• Decide after Phase 2 | All | Day 3 |

---

## 5. DAILY BREAKDOWN

### Day 1 (Monday) - Foundation Start

**8:00-11:00** | typescript-specialist | Task 2.1: Define Types & Schemas (3h)
- Create all TypeScript types
- Define Zod schemas
- Type guards for discriminated unions

**8:00-11:00** | Backend-Engineer | Task 2.4: S3 Service Layer (3h) [Parallel]
- S3 client setup
- Tenant operations
- Config read/write

**11:00-15:00** | Frontend-Engineer | Task 2.2: Shared UI Components (4h)
- Build UI component library
- Radix UI + Tailwind
- Accessible components

**15:00-17:00** | Frontend-Engineer | Task 2.3: Zustand Store Setup (2h)
- Create store with slices
- DevTools + persist middleware

**Total**: 12 hours (3 agents parallel)

---

### Day 2 (Tuesday) - Foundation Complete

**8:00-10:00** | Frontend-Engineer | Task 2.5: App Shell & Routing (2h)
- Build layout
- Set up routing
- Tenant selector

**10:00-12:00** | Frontend-Engineer | Task 3.1: Programs Editor (2h)
- CRUD interface for programs
- List view + form

**13:00-17:00** | Frontend-Engineer | Task 3.4: Form Editor Start (4h of 6h)
- Form metadata editor
- Field collection UI

**Total**: 8 hours

---

### Day 3 (Wednesday) - M1: Foundation Complete

**8:00-10:00** | Frontend-Engineer | Task 3.4: Form Editor Complete (2h)
- Post-submission config
- Trigger phrases
- Validation

**10:00-12:00** | Frontend-Engineer | Task 3.5: Card Inventory Editor (2h)
- Card strategy selector
- Requirements editor
- Program cards

**Total**: 4 hours

**MILESTONE 1 ACHIEVED**: Foundation Complete ✅

---

### Day 4 (Thursday) - Editors Development

**8:00-12:00** | Frontend-Engineer | Task 3.3: CTA Editor (4h)
- Action type selector
- Conditional fields
- Button text editor
- Dependency tracking

**13:00-17:00** | Frontend-Engineer | Task 3.2: Branch Editor (4h)
- Keywords array input
- CTA selectors (primary + secondary)
- Priority controls
- Validation UI

**Total**: 8 hours

---

### Day 5 (Friday) - M2: MVP Functionality Complete

**8:00-12:00** | Backend-Engineer | Task 4.1: Validation Engine (4h)
- Implement all validation rules
- Dependency tracking
- Error messages

**12:00-14:00** | Frontend-Engineer | Task 4.2: Validation Panel (2h)
- Real-time validation display
- Error/warning grouping

**14:00-16:00** | Frontend-Engineer | Task 4.3: Dependency Warnings (2h)
- Dependency warning dialog
- Delete confirmation

**Total**: 8 hours

**MILESTONE 2 ACHIEVED**: MVP Functionality Complete ✅

---

### Day 6 (Monday) - Deployment Workflow

**8:00-10:00** | Backend-Engineer | Task 5.1: Config Merge Strategy (2h)
- Merge edited sections
- Preserve read-only fields
- Version incrementing

**10:00-13:00** | Frontend-Engineer | Task 5.2: Deployment UI (3h)
- Deploy button
- Confirmation dialog
- Deployment summary
- Progress indicators

**13:00-14:00** | Backend-Engineer | Task 5.3: Auto-Save (1h)
- SessionStorage auto-save
- Recovery on reload

**Total**: 6 hours

---

### Day 7 (Tuesday) - M3: Testing Complete

**8:00-14:00** | test-engineer | Task 6.1: Unit Tests (6h)
- Validation tests (~30)
- Store tests (~20)
- Component tests (~25)
- Utility tests (~25)
- Coverage >80%

**8:00-11:00** | test-engineer | Task 6.2: Integration Tests (3h) [Parallel]
- Workflow tests (~20-30)

**8:00-12:00** | qa-automation-specialist | Task 6.3: E2E Tests (4h) [Parallel]
- Playwright tests (5 critical paths)

**14:00-16:00** | code-reviewer | Task 6.4: Code Review (2h)
- Architecture review
- Performance review
- Security review

**Total**: 15 hours (3 agents parallel)

**MILESTONE 3 ACHIEVED**: Testing Complete ✅

---

### Day 8 (Wednesday) - Test Fixes & Polish

**8:00-17:00** | All agents | Fix issues from code review and testing
- Address code review feedback
- Fix failing tests
- Performance optimizations
- Bug fixes

**Total**: Variable (8 hours estimated)

---

### Day 9 (Thursday) - Documentation

**8:00-11:00** | technical-writer | Task 7.1: User Guide (3h)
- Getting started
- Editor walkthroughs
- Troubleshooting

**8:00-10:00** | technical-writer | Task 7.2: API Documentation (2h) [Parallel]
- S3 integration docs
- Config schema docs

**8:00-10:00** | dx-engineer | Task 7.3: DX Improvements (2h) [Parallel]
- Error message improvements
- Keyboard shortcuts
- Loading states

**Total**: 7 hours (3 agents parallel)

---

### Day 10 (Friday) - M4: Production Launch

**8:00-10:00** | Release-Manager | Task 8.1: Production Deployment (2h)
- Build for production
- Deploy to hosting
- Configure environment
- Set up monitoring

**10:00-12:00** | Release-Manager | Task 8.2: Deploy 5 Test Tenants (2h)
- Configure 5 tenants
- Verify zero errors
- Time each deployment (<10 min)

**13:00-15:00** | technical-writer + ops | Task 8.3: Operations Training (2h)
- Training session
- Video walkthrough
- Q&A
- Satisfaction survey

**Total**: 6 hours

**MILESTONE 4 ACHIEVED**: Production Launch ✅

---

## 6. RESOURCE ALLOCATION

### Agent Utilization Summary

| Agent | Total Hours | % of Total | Critical Path Hours |
|-------|-------------|-----------|-------------------|
| Frontend-Engineer | 33h | 40% | 29h |
| Backend-Engineer | 13h | 16% | 9h |
| typescript-specialist | 3h | 4% | 3h |
| test-engineer | 9h | 11% | 6h |
| qa-automation-specialist | 4h | 5% | 0h (parallel) |
| code-reviewer | 2h | 2% | 0h |
| technical-writer | 5h | 6% | 0h (parallel) |
| dx-engineer | 2h | 2% | 0h (parallel) |
| Release-Manager | 6h | 7% | 4h |
| system-architect | 1h | 1% | 1h |
| Product-Manager | 1h | 1% | 0h (parallel) |
| **Total** | **79h** | **100%** | **42h** |

### Workload by Phase

| Phase | Duration | Agents | Hours |
|-------|----------|--------|-------|
| 1 - Planning | 1h | 2 (parallel) | 2h |
| 2 - Foundation | 1.5 days | 3 | 20h |
| 3 - Editors | 2 days | 1 | 18h |
| 4 - Validation | 0.5 days | 2 | 8h |
| 5 - Deployment | 0.5 days | 2 | 6h |
| 6 - Testing | 1.5 days | 3 (parallel) | 15h |
| 7 - Docs | 1 day | 3 (parallel) | 7h |
| 8 - Launch | 1 day | 2 | 6h |
| **Total** | **10 days** | | **82h** |

### Bottleneck Analysis

**Frontend-Engineer**: 33 hours (40% of total work)
- Critical path: 29 hours
- If Frontend-Engineer delays by 1 day → Project delays by 1 day

**Mitigation Options**:
1. Use worktrees to parallelize editor development (Day 3 decision)
2. Split editor work across multiple Frontend-Engineer instances
3. Accept sequential approach (safer, 2 days longer)

---

## 7. TESTING STRATEGY

### Test Pyramid

```
           /\
          /  \         5 E2E Tests
         /____\        (Playwright)
        /      \
       / 30 IT  \      30 Integration Tests
      /  Tests   \     (React Testing Library)
     /____________\
    /              \
   / 100 Unit Tests \  100 Unit Tests
  /__________________\ (Vitest)
```

### Coverage Targets

| Category | Target | Framework |
|----------|--------|-----------|
| Unit | >80% | Vitest |
| Integration | >60% | React Testing Library |
| E2E | 5 critical paths | Playwright |

### Unit Test Scenarios (~100 tests)

**Validation Engine (30 tests)**:
- CTA validation: action type requirements (6 tests)
- Form validation: required fields, field types (8 tests)
- Branch validation: keywords, priority, CTAs (6 tests)
- Relationship validation: cross-entity checks (6 tests)
- Dependency tracking: usage tracking (4 tests)

**Store Slices (20 tests)**:
- Programs slice: CRUD operations (4 tests)
- Forms slice: CRUD + field management (6 tests)
- CTAs slice: CRUD + conditional fields (4 tests)
- Branches slice: CRUD + CTA assignment (4 tests)
- Config slice: load/save/merge (2 tests)

**Type Guards (10 tests)**:
- CTA type guards: isFormCTA, isExternalLinkCTA, isShowInfoCTA (3 tests)
- Form field type guards (3 tests)
- Validation result guards (2 tests)
- Config entity guards (2 tests)

**Utility Functions (15 tests)**:
- String utilities (5 tests)
- Date utilities (3 tests)
- Config utilities (5 tests)
- Type converters (2 tests)

**Component Tests (25 tests)**:
- Shared UI components: Button, Input, Select, Card (8 tests)
- Layout components: Header, Sidebar (4 tests)
- Editor components: ProgramForm, CTAForm, BranchForm (9 tests)
- Validation UI: ValidationPanel, DependencyWarning (4 tests)

### Integration Test Scenarios (~30 tests)

**Workflow Tests**:
1. Load tenant config from S3
2. Create new program
3. Create form with 5 fields (all types)
4. Assign form to program
5. Add trigger phrases
6. Create CTA referencing form
7. Create branch with CTA assignment
8. Run validation
9. Deploy to S3
10. Verify merged config structure

**Error Handling**:
1. S3 load failure
2. Invalid config structure
3. Validation errors blocking deployment
4. Dependency warning on delete
5. Network timeout on save

**Edge Cases**:
1. Empty config
2. Large config (20+ forms, 30+ CTAs)
3. Circular dependencies
4. Missing references
5. Malformed data

### E2E Test Critical Paths (5 tests)

**Path 1: Complete Form Creation Flow** (AC #3, #4, #5, #6, #10, #13)
1. Login / select tenant
2. Create program "Love Box"
3. Create form "Love Box Application"
4. Add 5 fields (text, email, phone, select, textarea)
5. Assign to "Love Box" program
6. Add trigger phrases
7. Configure post-submission
8. Validate (expect pass)
9. Deploy to S3
10. Verify in production Picasso

**Path 2: CTA Creation & Branch Assignment** (AC #7, #8, #13)
1. Select tenant
2. Create CTA "Apply for Love Box" (action: start_form)
3. Create CTA "Learn More" (action: show_info)
4. Create branch "lovebox_discussion"
5. Assign primary CTA
6. Assign secondary CTA
7. Validate
8. Deploy
9. Verify in production

**Path 3: Dependency Warning Flow** (AC #12)
1. Select tenant with existing data
2. Attempt to delete program used by form
3. Verify dependency warning modal appears
4. Check warning lists form dependencies
5. Cancel delete
6. Delete form first
7. Delete program (should succeed)

**Path 4: Validation Error Blocking Deployment** (AC #11)
1. Select tenant
2. Create CTA with action "start_form" but no formId
3. Run validation (expect error)
4. Verify deploy button disabled
5. Fix error (add formId)
6. Verify deploy button enabled

**Path 5: Cross-Browser Compatibility** (AC #14)
1. Open in Chrome: Create form → Deploy
2. Open in Firefox: Edit form → Deploy
3. Open in Safari: Create CTA → Deploy
4. Verify all work correctly
5. Check load time <2s in all browsers

### Manual QA Checklist

**Pre-Deployment** (Day 9):
- [ ] All 15 acceptance criteria met
- [ ] Validation rules from PRD implemented
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Load time <2s
- [ ] Responsive design works (desktop only)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (basic)

**Post-Deployment** (Day 10):
- [ ] Production URL accessible
- [ ] SSL certificate valid
- [ ] All routes work
- [ ] Can load tenant list
- [ ] Can create/edit/delete entities
- [ ] Validation works
- [ ] Deployment to S3 works
- [ ] Configs appear in production Picasso

**Cross-Browser** (Chrome, Firefox, Safari):
- [ ] App loads
- [ ] All editors function
- [ ] Deployment works
- [ ] No visual glitches

---

## 8. PHASE 2/3 PREPARATION

### Architectural Decisions Enabling Future Phases

**For Phase 2 (Templates)**:
- ✅ Store structure supports templates (add `templates` slice)
- ✅ Form/CTA/Branch types are reusable
- ✅ Validation engine works on any config
- ✅ Merge strategy can handle template-generated configs

**Quick Win**: Create basic template structure now
```typescript
interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'volunteer' | 'donation' | 'contact' | 'support';
  preFilledForm: Partial<ConversationalForm>;
}
```

**For Phase 3 (Visual Builder)**:
- ✅ Component architecture supports drag-drop
- ✅ Field editor can be extended to visual palette
- ✅ Live preview possible via iframe
- ✅ Validation feedback already visual

**Quick Win**: Make field editor drag-reorderable now
```typescript
// Use react-beautiful-dnd or @dnd-kit
<FieldCollection>
  {fields.map((field, index) => (
    <DraggableField field={field} index={index} onReorder={handleReorder} />
  ))}
</FieldCollection>
```

### Refactoring to Avoid Later

**1. Component Props**: Keep shallow, use store selectors
```typescript
// Avoid:
<FormEditor form={form} programs={programs} ctas={ctas} validation={validation} />

// Better:
<FormEditor formId={formId} /> // Fetches from store internally
```

**2. Validation Engine**: Keep modular, avoid monolith
```typescript
// Each validator is independent
const formErrors = validateForm(form, state);
const ctaErrors = validateCTA(cta, state);
const branchErrors = validateBranch(branch, state);
const relationshipErrors = validateRelationships(state);

// Easy to add new validators later
```

**3. Type System**: Use discriminated unions for extensibility
```typescript
// Allows adding new action types in Phase 2
type CTAAction =
  | { type: 'start_form'; formId: string }
  | { type: 'external_link'; url: string }
  | { type: 'show_info'; prompt: string }
  | { type: 'new_action'; newField: string }; // Easy to add
```

---

## 9. LAUNCH CHECKLIST

### Pre-Deployment Checklist (Day 9)

**Code Quality**:
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.error or console.warn in production build
- [ ] Code review feedback addressed
- [ ] Test coverage >80%
- [ ] All E2E tests passing

**Functional Testing**:
- [ ] All 15 acceptance criteria verified manually
- [ ] Validation rules tested (spot check 20 rules)
- [ ] Dependency warnings tested
- [ ] Deployment workflow tested end-to-end
- [ ] Error handling tested (S3 failures, validation errors)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

**Performance**:
- [ ] Load time <2s (measured with DevTools)
- [ ] Bundle size <300KB gzipped (check with `npm run build:analyze`)
- [ ] No memory leaks (check with DevTools Memory profiler)
- [ ] Smooth animations (60fps on interactions)

**Security**:
- [ ] No sensitive data in client-side code
- [ ] S3 access via Lambda proxy (no direct browser access)
- [ ] Input sanitization in place
- [ ] HTTPS enforced
- [ ] CORS configured correctly

**Documentation**:
- [ ] User guide complete (`docs/USER_GUIDE.md`)
- [ ] API documentation complete (`docs/API_DOCUMENTATION.md`)
- [ ] README updated with deployment instructions
- [ ] CONTRIBUTING.md created (if needed)
- [ ] Troubleshooting guide complete

**Infrastructure**:
- [ ] Production environment configured
- [ ] Environment variables set
- [ ] S3 bucket permissions verified
- [ ] IAM roles configured (least privilege)
- [ ] SSL certificate installed
- [ ] Monitoring configured (CloudWatch or similar)
- [ ] Error tracking configured (Sentry or similar)
- [ ] Backup strategy documented

### Deployment Steps (Day 10)

**Step 1: Build for Production** (30 min)
```bash
cd picasso-config-builder
npm run build:production
# Verify output in dist/
ls -lh dist/
# Check bundle size
du -sh dist/*
```

**Step 2: Deploy to Hosting** (30 min)
```bash
# Option A: S3 + CloudFront
aws s3 sync dist/ s3://picasso-config-builder-prod --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"

# Option B: Netlify
netlify deploy --prod

# Option C: Vercel
vercel --prod
```

**Step 3: Verify Deployment** (15 min)
- [ ] Access production URL
- [ ] Check HTTPS works
- [ ] Verify all routes load
- [ ] Test tenant selection
- [ ] Quick smoke test: create program → save

**Step 4: Configure Monitoring** (15 min)
- [ ] CloudWatch dashboard configured
- [ ] Error alerts set up (email/Slack)
- [ ] Performance alerts set up (load time >3s)
- [ ] Usage tracking enabled (Google Analytics or similar)

### Post-Deployment Verification (Day 10)

**Smoke Tests** (30 min):
1. Load tenant list from S3 ✅
2. Load existing tenant config ✅
3. Create new program ✅
4. Create new form with 3 fields ✅
5. Create new CTA ✅
6. Create new branch ✅
7. Run validation ✅
8. Deploy config to S3 ✅
9. Verify config in Picasso widget ✅

**5 Test Tenant Deployments** (AC #15) (1 hour):
1. **Tenant A**: Create 2 programs, 3 forms, 5 CTAs, 2 branches → Deploy → Verify
2. **Tenant B**: Create 1 program, 2 forms, 3 CTAs, 1 branch → Deploy → Verify
3. **Tenant C**: Create 3 programs, 5 forms, 8 CTAs, 4 branches → Deploy → Verify
4. **Tenant D**: Edit existing config, add 1 form → Deploy → Verify
5. **Tenant E**: Edit existing config, add 2 CTAs, 1 branch → Deploy → Verify

**Success Criteria**:
- [ ] All 5 deployments successful (zero errors)
- [ ] Time to deploy <10 min per tenant
- [ ] Forms work in production Picasso widget
- [ ] CTAs appear correctly
- [ ] Branches trigger appropriate responses

### Rollback Plan

**If critical issue found post-deployment:**

1. **Immediate**: Revert to previous version
   ```bash
   # S3 rollback (if using S3 versioning)
   aws s3api list-object-versions --bucket picasso-config-builder-prod --prefix index.html
   aws s3api delete-object --bucket picasso-config-builder-prod --key index.html --version-id <current>
   ```

2. **Communicate**: Notify operations team

3. **Investigate**: Check logs, reproduce issue

4. **Fix**: Create hotfix branch, test, redeploy

5. **Document**: Add to troubleshooting guide

### Operations Handoff (Day 10)

**Training Session** (2 hours):
- Walkthrough of user guide
- Live demo: Create form end-to-end
- Q&A session
- Share video walkthrough link

**Documentation Shared**:
- [ ] User guide (`docs/USER_GUIDE.md`)
- [ ] Troubleshooting guide (`docs/TROUBLESHOOTING.md`)
- [ ] Video walkthrough (15 min)
- [ ] Production URL
- [ ] Support contact (who to ask for help)

**Satisfaction Survey**:
- [ ] Survey sent to operations team
- [ ] Target: >4/5 rating
- [ ] Collect feedback for Phase 2

### Go/No-Go Decision Criteria

**GO** if:
- ✅ All 15 acceptance criteria met
- ✅ Test coverage >80%
- ✅ E2E tests passing
- ✅ Load time <2s
- ✅ Zero critical bugs
- ✅ Rollback plan documented
- ✅ Operations team trained

**NO-GO** if:
- ❌ Any acceptance criteria not met
- ❌ Test coverage <70%
- ❌ Critical bugs unresolved
- ❌ Security vulnerabilities identified
- ❌ Load time >3s
- ❌ Deployment process untested

---

## 10. SUCCESS METRICS TRACKING

### Baseline Metrics (Day 10)

| Metric | How to Measure | Baseline (Manual) | Target (Builder) |
|--------|---------------|-------------------|------------------|
| **Time to deploy** | Stopwatch during 5 test deployments | 60+ min | <10 min |
| **Config errors** | Count validation errors in first 5 deployments | ~15% | 0% |
| **Load time** | Chrome DevTools Performance tab | N/A | <2s |
| **User satisfaction** | Survey after training | N/A | >4/5 |
| **Support tickets** | Track in first 30 days | ~8/month | <4/month |

### Day 10 Measurements

**5 Test Tenant Deployments**:
- Tenant A: _____ minutes ✅/❌
- Tenant B: _____ minutes ✅/❌
- Tenant C: _____ minutes ✅/❌
- Tenant D: _____ minutes ✅/❌
- Tenant E: _____ minutes ✅/❌
- **Average**: _____ minutes (Target: <10 min)

**Config Error Rate**:
- Validation errors during deployment: _____ (Target: 0)
- Runtime errors in Picasso: _____ (Target: 0)
- **Error Rate**: _____ % (Target: <1%)

**Load Time** (Chrome DevTools):
- First Contentful Paint: _____ ms
- Largest Contentful Paint: _____ ms
- Time to Interactive: _____ ms
- **Total Load Time**: _____ s (Target: <2s)

**User Satisfaction** (Survey after training):
- Question 1: How easy is the tool to use? (1-5): _____
- Question 2: How clear is the validation feedback? (1-5): _____
- Question 3: How confident are you deploying tenants? (1-5): _____
- Question 4: Would you recommend this tool? (1-5): _____
- **Average Rating**: _____ /5 (Target: >4/5)

### Dashboard Setup

**Create Monitoring Dashboard** (CloudWatch/Datadog/Grafana):

**Widgets**:
1. **Usage Metrics**:
   - Daily active users
   - Tenants deployed per day
   - Average deployment time

2. **Performance Metrics**:
   - Page load time (p50, p95, p99)
   - API response time
   - Error rate

3. **Business Metrics**:
   - Time saved vs manual (calculated)
   - Support tickets per month
   - User satisfaction trend

4. **Alerts**:
   - Load time >3s
   - Error rate >1%
   - Deployment failures

### Ongoing Tracking (Post-Launch)

**Weekly** (Operations Manager):
- Track deployments completed
- Track average deployment time
- Track support tickets related to config builder

**Monthly** (Product Manager):
- Review dashboard metrics
- Analyze user satisfaction trends
- Identify areas for improvement
- Plan Phase 2 enhancements

**Quarterly** (Executive Review):
- Total tenants deployed
- Time saved vs manual
- ROI calculation
- Phase 2/3 go/no-go decision

---

## APPENDIX A: ACCEPTANCE CRITERIA MAPPING

| PRD AC | Tasks | Agent | Day |
|--------|-------|-------|-----|
| **AC #1**: User sees list of tenants from S3 | 2.4 S3 Service Layer, 2.5 App Shell | Backend-Engineer, Frontend-Engineer | 1-2 |
| **AC #2**: User loads existing config (read-only display) | 2.4 S3 Service Layer, 2.1 Types | Backend-Engineer, typescript-specialist | 1 |
| **AC #3**: User creates programs | 3.1 Programs Editor | Frontend-Engineer | 2 |
| **AC #4**: User creates forms with 5+ fields | 3.4 Form Editor | Frontend-Engineer | 2-3 |
| **AC #5**: User assigns form to program | 3.4 Form Editor | Frontend-Engineer | 2-3 |
| **AC #6**: User adds trigger phrases to form | 3.4 Form Editor | Frontend-Engineer | 2-3 |
| **AC #7**: User creates CTAs (3 action types) | 3.3 CTA Editor | Frontend-Engineer | 4 |
| **AC #8**: User creates branches with keywords, priority, CTAs | 3.2 Branch Editor | Frontend-Engineer | 4 |
| **AC #9**: User configures content showcase (optional) | 3.5 Content Showcase Editor | Frontend-Engineer | 3 |
| **AC #10**: User configures post-submission settings | 3.4 Form Editor | Frontend-Engineer | 2-3 |
| **AC #11**: System validates config with relationship checking | 4.1 Validation Engine, 4.2 Validation UI | Backend-Engineer, Frontend-Engineer | 5 |
| **AC #12**: System shows dependency warnings before deletion | 4.3 Dependency Warnings | Frontend-Engineer | 5 |
| **AC #13**: User deploys merged config to S3 | 5.1 Merge Strategy, 5.2 Deployment UI, 5.3 Auto-Save | Backend-Engineer, Frontend-Engineer | 6 |
| **AC #14**: Forms/CTAs/branches function in production Picasso | 8.2 Deploy 5 Test Tenants | Release-Manager | 10 |
| **AC #15**: Zero config errors in first 5 deployments | 8.2 Deploy 5 Test Tenants | Release-Manager | 10 |

---

## APPENDIX B: AGENT CONTACT INFORMATION

| Agent | Availability | Max Concurrent Tasks | Notes |
|-------|-------------|---------------------|-------|
| system-architect | On-demand | 1 | Design work only |
| Product-Manager | On-demand | 1 | Planning only |
| typescript-specialist | On-demand | 1 | Types first, critical dependency |
| Frontend-Engineer | Full-time | 1 | Bottleneck, consider worktrees |
| Backend-Engineer | On-demand | 1 | Validation + S3 work |
| test-engineer | On-demand | 1 | Can parallelize with QA |
| qa-automation-specialist | On-demand | 1 | E2E tests after app complete |
| code-reviewer | On-demand | 1 | After code complete |
| technical-writer | On-demand | 1 | Docs at end |
| dx-engineer | On-demand | 1 | Polish at end |
| Release-Manager | On-demand | 1 | Final deployment |

---

---

## APPENDIX C: LAMBDA CHANGES FOR CONTENT SHOWCASE

### Overview

The Content Showcase feature requires updates to the Lambda response enhancer to detect and inject showcase cards based on keyword matching. This follows the same pattern as existing CTA detection.

### Files Requiring Changes

**Primary File:**
- `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/response_enhancer.js`

**No Changes Required:**
- `/Lambdas/lambda/Master_Function_Staging/lambda_function.py` - Master Function just passes config to streaming handler

---

### Detailed Changes to response_enhancer.js

#### Change 1: Update Config Loading (Lines 71-75)

**Current:**
```javascript
// Extract relevant sections
const result = {
    conversation_branches: config.conversation_branches || {},
    cta_definitions: config.cta_definitions || {},
    conversational_forms: config.conversational_forms || {}
};
```

**Updated:**
```javascript
// Extract relevant sections
const result = {
    conversation_branches: config.conversation_branches || {},
    cta_definitions: config.cta_definitions || {},
    conversational_forms: config.conversational_forms || {},
    content_showcase: config.content_showcase || []  // NEW: Add showcase config
};
```

**Rationale:** Load showcase items from tenant config alongside existing configuration sections.

---

#### Change 2: Add detectContentShowcase Function (New, After Line 236)

**Add new function:**
```javascript
/**
 * Detect content showcase opportunities based on keyword matching
 * Similar to detectConversationBranch but returns rich showcase cards
 */
function detectContentShowcase(bedrockResponse, userQuery, config) {
    const { content_showcase, cta_definitions } = config;

    // Return null if no showcase items configured
    if (!content_showcase || !Array.isArray(content_showcase) || content_showcase.length === 0) {
        return null;
    }

    // Check each showcase item for keyword matches
    for (const item of content_showcase) {
        // Skip disabled items
        if (!item.enabled) {
            continue;
        }

        // Skip if no keywords defined
        if (!item.keywords || !Array.isArray(item.keywords)) {
            continue;
        }

        // Check if any keywords match the Bedrock response
        const matches = item.keywords.some(keyword =>
            bedrockResponse.toLowerCase().includes(keyword.toLowerCase())
        );

        if (matches) {
            console.log(`Showcase item matched: ${item.id}`);

            // Get linked CTA from definitions
            const linkedCta = cta_definitions[item.cta_id];

            if (!linkedCta) {
                console.warn(`Showcase item ${item.id} references non-existent CTA: ${item.cta_id}`);
                continue; // Skip this item if CTA doesn't exist
            }

            // Return showcase card with linked CTA
            return {
                showcaseCard: {
                    id: item.id,
                    type: item.type,
                    name: item.name,
                    tagline: item.tagline || '',
                    description: item.description || '',
                    image_url: item.image_url || '',
                    stats: item.stats || '',
                    testimonial: item.testimonial || '',
                    highlights: item.highlights || [],
                    cta: {
                        id: item.cta_id,
                        label: linkedCta.text || linkedCta.label,
                        action: linkedCta.action || linkedCta.type,
                        ...linkedCta
                    }
                }
            };
        }
    }

    console.log('No matching showcase item found');
    return null;
}
```

**Rationale:**
- Follows same pattern as `detectConversationBranch` for consistency
- Keyword-based matching (no scoring or complex logic)
- Returns first match only (show 1 showcase card max per response)
- Validates linked CTA exists before returning
- Includes all showcase content fields for rich rendering

---

#### Change 3: Update enhanceResponse Function (Lines 274-478)

**Location:** After form trigger detection (around line 406), before branch detection

**Add showcase detection:**
```javascript
// After form trigger check (line ~406), add:

// Check for content showcase opportunities (after forms, before branches)
const showcaseResult = detectContentShowcase(bedrockResponse, userMessage, config);

// Continue with existing branch detection...
const branchResult = detectConversationBranch(bedrockResponse, userMessage, config, completedForms);
```

**Update return statements to include showcaseCards:**

**Current return format:**
```javascript
return {
    message: bedrockResponse,
    ctaButtons: [...],
    metadata: {...}
};
```

**Updated return format:**
```javascript
return {
    message: bedrockResponse,
    showcaseCards: showcaseResult ? [showcaseResult.showcaseCard] : [],  // NEW
    ctaButtons: [...],
    metadata: {...}
};
```

**Apply to all return statements:**
1. Line ~360 (program switch detected)
2. Line ~367 (suspended forms)
3. Line ~390 (form trigger detected)
4. Line ~452 (branch detected)
5. Line ~465 (no enhancements)
6. Line ~473 (error case)

**Example for branch detection return (line ~452):**
```javascript
// BEFORE:
return {
    message: bedrockResponse,
    ctaButtons: ctaButtons,
    metadata: {
        enhanced: true,
        branch_detected: branchResult.branch,
        filtered_forms: completedForms
    }
};

// AFTER:
return {
    message: bedrockResponse,
    showcaseCards: showcaseResult ? [showcaseResult.showcaseCard] : [],  // NEW
    ctaButtons: ctaButtons,
    metadata: {
        enhanced: true,
        branch_detected: branchResult.branch,
        filtered_forms: completedForms,
        showcase_detected: showcaseResult ? showcaseResult.showcaseCard.id : null  // NEW
    }
};
```

---

#### Change 4: Update Module Exports (Line 482-486)

**Current:**
```javascript
module.exports = {
    enhanceResponse,
    loadTenantConfig,
    detectConversationBranch
};
```

**Updated:**
```javascript
module.exports = {
    enhanceResponse,
    loadTenantConfig,
    detectConversationBranch,
    detectContentShowcase  // NEW: Export for testing
};
```

---

### Testing Lambda Changes

**Unit Tests (to be added):**

```javascript
// Test 1: Showcase detection with matching keyword
const config = {
    content_showcase: [{
        id: 'lovebox_card',
        enabled: true,
        name: 'Love Box',
        keywords: ['love box', 'foster families'],
        cta_id: 'lovebox_apply'
    }],
    cta_definitions: {
        lovebox_apply: {
            text: 'Apply for Love Box',
            action: 'start_form',
            formId: 'lb_apply'
        }
    }
};

const response = "We have a Love Box program for foster families.";
const result = detectContentShowcase(response, 'tell me more', config);

// Expected: showcaseCard with lovebox_card data

// Test 2: No match
const response2 = "We have volunteer opportunities.";
const result2 = detectContentShowcase(response2, 'tell me more', config);

// Expected: null

// Test 3: Disabled item
config.content_showcase[0].enabled = false;
const result3 = detectContentShowcase(response, 'tell me more', config);

// Expected: null

// Test 4: Missing linked CTA
config.content_showcase[0].cta_id = 'nonexistent';
const result4 = detectContentShowcase(response, 'tell me more', config);

// Expected: null (logs warning)
```

**Integration Test:**
```javascript
// Full enhanceResponse call with showcase
const config = {
    content_showcase: [/* ... */],
    cta_definitions: {/* ... */},
    conversation_branches: {/* ... */}
};

const result = await enhanceResponse(
    "We have Love Box and Dare to Dream programs.",
    "what volunteer opportunities?",
    "test-tenant-hash",
    {}
);

// Expected result:
{
    message: "We have Love Box and Dare to Dream programs.",
    showcaseCards: [{
        id: 'lovebox_card',
        name: 'Love Box',
        // ... full showcase card
        cta: {
            label: 'Apply for Love Box',
            action: 'start_form',
            formId: 'lb_apply'
        }
    }],
    ctaButtons: [/* branch CTAs */],
    metadata: {
        enhanced: true,
        showcase_detected: 'lovebox_card',
        branch_detected: 'program_exploration'
    }
}
```

---

### Priority Order (Updated)

After implementing these changes, the detection priority will be:

1. **Suspended Form Handling** (highest priority)
   - Check for program switch
   - If switching, return switch metadata
   - If not switching, skip all CTAs/showcase

2. **Direct Form Triggers**
   - Trigger phrases in user query
   - Return form CTA immediately

3. **Content Showcase** (NEW)
   - Keyword matching in Bedrock response
   - Return showcase card with linked CTA
   - Max 1 showcase card per response

4. **Conversation Branches**
   - Keyword matching in Bedrock response
   - Return up to 3 regular CTAs

5. **No Enhancements**
   - Return empty ctaButtons and showcaseCards arrays

---

### Frontend Integration Points

The frontend (Picasso widget) will need to handle the new `showcaseCards` array:

**Response format:**
```javascript
{
    message: "...",
    showcaseCards: [
        {
            id: "lovebox_card",
            type: "program",
            name: "Love Box",
            tagline: "Support foster families...",
            description: "Pack monthly care boxes...",
            image_url: "https://...",
            stats: "2-3 hours/month",
            testimonial: "Best experience! - Sarah M.",
            highlights: ["Flexible schedule", "Monthly commitment"],
            cta: {
                id: "lovebox_apply",
                label: "Apply for Love Box",
                action: "start_form",
                formId: "lb_apply"
            }
        }
    ],
    ctaButtons: [/* regular CTAs */],
    metadata: {...}
}
```

**Frontend rendering:**
1. Check if `showcaseCards` array has items
2. Render showcase card as rich visual component:
   - Image at top (if image_url present)
   - Name as heading
   - Tagline as subheading
   - Description as body text
   - Stats, testimonial, highlights as supporting content
   - Linked CTA button at bottom
3. Render showcase cards BEFORE regular CTAs (visual hierarchy)
4. Regular CTAs render below showcase cards

---

### Migration Path

**For existing tenants:**
- No breaking changes - `content_showcase` is optional
- If config doesn't have `content_showcase`, function returns null
- Existing CTA/branch detection continues to work unchanged

**For new tenants:**
- Web Config Builder will allow creating showcase items
- Deploy with `content_showcase: []` in config (empty array)
- Ops team can add showcase items over time

**Config schema version:**
- Consider incrementing to v1.4 when showcase is added to a tenant
- Not required - showcase is additive, not breaking

---

### Performance Considerations

**Caching:**
- Showcase config is cached with rest of tenant config (5 min TTL)
- No additional S3 calls required

**Keyword Matching:**
- O(n*m) complexity where n=showcase items, m=keywords per item
- For typical usage (5 items × 5 keywords = 25 checks), negligible overhead
- Runs after form triggers but before branch detection

**Image Loading:**
- Images are URLs in config, loaded by frontend
- Lambda only passes URLs, doesn't fetch images
- Frontend should lazy-load images for performance

---

### Deployment Steps

1. **Test changes locally:**
   - Update response_enhancer.js
   - Run unit tests
   - Test with sample config

2. **Deploy to staging:**
   ```bash
   cd Lambdas/lambda/Bedrock_Streaming_Handler_Staging
   npm ci --production
   npm run package
   aws lambda update-function-code --function-name Bedrock_Streaming_Handler_Staging --zip-file fileb://deployment.zip
   ```

3. **Test with staging tenant:**
   - Add test showcase item to staging config
   - Trigger conversation that matches keywords
   - Verify showcase card appears in response

4. **Deploy to production:**
   - Same process as staging
   - Monitor CloudWatch logs for errors
   - Test with production tenant

---

### Rollback Plan

If showcase feature causes issues:

1. **Quick rollback:**
   - Redeploy previous Lambda version
   - Or: Set `enabled: false` on all showcase items in config

2. **Gradual rollout:**
   - Enable showcase for 1-2 test tenants initially
   - Monitor for errors before wider rollout
   - Use feature flag in config if needed

---

**END OF SPRINT PLAN**

This sprint plan provides a comprehensive roadmap for delivering the Picasso Config Builder MVP in 2 weeks. Daily tracking and progress updates should be made to the orchestration plan (`AGENT_ORCHESTRATION_PLAN.md`).

**Next Action**: Proceed to Phase 2 (Foundation) with typescript-specialist.
