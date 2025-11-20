# Orchestrator Quick Reference Card

**One-page guide for SOP-compliant orchestration**

---

## 🚀 Quick Start

1. Type `/follow-sop` to activate SOP mode
2. Use [Orchestrator Invocation Template](ORCHESTRATOR_INVOCATION_TEMPLATE.md)
3. Identify current phase (0-5)
4. Deploy agents per phase workflow
5. Validate at phase gates

---

## 📊 Phase Overview

| Phase | Focus | Primary Agents | Gate Criteria |
|-------|-------|----------------|---------------|
| **0: Requirements** | Define & Design | Product-Manager, system-architect | Requirements approved, architecture validated |
| **1: Planning** | Break down work | Product-Manager, tech-lead-reviewer | Tasks defined, risks identified |
| **2: Implementation** | Build features | Frontend-Engineer, Backend-Engineer, typescript-specialist | Code complete, unit tests pass |
| **3: Testing** | Validate quality | test-engineer, qa-automation-specialist, code-reviewer | All tests pass, code reviewed |
| **4: Deployment** | Ship to prod | deployment-specialist, DevOps, Release-Manager | Deployed, monitoring active |
| **5: Operations** | Monitor & maintain | DevOps, tech-lead-reviewer, technical-writer | Incidents resolved, docs updated |

---

## 🎯 Agent Selection Cheat Sheet

### Requirements & Planning
- **Unclear requirements?** → Product-Manager
- **Architecture needed?** → system-architect
- **Need sprint plan?** → Product-Manager
- **Technical feasibility?** → tech-lead-reviewer

### Implementation
- **Frontend work?** → Frontend-Engineer
- **Backend/API work?** → Backend-Engineer
- **TypeScript types?** → typescript-specialist
- **AI/RAG features?** → Data-AI-RAG
- **Lambda functions?** → lambda-orchestrator
- **Database migrations?** → Backend-Engineer
- **XSS concerns?** → xss-protection-specialist

### Testing & Quality
- **Unit tests?** → test-engineer
- **E2E/integration tests?** → qa-automation-specialist
- **Performance testing?** → performance-testing-specialist
- **Code review?** → code-reviewer
- **Security review?** → Security-Reviewer
- **Memory issues?** → memory-optimizer

### Deployment & Ops
- **Deployment strategy?** → deployment-specialist
- **Infrastructure?** → DevOps
- **Build optimization?** → build-automation-specialist
- **Git commits/PRs?** → Release-Manager
- **Production incident?** → tech-lead-reviewer + deployment-specialist
- **Documentation?** → technical-writer

---

## ✅ Validation Checklist

**Before marking phase complete:**

- [ ] All agents completed their deliverables
- [ ] Artifacts passed to next phase
- [ ] Phase gate criteria met
- [ ] Validation passed (automated + manual)
- [ ] Documentation updated
- [ ] Blockers resolved or escalated

---

## 🔄 Standard Agent Invocation

```
Agent: [agent-name]

Task: [Specific task]

Context:
- [Background]
- [From previous agent]

Input Artifacts:
- [Files/docs]

Deliverables:
1. [Primary]
2. [Supporting]

Success Criteria:
- [Measurable 1]
- [Measurable 2]

Validation:
- [How to verify]
```

---

## 🚨 When Things Go Wrong

**Blocker detected:**
1. Document in task tracking
2. Escalate to tech-lead-reviewer
3. Identify workaround or pivot

**Validation fails:**
1. Identify root cause
2. Fix immediately (critical) or log (non-critical)
3. Re-validate before proceeding

**Production incident:**
1. Activate Phase 5 Incident Response
2. tech-lead-reviewer = Incident Commander
3. deployment-specialist = Technical Lead
4. Follow incident workflow in SOP

---

## 📐 Common Workflows

### Full-Stack Feature
1. Phase 0: Product-Manager → system-architect → Security-Reviewer
2. Phase 1: Product-Manager → tech-lead-reviewer
3. Phase 2: Backend-Engineer + Frontend-Engineer (parallel) → typescript-specialist
4. Phase 3: test-engineer → qa-automation-specialist → code-reviewer
5. Phase 4: deployment-specialist → Release-Manager
6. Phase 5: DevOps monitoring

### Performance-Critical Feature
1. Phase 0: Product-Manager → system-architect → **performance-testing-specialist** (baseline)
2. Phase 2: Backend-Engineer (implementation)
3. Phase 3: **performance-testing-specialist** (load testing) → qa-automation-specialist
4. Phase 4: deployment-specialist (canary deployment)
5. Phase 5: DevOps (performance monitoring)

### Security-Sensitive Feature
1. Phase 0: Product-Manager → **Security-Reviewer** (threat model) → system-architect
2. Phase 2: Backend-Engineer → xss-protection-specialist (if frontend)
3. Phase 3: **Security-Reviewer** (security testing) → qa-automation-specialist
4. Phase 4: deployment-specialist (secure deployment)

### Hotfix (Production Bug)
1. Phase 5: tech-lead-reviewer (assess severity)
2. Phase 2: Backend-Engineer or Frontend-Engineer (minimal fix)
3. Phase 3: test-engineer (focused testing) → code-reviewer (quick review)
4. Phase 4: deployment-specialist (expedited deployment)
5. Phase 5: tech-lead-reviewer (postmortem) → technical-writer (runbook update)

---

## 📞 Escalation Path

```
Agent blocked
    ↓
Orchestrator detects
    ↓
Escalate to tech-lead-reviewer
    ↓
tech-lead-reviewer resolves OR escalates to Product-Manager
    ↓
Product-Manager adjusts scope/timeline
```

---

## 🎓 Best Practices

1. **Read SOP first** - Don't skip the documentation
2. **Use templates** - Consistency improves results
3. **Validate early** - Don't wait until the end
4. **Track artifacts** - Know what each agent produces
5. **Respect gates** - Quality checks are mandatory
6. **Document decisions** - Capture rationale
7. **Communicate blockers** - Don't stay stuck
8. **Trust agents** - Let them execute their expertise

---

## 📚 Full Documentation

- **[SOP: Development Workflow](SOP_DEVELOPMENT_WORKFLOW.md)** - Complete process (2,500+ lines)
- **[Agent Responsibility Matrix](AGENT_RESPONSIBILITY_MATRIX.md)** - Agent details & patterns
- **[Orchestrator Invocation Template](ORCHESTRATOR_INVOCATION_TEMPLATE.md)** - Copy-paste templates

---

**Print this. Keep it visible. Reference it often.**

**Last Updated:** 2025-11-17
