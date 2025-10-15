# PICASSO CONFIG BUILDER - DEVELOPMENT WORKFLOW SOP

**Version**: 1.0
**Date**: 2025-10-15
**Status**: Active
**Scope**: All development tasks for Picasso Config Builder MVP

---

## Purpose

This Standard Operating Procedure (SOP) defines the mandatory workflow for all development tasks, including validation requirements, quality gates, and agent deployment patterns.

---

## Core Principle

**Every task must be validated before it is considered complete.**

No task can be marked as "done" until it passes all validation checks defined in this SOP.

---

## Standard Task Workflow

### Phase 1: Planning
1. Review task requirements from `docs/SPRINT_PLAN.md`
2. Identify acceptance criteria
3. Determine if specialized agents are needed
4. Create todo list with `TodoWrite` tool

### Phase 2: Implementation
1. Launch appropriate specialized agent(s)
2. Monitor agent progress
3. Review agent deliverables
4. Verify all files created

### Phase 3: Validation (MANDATORY)
1. **Automated validation** - Run validation scripts
2. **Code review** - Check code quality
3. **Manual testing** - Test functionality
4. **QA agent** - Deploy if needed
5. **Documentation review** - Verify completeness

### Phase 4: Commit & Update
1. Stage all files with `git add`
2. Commit with descriptive message
3. Update `AGENT_ORCHESTRATION_PLAN.md`
4. Update todo list
5. Generate task completion summary

---

## Validation Framework - Required Steps

### After EVERY Task Completion

**Step 1: Quick Validation**
```bash
npm run validate:quick
```
**Must pass before proceeding.**

**Step 2: Phase-Specific Validation**
```bash
npm run validate:phase2  # For Phase 2 tasks
npm run validate:phase3  # For Phase 3 tasks (when created)
# etc.
```
**Review output and address any failures.**

**Step 3: Manual Validation Checklist**

Review acceptance criteria from `docs/VALIDATION_CHECKLIST.md`:

- [ ] All required files exist
- [ ] TypeScript compiles without errors
- [ ] No `any` types introduced
- [ ] Code follows project patterns
- [ ] Documentation is complete
- [ ] Examples demonstrate usage
- [ ] No console errors in browser

**Step 4: QA Agent Deployment (Conditional)**

Deploy `qa-automation-specialist` agent when:
- Task involves complex logic
- Integration testing required
- Cross-component validation needed
- API integration needs testing
- Performance requirements must be verified

**How to deploy:**
```
Launch qa-automation-specialist agent with:
- Task description
- Files to test
- Test scenarios
- Success criteria
```

**Step 5: Full Validation (Before Phase Completion)**
```bash
npm run validate
```
**Must pass before moving to next phase.**

---

## Quality Gates

### Task-Level Gate
**Required before marking task complete:**
- ✅ Automated validation passes
- ✅ Manual checklist complete
- ✅ QA agent validates (if applicable)
- ✅ All files committed
- ✅ Documentation updated

### Phase-Level Gate
**Required before starting next phase:**
- ✅ All tasks in phase complete
- ✅ Full validation suite passes
- ✅ Integration tests pass
- ✅ Performance benchmarks met
- ✅ Phase completion report generated
- ✅ Orchestration plan updated

### Pre-Deployment Gate
**Required before production deployment:**
- ✅ All phases complete
- ✅ End-to-end testing complete
- ✅ Security review passed
- ✅ Performance validated (<2s load time)
- ✅ Documentation complete
- ✅ User acceptance testing passed

---

## Agent Deployment Guidelines

### When to Use Specialized Agents

**typescript-specialist**
- Creating type definitions
- Converting JS to TS
- Strengthening existing types
- Complex generic types

**Frontend-Engineer**
- Building React components
- UI implementation
- State management setup
- Routing configuration

**Backend-Engineer**
- API layer development
- Service layer implementation
- Lambda function integration
- Database operations

**qa-automation-specialist** (MANDATORY AFTER EACH TASK)
- Automated test creation
- Integration testing
- Cross-environment validation
- Test coverage analysis
- Performance regression testing

**test-engineer**
- Unit test implementation
- Test suite maintenance
- Edge case testing
- Mock creation

**code-reviewer**
- Pre-commit code review
- Architecture review
- Pattern compliance check
- Security review

**technical-writer**
- API documentation
- User guides
- Architecture docs
- README updates

### Agent Deployment Pattern

```
1. Identify task requirements
2. Select appropriate agent(s)
3. Launch agent(s) with detailed prompt
4. Monitor agent completion
5. Review deliverables
6. RUN VALIDATION (mandatory)
7. Deploy qa-automation-specialist if needed
8. Commit only after validation passes
```

---

## Validation Scripts Reference

### Available Scripts

```bash
# Quick validation (typecheck + dev build)
npm run validate:quick

# Full validation (typecheck + production build)
npm run validate

# Phase-specific validation
npm run validate:phase2
npm run validate:phase3  # To be created
npm run validate:phase4  # To be created
npm run validate:phase5  # To be created

# Individual checks
npm run typecheck        # TypeScript type checking
npm run build:dev        # Development build
npm run build:production # Production build
npm run build:analyze    # Bundle size analysis
npm run lint             # ESLint checks
```

### Creating New Phase Validators

When starting a new phase, create validator script:

```bash
# Copy template
cp scripts/validate-phase2.mjs scripts/validate-phase3.mjs

# Edit for phase-specific checks
# Update package.json with new script
# Document in VALIDATION_CHECKLIST.md
```

---

## QA Automation Specialist - Usage Guide

### Deployment Template

```
Launch qa-automation-specialist agent with:

Task: Validate [Task X.X: Task Name]

Context:
- Task completed by [agent-name]
- Files created: [list files]
- Key functionality: [describe]

Validation Requirements:
1. [Specific test scenario 1]
2. [Specific test scenario 2]
3. [Specific test scenario 3]

Acceptance Criteria:
- [Criteria from sprint plan]
- Test coverage >80%
- All tests pass
- No console errors
- Performance benchmarks met

Deliverables:
- Test files created
- Test report generated
- Coverage metrics provided
- Issues identified (if any)
```

### When QA Agent is MANDATORY

**Always deploy qa-automation-specialist for:**
1. **Phase completion** - Before moving to next phase
2. **Complex logic** - State management, validation engine
3. **API integration** - Any API or service integration
4. **Critical path** - Features on critical path
5. **User-facing components** - Editor UIs, deployment workflow

**Optional for:**
1. Simple CRUD operations (if validated by manual testing)
2. Documentation-only tasks
3. Minor refactoring (if covered by existing tests)

---

## Commit Message Standards

### Format
```
<type>: <subject>

<body>

<footer>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Test creation/updates
- `refactor:` Code refactoring
- `chore:` Build/tooling changes

### Required in Body
- Task number (e.g., "Task 2.3: Zustand Store")
- Agent used (e.g., "Frontend-Engineer")
- Key deliverables (bullet list)
- Validation status (e.g., "✅ All validations passed")
- Lines of code or file count

### Footer
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Task Completion Checklist

Before marking ANY task as complete, verify:

### Code Quality
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Production build succeeds (`npm run build:production`)
- [ ] No `any` types introduced
- [ ] No security vulnerabilities (credentials, XSS, etc.)
- [ ] Code follows project patterns
- [ ] Error handling implemented
- [ ] Loading states handled

### Testing
- [ ] Automated validation passes
- [ ] Manual testing complete
- [ ] QA agent deployed (if required)
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] Performance acceptable

### Documentation
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] Code comments added
- [ ] Examples created/updated
- [ ] VALIDATION_CHECKLIST.md updated

### Integration
- [ ] Integrates with existing code
- [ ] No breaking changes (or documented)
- [ ] Dependencies tracked
- [ ] Type imports correct

### Git
- [ ] All files staged
- [ ] Commit message follows standards
- [ ] AGENT_ORCHESTRATION_PLAN.md updated
- [ ] Todo list updated
- [ ] No debug code or console.logs

---

## Failure Recovery

### If Validation Fails

1. **Identify root cause** - Review validation output
2. **Fix issues** - Address errors/warnings
3. **Re-run validation** - Verify fix worked
4. **Document issue** - Add to decision log if architectural
5. **Commit fix** - Separate commit for fixes

### If QA Agent Finds Issues

1. **Triage issues** - Critical vs. non-critical
2. **Fix critical issues** - Must fix before proceeding
3. **Log non-critical** - Create GitHub issues for later
4. **Re-validate** - Run QA agent again
5. **Update tests** - Add regression tests

### If Task is Blocked

1. **Document blocker** in AGENT_ORCHESTRATION_PLAN.md
2. **Update todo list** with blocked status
3. **Identify workaround** or alternate approach
4. **Escalate** if blocker affects critical path
5. **Move to parallel task** if possible

---

## Validation Metrics

### Track These Metrics

**Per Task:**
- Time to complete (actual vs. estimated)
- Lines of code created
- Number of files created
- TypeScript errors (should be 0)
- Validation time
- Number of validation failures

**Per Phase:**
- Total time to complete
- Total lines of code
- Test coverage %
- Build size (MB)
- Load time (seconds)
- Number of commits

**Project-Level:**
- Sprint velocity
- Quality gate pass rate
- Bug density
- Technical debt
- Documentation coverage

---

## Continuous Improvement

### After Each Task
1. Review what worked well
2. Identify bottlenecks
3. Update SOP if needed
4. Share learnings in decision log

### After Each Phase
1. Generate phase completion report
2. Review metrics vs. targets
3. Identify process improvements
4. Update orchestration plan
5. Retrospective with team

### After MVP Launch
1. Full retrospective
2. Update SOP based on lessons learned
3. Document best practices
4. Create templates for future projects

---

## Quick Reference Card

### Standard Task Flow
```
1. Review task → 2. Plan → 3. Implement → 4. VALIDATE → 5. Commit
```

### Validation Flow
```
validate:quick → validate:phase → Manual checklist → QA agent (if needed) → Full validate
```

### Quality Gate Flow
```
Task gate → Phase gate → Pre-deployment gate
```

### When in Doubt
1. Check `docs/VALIDATION_CHECKLIST.md`
2. Run `npm run validate:quick`
3. Review acceptance criteria
4. Deploy qa-automation-specialist
5. Document in decision log

---

## Related Documents

- `docs/VALIDATION_CHECKLIST.md` - Detailed validation criteria
- `docs/SPRINT_PLAN.md` - Task breakdown and estimates
- `AGENT_ORCHESTRATION_PLAN.md` - Agent deployment tracking
- `docs/ARCHITECTURE.md` - System architecture reference
- `docs/WEB_CONFIG_BUILDER_PRD.md` - Product requirements

---

## SOP Compliance

**This SOP is mandatory for all development work.**

Non-compliance (skipping validation, incomplete commits, missing documentation) will result in:
1. Failed phase gate
2. Required rework
3. Project delays

**Exception Process:**
If validation must be skipped (rare):
1. Document reason in AGENT_ORCHESTRATION_PLAN.md
2. Get approval from tech lead
3. Create issue to address later
4. Add to technical debt log

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-15 | Initial SOP created with validation framework | System |

---

**Last Updated**: 2025-10-15
**Next Review**: After Phase 3 completion or upon first blocker
