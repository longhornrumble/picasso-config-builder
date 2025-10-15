# Agent Orchestration Plan
## Picasso Config Builder MVP Development

**Goal**: Build web-based configuration tool for conversational forms
**Timeline**: 2 weeks (MVP Phase 1)
**Repository**: https://github.com/longhornrumble/picasso-config-builder

---

## Development Strategy

### Sequential with Strategic Parallelization
- **Foundation work**: Sequential (shared dependencies)
- **Independent features**: Parallel with worktrees (if needed)
- **Quality assurance**: Parallel testing agents

---

## Phase 1: Planning & Architecture ✅ COMPLETE

**Status**: Complete
**Agents**: system-architect, Product-Manager
**Execution**: Parallel (read-only analysis)
**Duration**: ~1 hour
**Started**: 2025-10-15 11:53 AM
**Completed**: 2025-10-15 12:15 PM

### Tasks:

#### 1.1 System Architect
**Input**:
- WEB_CONFIG_BUILDER_PRD.md
- TENANT_CONFIG_SCHEMA.md
- Wireframes (3 HTML files)
- Existing Picasso codebase patterns

**Expected Output**:
- State management architecture (Zustand store design)
- Component hierarchy and relationships
- Data flow diagrams (S3 → App → Editors → Validation)
- Validation engine architecture
- API/service layer design
- File structure recommendations

**Success Criteria**:
- Clear separation of concerns
- Reusable component patterns
- Scalable validation strategy
- Type-safe data flow

#### 1.2 Product Manager
**Input**:
- WEB_CONFIG_BUILDER_PRD.md (acceptance criteria)
- Architecture recommendations from 1.1

**Expected Output**:
- Detailed sprint plan (2 weeks)
- Task breakdown with time estimates
- Dependency mapping
- Risk identification and mitigation
- Success metrics tracking plan

**Success Criteria**:
- All 15 MVP acceptance criteria mapped to tasks
- Dependencies clearly identified
- Realistic time estimates
- Deliverables defined for each phase

**Deliverables**:
- ✅ `docs/ARCHITECTURE.md` - Comprehensive system architecture (16 sections)
- ✅ `docs/SPRINT_PLAN.md` - Detailed 2-week sprint plan (10 sections)

**Decision Point**: ✅ COMPLETE - Ready to proceed to Phase 2

---

## Phase 2: Foundation ⏳ READY (unblocked by Phase 1)

**Status**: Ready to start
**Agents**: typescript-specialist, Frontend-Engineer
**Execution**: Sequential
**Duration**: ~3-4 hours

### Tasks:

#### 2.1 TypeScript Specialist
**Input**:
- Architecture design from Phase 1
- TENANT_CONFIG_SCHEMA.md
- Existing type patterns from Picasso

**Expected Output**:
- `src/types/config.ts` - Core config types
  - TenantConfig, Program, Form, CTA, Branch
  - FormField, Validation rules
  - CardInventory types
- `src/types/api.ts` - API response/request types
- `src/types/validation.ts` - Validation result types
- `src/types/editor.ts` - Editor component prop types
- Zod schemas for runtime validation

**Success Criteria**:
- 100% type coverage for config objects
- Strict typing (no `any` types)
- Type guards for discriminated unions
- Zod schemas match TypeScript types

**Files to Create**:
```
src/types/
  ├── config.ts          # Core domain types
  ├── api.ts             # API types
  ├── validation.ts      # Validation types
  ├── editor.ts          # UI component types
  └── index.ts           # Barrel export
```

#### 2.2 Frontend Engineer - Shared Components
**Input**:
- Architecture from Phase 1
- Type definitions from 2.1
- Wireframes for UI patterns

**Expected Output**:
- App shell with routing
- Shared UI components
  - Layout components (Header, Sidebar, MainContent)
  - Form primitives (Input, Select, TextArea, Button)
  - Validation display components
  - Modal/Dialog components
- Zustand store setup (structure only, editors populate later)
- S3 service layer (hooks for config CRUD)
- Utility functions

**Success Criteria**:
- Consistent UI patterns across all editors
- Reusable form components
- Type-safe store implementation
- Working dev server with routing

**Files to Create**:
```
src/
  ├── components/shared/
  │   ├── Layout.tsx
  │   ├── FormInput.tsx
  │   ├── FormSelect.tsx
  │   ├── Button.tsx
  │   ├── ValidationMessage.tsx
  │   └── Modal.tsx
  ├── store/
  │   ├── useConfigStore.ts
  │   └── types.ts
  ├── lib/s3/
  │   ├── s3Client.ts
  │   ├── hooks.ts
  │   └── types.ts
  └── App.tsx (updated with routing)
```

---

## Phase 3: Editor Development ⏸️ BLOCKED (waiting for Phase 2)

**Status**: Pending foundation work
**Strategy**: Sequential OR Parallel (decide after Phase 2 completion)

### Option A: Sequential (Simpler, Lower Risk)
Build editors one at a time in main branch:
1. Branch Editor (simplest, sets patterns)
2. CTA Editor (medium complexity)
3. Form Editor (most complex)

**Pros**: No merge conflicts, iterative learning, simpler workflow
**Cons**: Takes longer

### Option B: Parallel with Worktrees (Faster, Higher Complexity)
Set up 3 worktrees, run 3 Frontend-Engineer agents:
```bash
git worktree add ../config-builder-branch feature/branch-editor
git worktree add ../config-builder-cta feature/cta-editor
git worktree add ../config-builder-form feature/form-editor
```

**Pros**: 3x faster, agents work independently
**Cons**: Merge conflicts possible, requires worktree management

**Decision Point**: Choose strategy after Phase 2, based on:
- How stable the foundation is
- Timeline pressure
- Confidence in architecture

### Tasks (regardless of strategy):

#### 3.1 Branch Editor
**Input**:
- Wireframe: `docs/wireframes/branch-editor-wireframe-v2.html`
- Branch type definitions
- Shared components from 2.2
- Validation rules from PRD

**Expected Output**:
- Full CRUD interface for conversation branches
- Detection keywords editor (array input)
- Priority/sort order controls
- Primary CTA selector (dropdown)
- Secondary CTAs selector (multi-select, max 2)
- Real-time validation display
- Integration with Zustand store

**Validation Rules to Implement**:
- Keywords shouldn't look like user queries (warn on "how", "what", etc.)
- All referenced CTAs must exist
- Priority ordering is logical (broad before specific)
- Max 3 total CTAs warning

**Files to Create**:
```
src/components/BranchEditor/
  ├── BranchEditor.tsx          # Main container
  ├── BranchList.tsx            # List view
  ├── BranchForm.tsx            # Create/edit form
  ├── KeywordInput.tsx          # Array input for keywords
  ├── CTASelector.tsx           # CTA selection UI
  └── BranchValidation.tsx      # Validation display
```

#### 3.2 CTA Editor
**Input**:
- Wireframe: `docs/wireframes/cta-editor-wireframe-v2.html`
- CTA type definitions
- Action type union (start_form | external_link | show_info)
- Validation rules from PRD

**Expected Output**:
- Full CRUD interface for CTAs
- Action type selector (affects form fields)
- Conditional fields based on action type:
  - start_form → formId selector
  - external_link → URL input
  - show_info → prompt textarea
- Button text editor
- Real-time validation display
- Dependency tracking (which branches use this CTA)

**Validation Rules to Implement**:
- start_form must have valid formId
- external_link must have valid URL (https://)
- show_info must have prompt text
- Warn on generic button text ("Click Here")

**Files to Create**:
```
src/components/CTAEditor/
  ├── CTAEditor.tsx             # Main container
  ├── CTAList.tsx               # List view
  ├── CTAForm.tsx               # Create/edit form
  ├── ActionTypeSelector.tsx    # Action type switch
  ├── ConditionalFields.tsx     # Action-specific fields
  └── CTAValidation.tsx         # Validation display
```

#### 3.3 Form Editor
**Input**:
- Wireframe: `docs/wireframes/form-editor-wireframe-v2.html`
- Form type definitions
- Field type definitions
- Validation rules from PRD

**Expected Output**:
- Full CRUD interface for forms
- Form metadata editor (form_id, program assignment)
- Field collection editor (drag-drop ordering)
- Field configuration per type:
  - text, email, phone, select, textarea, checkbox
  - Required flag, validation rules, options (for select)
- Trigger phrases array input
- Post-submission settings editor
- Real-time validation display

**Validation Rules to Implement**:
- form_id must be unique
- Program assignment required
- At least one field required
- Required fields must have validation
- Email fields must have email validation
- Phone fields should have phone validation
- Select fields must have ≥2 options
- Warn if no trigger phrases (CTA-only access)

**Files to Create**:
```
src/components/FormEditor/
  ├── FormEditor.tsx            # Main container
  ├── FormList.tsx              # List view
  ├── FormMetadata.tsx          # Basic form settings
  ├── FieldCollection.tsx       # Field list (sortable)
  ├── FieldEditor.tsx           # Field create/edit
  ├── FieldTypeSelector.tsx     # Field type switch
  ├── TriggerPhrases.tsx        # Array input
  ├── PostSubmission.tsx        # Post-submission config
  └── FormValidation.tsx        # Validation display
```

---

## Phase 4: Validation Engine ⏸️ BLOCKED (waiting for Phase 3)

**Status**: Pending editor completion
**Agent**: Backend-Engineer
**Execution**: Sequential
**Duration**: ~2 hours

### Tasks:

#### 4.1 Validation Engine Implementation
**Input**:
- All validation rules from PRD
- Complete config types
- Editor implementations

**Expected Output**:
- Comprehensive validation library
- Real-time field-level validation
- Pre-deployment validation suite
- Dependency tracking system
- Validation result types
- User-friendly error messages

**Validation Categories**:
1. **CTA Validation** (lines 113-131 of PRD)
2. **Form Validation** (lines 133-152 of PRD)
3. **Branch Validation** (lines 154-177 of PRD)
4. **Relationship Validation** (lines 179-196 of PRD)
5. **Dependency Warnings** (lines 198-232 of PRD)
6. **Runtime Behavior Validation** (lines 234-253 of PRD)

**Files to Create**:
```
src/lib/validation/
  ├── index.ts                  # Main validation exports
  ├── ctaValidation.ts          # CTA-specific rules
  ├── formValidation.ts         # Form-specific rules
  ├── branchValidation.ts       # Branch-specific rules
  ├── relationshipValidation.ts # Cross-entity checks
  ├── dependencyTracking.ts     # Usage tracking
  ├── runtimeValidation.ts      # Behavior warnings
  └── validationMessages.ts     # Error message templates
```

---

## Phase 5: S3 Integration ⏸️ BLOCKED (waiting for Phase 4)

**Status**: Pending validation implementation
**Agent**: Backend-Engineer
**Execution**: Sequential
**Duration**: ~2 hours

### Tasks:

#### 5.1 S3 Service Layer
**Input**:
- AWS SDK setup
- S3 bucket configuration (myrecruiter-picasso)
- Tenant config schema
- Merge strategy for config sections

**Expected Output**:
- S3 client configuration
- Tenant list fetching
- Config read operations (base + sections)
- Config write operations (merge strategy)
- Config validation before upload
- Error handling and retry logic
- Loading states and progress tracking

**Key Operations**:
1. List all tenant configs from S3
2. Load base config (read-only reference)
3. Load/edit specific sections:
   - conversational_forms
   - cta_definitions
   - conversation_branches
   - programs (canonical source)
4. Merge sections back to full config
5. Validate merged config
6. Upload to S3

**Files to Create/Expand**:
```
src/lib/s3/
  ├── s3Client.ts               # AWS SDK setup
  ├── tenantOperations.ts       # List tenants
  ├── configOperations.ts       # Read/write configs
  ├── mergeStrategy.ts          # Section merging logic
  ├── hooks.ts                  # React hooks (expanded)
  └── types.ts                  # S3 operation types
```

---

## Phase 6: Quality Assurance ⏸️ BLOCKED (waiting for Phase 5)

**Status**: Pending full implementation
**Agents**: test-engineer, qa-automation-specialist, code-reviewer
**Execution**: Parallel (tests) + Sequential (review)
**Duration**: ~3-4 hours

### Tasks:

#### 6.1 Test Engineer - Unit & Integration Tests
**Input**:
- All component implementations
- Validation engine
- S3 service layer
- Type definitions

**Expected Output**:
- Component unit tests (React Testing Library)
- Validation engine tests
- Store tests (Zustand)
- S3 service mocks and tests
- Form interaction tests
- Test coverage report (target >80%)

**Test Files**:
```
src/components/BranchEditor/__tests__/
src/components/CTAEditor/__tests__/
src/components/FormEditor/__tests__/
src/lib/validation/__tests__/
src/lib/s3/__tests__/
src/store/__tests__/
```

#### 6.2 QA Automation Specialist - E2E Tests
**Input**:
- Complete application
- User workflows from PRD
- Acceptance criteria

**Expected Output**:
- E2E test suite (Playwright)
- Critical path tests:
  - Load tenant → Edit form → Validate → Deploy
  - Create branch → Link CTAs → Save
  - Dependency warning flows
  - Validation error flows
- Cross-browser testing setup
- CI/CD integration recommendations

**Test Files**:
```
e2e/
  ├── branch-editor.spec.ts
  ├── cta-editor.spec.ts
  ├── form-editor.spec.ts
  ├── validation.spec.ts
  ├── deployment.spec.ts
  └── fixtures/
```

#### 6.3 Code Reviewer
**Input**:
- Complete codebase
- PRD requirements
- TypeScript best practices
- React best practices

**Expected Output**:
- Code review report
- Suggestions for improvements:
  - Performance optimizations
  - Code organization
  - Type safety improvements
  - Accessibility issues
  - Security concerns
- Refactoring recommendations
- Documentation gaps

---

## Phase 7: Documentation & Polish ⏸️ BLOCKED (waiting for Phase 6)

**Status**: Pending QA completion
**Agents**: technical-writer, dx-engineer
**Execution**: Parallel
**Duration**: ~2 hours

### Tasks:

#### 7.1 Technical Writer
**Input**:
- Complete application
- Architecture documentation
- API/service documentation

**Expected Output**:
- User Guide (step-by-step with screenshots)
  - Getting started
  - Branch editor walkthrough
  - CTA editor walkthrough
  - Form editor walkthrough
  - Validation guide
  - Deployment process
  - Troubleshooting
- API Documentation
  - S3 integration
  - Config schema
  - Validation API
- README improvements
- CONTRIBUTING.md

**Files to Create/Update**:
```
docs/
  ├── USER_GUIDE.md
  ├── API_DOCUMENTATION.md
  ├── TROUBLESHOOTING.md
  └── screenshots/ (if needed)
README.md (updated)
CONTRIBUTING.md
```

#### 7.2 DX Engineer
**Input**:
- Developer feedback (if available)
- Current DX pain points

**Expected Output**:
- Developer experience improvements:
  - Better error messages
  - Loading state improvements
  - Keyboard shortcuts
  - Undo/redo functionality (if time permits)
  - Better validation feedback
  - Console logging for debugging
- Development tooling:
  - Better dev server feedback
  - Hot reload optimization
  - Build time optimization
  - Debug mode toggle

---

## Phase 8: Deployment & Launch ⏸️ BLOCKED (waiting for Phase 7)

**Status**: Pending documentation
**Agent**: Release-Manager
**Execution**: Sequential
**Duration**: ~1 hour

### Tasks:

#### 8.1 Production Deployment
**Input**:
- Complete, tested application
- Documentation
- Deployment target (internal URL)

**Expected Output**:
- Production build
- Deployment to hosting (S3 + CloudFront or similar)
- Environment configuration
- Monitoring setup
- Launch checklist completion
- Handoff to operations team

**Deployment Checklist**:
- [ ] All 15 MVP acceptance criteria met
- [ ] Test coverage >80%
- [ ] E2E tests passing
- [ ] Documentation complete
- [ ] Security review passed
- [ ] Performance benchmarks met (<2s load time)
- [ ] Operations team trained
- [ ] Rollback plan documented

---

## Progress Tracking

### Overall Status: 🟢 Phase 1 Complete, Phase 2 Ready

| Phase | Status | Agent(s) | Started | Completed | Notes |
|-------|--------|----------|---------|-----------|-------|
| 1 - Planning & Architecture | ✅ Complete | system-architect, Product-Manager | 2025-10-15 11:53 | 2025-10-15 12:15 | ARCHITECTURE.md + SPRINT_PLAN.md |
| 2 - Foundation | ⏳ Ready | typescript-specialist, Frontend-Engineer | - | - | Unblocked, ready to start |
| 3 - Editors | ⏸️ Blocked | Frontend-Engineer(s) | - | - | Strategy TBD |
| 4 - Validation | ⏸️ Blocked | Backend-Engineer | - | - | Waiting for Phase 3 |
| 5 - S3 Integration | ⏸️ Blocked | Backend-Engineer | - | - | Waiting for Phase 4 |
| 6 - QA | ⏸️ Blocked | test-engineer, qa-automation-specialist, code-reviewer | - | - | Waiting for Phase 5 |
| 7 - Documentation | ⏸️ Blocked | technical-writer, dx-engineer | - | - | Waiting for Phase 6 |
| 8 - Deployment | ⏸️ Blocked | Release-Manager | - | - | Waiting for Phase 7 |

### Acceptance Criteria Completion: 0/15

From PRD lines 52-93:
- [ ] 1. User sees list of tenants from S3
- [ ] 2. User loads existing config (read-only display)
- [ ] 3. User creates programs
- [ ] 4. User creates forms with 5+ fields
- [ ] 5. User assigns form to program
- [ ] 6. User adds trigger phrases to form
- [ ] 7. User creates CTAs (3 action types)
- [ ] 8. User creates branches with keywords, priority, CTAs
- [ ] 9. User configures card inventory (optional)
- [ ] 10. User configures post-submission settings
- [ ] 11. System validates config with relationship checking
- [ ] 12. System shows dependency warnings before deletion
- [ ] 13. User deploys merged config to S3
- [ ] 14. Forms/CTAs/branches function in production Picasso
- [ ] 15. Zero config errors in first 5 deployments

---

## Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2025-10-15 | Use esbuild instead of Vite | Match existing Picasso build system | ✅ Implemented |
| TBD | Sequential vs Parallel editors (Phase 3) | TBD after Phase 2 completion | ⏳ Pending |

---

## Risk Tracker

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| S3 permission issues | High | Test S3 access early in Phase 5 | 🟡 Monitoring |
| Complex validation logic | Medium | Comprehensive test coverage in Phase 6 | 🟡 Monitoring |
| Merge conflicts (if parallel) | Medium | Use worktrees, clear component boundaries | 🟡 Monitoring |
| Timeline pressure | Medium | Prioritize MVP features, defer Phase 2/3 PRD items | 🟡 Monitoring |

---

## Next Steps

### Immediate Actions:
1. ✅ Review and approve this plan
2. ✅ Launch Phase 1 agents in parallel:
   - ✅ system-architect → ARCHITECTURE.md
   - ✅ Product-Manager → SPRINT_PLAN.md
3. ⏳ Review Phase 1 outputs before proceeding
4. ⏳ Decide: Proceed to Phase 2 or adjust plan

**Phase 1 Complete! Ready to proceed with Phase 2?**
