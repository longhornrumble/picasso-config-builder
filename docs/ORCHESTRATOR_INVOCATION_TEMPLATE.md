# Orchestrator Invocation Template

**Purpose:** Standard template for invoking the Orchestrator agent to ensure SOP compliance and consistent execution.

---

## Standard Orchestrator Invocation

Copy and customize this template when starting orchestrated work:

```
Agent: Orchestrator

Task: [Project/Feature Name]

Process: Follow SOP_DEVELOPMENT_WORKFLOW.md v2.2

Instructions:
1. Read and follow SOP_DEVELOPMENT_WORKFLOW.md
2. Consult AGENT_RESPONSIBILITY_MATRIX.md for agent selection
3. Identify current phase (0-5) based on project state
4. Deploy agents according to phase workflow definitions
5. Use standard agent invocation templates for each agent
6. Track phase gates and validation checkpoints
7. Manage handoffs between agents with explicit input/output artifacts
8. Report progress, blockers, and validation status
9. Validate at each phase gate before proceeding

Initial Requirements:
[Paste or describe requirements here - user stories, acceptance criteria, business goals]

Current Project State:
- Phase: [0 if new project, or specify current phase 1-5]
- Completed Work: [List what's already done]
- Pending Work: [What needs to be done]
- Known Blockers: [Any blockers or dependencies]

Success Criteria:
[From requirements - what defines "done"]

Timeline/Constraints:
[Any deadlines, budget, or technical constraints]

Proceed with Phase [X] workflow from SOP.
```

---

## Example: New Feature Development

```
Agent: Orchestrator

Task: Implement User Profile Settings Page

Process: Follow SOP_DEVELOPMENT_WORKFLOW.md v2.2

Instructions:
1. Read and follow SOP_DEVELOPMENT_WORKFLOW.md
2. Consult AGENT_RESPONSIBILITY_MATRIX.md for agent selection
3. Identify current phase (0-5) based on project state
4. Deploy agents according to phase workflow definitions
5. Use standard agent invocation templates for each agent
6. Track phase gates and validation checkpoints
7. Manage handoffs between agents with explicit input/output artifacts
8. Report progress, blockers, and validation status
9. Validate at each phase gate before proceeding

Initial Requirements:
- As a user, I want to update my profile settings (name, email, avatar)
- As a user, I want to see my current settings when I open the page
- As a user, I want validation on email format and required fields
- Settings should persist after page refresh
- Changes should be saved via API

Acceptance Criteria:
- Given I'm logged in, when I navigate to /settings, then I see my current profile
- Given I'm on settings page, when I change my email to invalid format, then I see validation error
- Given I update my name, when I click Save, then API is called and success message shows
- Given I refresh after saving, when page loads, then my new settings are displayed

Current Project State:
- Phase: 0 (New feature - requirements defined above)
- Completed Work: None yet
- Pending Work: Everything
- Known Blockers: None

Success Criteria:
- UI matches designs
- All acceptance criteria pass
- >80% test coverage
- No security vulnerabilities
- Performance: Page load <2s, API response <500ms
- Deployed to staging successfully

Timeline/Constraints:
- Target: 2 weeks
- Tech stack: React + TypeScript frontend, Node.js backend
- Must integrate with existing auth system

Proceed with Phase 0 workflow from SOP.
```

---

## Example: Bug Fix (Mid-Project)

```
Agent: Orchestrator

Task: Fix User Authentication Session Timeout Bug

Process: Follow SOP_DEVELOPMENT_WORKFLOW.md v2.2

Instructions:
1. Read and follow SOP_DEVELOPMENT_WORKFLOW.md
2. Consult AGENT_RESPONSIBILITY_MATRIX.md for agent selection
3. Identify current phase (0-5) based on project state
4. Deploy agents according to phase workflow definitions
5. Use standard agent invocation templates for each agent
6. Track phase gates and validation checkpoints
7. Manage handoffs between agents with explicit input/output artifacts
8. Report progress, blockers, and validation status
9. Validate at each phase gate before proceeding

Initial Requirements:
- Bug: Users getting logged out after 5 minutes of inactivity instead of configured 30 minutes
- Expected: Session should timeout after 30 minutes of inactivity
- Actual: Session timing out after 5 minutes

Current Project State:
- Phase: 2 (Investigation needed, then implementation)
- Completed Work: Bug reported and reproduced
- Pending Work: Root cause analysis, fix, testing
- Known Blockers: None

Success Criteria:
- Session timeout extended to 30 minutes
- Existing sessions not affected
- No security vulnerabilities introduced
- All existing auth tests still pass
- New test added to prevent regression

Timeline/Constraints:
- Priority: High (affects all users)
- Target: 3 days
- Must test thoroughly before deployment

Proceed with Phase 2 workflow from SOP.
```

---

## Example: Production Incident

```
Agent: Orchestrator

Task: Resolve Production Database Connection Failures

Process: Follow SOP_DEVELOPMENT_WORKFLOW.md v2.2 - INCIDENT RESPONSE

Instructions:
1. Read and follow Incident Response section of SOP
2. Deploy tech-lead-reviewer as Incident Commander
3. Deploy deployment-specialist as Technical Lead
4. Follow incident response workflow (Phase 5)
5. Track incident timeline
6. Execute hotfix workflow if fix identified
7. Conduct blameless postmortem after resolution

Incident Details:
- Severity: SEV 1 (Complete service outage)
- Impact: All users unable to access application
- Started: 2025-11-17 14:32 UTC
- Detection: Monitoring alerts + user reports
- Error: "Connection pool exhausted" in application logs

Current Project State:
- Phase: 5 (Incident Response - Operations & Maintenance)
- Immediate Action: Investigation in progress
- Blockers: None identified yet

Success Criteria:
- Service restored within 4 hours (SEV 1 target)
- Root cause identified
- Hotfix deployed if needed
- Monitoring shows healthy metrics
- Blameless postmortem completed within 48 hours

Proceed with Phase 5 Incident Response workflow from SOP.
```

---

## Customization Guide

**Customize these sections for your use case:**

1. **Task:** Brief, clear feature/project name
2. **Initial Requirements:** User stories, acceptance criteria, or bug description
3. **Current Project State:**
   - Set phase to 0 for new projects
   - Set phase to 1-5 if work is in progress
   - List completed work
   - Identify blockers
4. **Success Criteria:** Define "done" explicitly
5. **Timeline/Constraints:** Deadlines, budgets, technical limits

**Keep these sections standard:**
- Process reference (SOP v2.2)
- Instructions (standard 9-step process)
- "Proceed with Phase [X]" directive

---

## Phase Selection Guide

**Choose starting phase based on project state:**

| Phase | When to Start Here | Examples |
|-------|-------------------|----------|
| **Phase 0** | Requirements exist but not refined, or architecture not designed | New features, greenfield projects, major refactoring |
| **Phase 1** | Requirements refined, architecture approved, ready to plan implementation | After Phase 0 complete, or simple features with clear requirements |
| **Phase 2** | Requirements and plan complete, ready to code | Implementation work |
| **Phase 3** | Code complete, needs testing | After implementation, pre-deployment validation |
| **Phase 4** | Tests passing, ready to deploy | Deployment to staging/production |
| **Phase 5** | In production, operational tasks | Incidents, monitoring, maintenance, postmortems |

---

## Tips for Effective Orchestration

1. **Be specific** in requirements - avoid ambiguity
2. **Set clear success criteria** - make "done" measurable
3. **Identify blockers early** - don't wait until stuck
4. **Trust the process** - let agents execute their phases
5. **Validate at gates** - don't skip quality checks
6. **Document decisions** - capture rationale in ADRs
7. **Communicate progress** - update stakeholders per SOP

---

## Related Documents

- [SOP: Development Workflow](SOP_DEVELOPMENT_WORKFLOW.md) - Complete process definition
- [Agent Responsibility Matrix](AGENT_RESPONSIBILITY_MATRIX.md) - Agent capabilities and selection
- [Slash Command: /follow-sop](../../.claude/commands/follow-sop.md) - Quick SOP activation

---

**Last Updated:** 2025-11-17
**Template Version:** 1.0
