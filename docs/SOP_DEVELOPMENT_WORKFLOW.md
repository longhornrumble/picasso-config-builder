# STANDARD OPERATING PROCEDURE: DEVELOPMENT WORKFLOW

**Version**: 2.2
**Last Updated**: 2025-11-17
**Status**: Active
**Scope**: All software development projects

---

## Purpose

This Standard Operating Procedure (SOP) defines the complete workflow for software delivery from requirements to production, including validation requirements, quality gates, deployment operations, and incident management. This SOP is project-agnostic and applies to any software development effort.

**For Orchestration Agents:** This SOP includes explicit agent assignments, handoff points, and invocation templates to enable autonomous task execution and coordination.

---

## Agent Reference

> **📚 Detailed Agent Capabilities:** For comprehensive agent definitions, selection guidance, and collaboration patterns, see [AGENT_RESPONSIBILITY_MATRIX.md](./AGENT_RESPONSIBILITY_MATRIX.md)

---

## Core Principle

**Every task must be validated before it is considered complete.**

No task can be marked as "done" until it passes all validation checks defined in this SOP.

---

## Table of Contents

1. [Standard Task Workflow](#standard-task-workflow)
2. [Requirements Refinement Process](#requirements-refinement-process)
3. [Architecture and Design Review](#architecture-and-design-review)
4. [Validation Framework](#validation-framework---required-steps)
5. [Quality Gates](#quality-gates)
6. [Agent Deployment Guidelines](#agent-deployment-guidelines)
7. [Security Review Process](#security-review-process)
8. [Deployment and Release Management](#deployment-and-release-management)
9. [Performance Monitoring and Observability](#performance-monitoring-and-observability)
10. [Incident Response and Hotfix Workflow](#incident-response-and-hotfix-workflow)
11. [Stakeholder Communication Plan](#stakeholder-communication-plan)
12. [Dependency Management](#dependency-management)
13. [Technical Debt Management](#technical-debt-management)
14. [Knowledge Transfer](#knowledge-transfer)
15. [Task Completion Checklist](#task-completion-checklist)
16. [Commit Message Standards](#commit-message-standards)
17. [Failure Recovery](#failure-recovery)
18. [Metrics and Continuous Improvement](#validation-metrics)

---

## Standard Task Workflow

### Phase 0: Requirements and Design

**🎯 Primary Agents:** Product-Manager, system-architect, Security-Reviewer, performance-testing-specialist

**📋 Phase Objectives:**
- Clarify and validate requirements
- Design system architecture
- Identify security and performance concerns
- Establish acceptance criteria

**🔄 Agent Workflow:**

#### Step 1: Requirements Refinement
**Agent:** Product-Manager
**Input:** Initial requirements, stakeholder needs
**Output:** Refined requirements document, acceptance criteria
**Validation:** Stakeholder sign-off required

#### Step 2: Architecture Design (for complex features)
**Agent:** system-architect
**Input:** Refined requirements from Product-Manager
**Output:** TDD, ADRs, component diagrams
**Validation:** tech-lead-reviewer approval

#### Step 3: Security Assessment (for sensitive features)
**Agent:** Security-Reviewer
**Input:** Requirements + architecture design
**Output:** Threat model, security requirements
**Validation:** Security checklist complete

#### Step 4: Performance Planning (for performance-critical features)
**Agent:** performance-testing-specialist
**Input:** Requirements + architecture design
**Output:** Performance targets (SLOs), baseline plan
**Validation:** Performance budgets defined

**✅ Phase Gate:** Requirements approved, architecture validated, security/performance considerations documented

---

### Phase 1: Planning

**🎯 Primary Agents:** Product-Manager, tech-lead-reviewer

**📋 Phase Objectives:**
- Break down work into tasks
- Identify dependencies and risks
- Allocate resources
- Create sprint plan

**🔄 Agent Workflow:**

#### Step 1: Sprint Planning
**Agent:** Product-Manager
**Input:** Phase 0 deliverables
**Output:** Sprint plan, prioritized backlog, task breakdown
**Validation:** Capacity matches estimates

#### Step 2: Technical Feasibility Review
**Agent:** tech-lead-reviewer
**Input:** Sprint plan from Product-Manager
**Output:** Feasibility assessment, risk identification, scope validation
**Validation:** No critical blockers identified

**✅ Phase Gate:** Tasks defined, resources allocated, risks identified

---

### Phase 2: Implementation

**🎯 Primary Agents:** Frontend-Engineer, Backend-Engineer, typescript-specialist, Data-AI-RAG, lambda-orchestrator

**📋 Phase Objectives:**
- Implement features according to design
- Write clean, maintainable code
- Follow coding standards
- Create initial tests

**🔄 Agent Selection Logic:**

```
IF task involves UI/UX → Frontend-Engineer
IF task involves API/backend → Backend-Engineer
IF task involves TypeScript conversion/types → typescript-specialist
IF task involves AI/RAG/knowledge base → Data-AI-RAG
IF task involves AWS Lambda → lambda-orchestrator
IF task involves database migration → Backend-Engineer
IF task involves XSS protection → xss-protection-specialist
```

**🔄 Agent Workflow Example (Full-Stack Feature):**

#### Step 1: Backend Implementation
**Agent:** Backend-Engineer
**Input:** TDD, API contracts, database schema
**Output:** API endpoints, service layer, database migrations, unit tests
**Validation:** API contracts met, migrations tested

#### Step 2: Frontend Implementation (parallel with Step 1)
**Agent:** Frontend-Engineer
**Input:** UI designs, API contracts, component specs
**Output:** UI components, state management, routing, unit tests
**Validation:** UI matches designs, accessibility compliance

#### Step 3: Type Safety Enhancement
**Agent:** typescript-specialist
**Input:** Backend + Frontend code
**Output:** Strong type definitions, interfaces, type guards
**Validation:** No `any` types, full type coverage

**✅ Phase Gate:** All code written, unit tests pass, artifacts committed

---

### Phase 3: Testing & Validation (MANDATORY)

**🎯 Primary Agents:** test-engineer, qa-automation-specialist, performance-testing-specialist, code-reviewer, Security-Reviewer

**📋 Phase Objectives:**
- Comprehensive test coverage
- Quality assurance
- Performance validation
- Security verification

**🔄 Agent Workflow:**

#### Step 1: Unit Test Enhancement
**Agent:** test-engineer
**Input:** Implementation code
**Output:** Comprehensive unit tests, edge case coverage, mocks/fixtures
**Validation:** >80% code coverage

#### Step 2: Integration & E2E Testing
**Agent:** qa-automation-specialist
**Input:** Complete implementation
**Output:** E2E test suite, integration tests, cross-environment validation
**Validation:** All critical paths tested

#### Step 3: Performance Testing (for performance-critical features)
**Agent:** performance-testing-specialist
**Input:** Complete implementation, performance targets
**Output:** Load test results, performance baseline, bottleneck analysis
**Validation:** SLOs met, no regressions

#### Step 4: Code Review
**Agent:** code-reviewer
**Input:** All implementation code
**Output:** Code review report, refactoring suggestions
**Validation:** Code quality standards met

#### Step 5: Security Review (for security-sensitive features)
**Agent:** Security-Reviewer
**Input:** Complete implementation
**Output:** Security audit report, vulnerability scan results
**Validation:** No critical/high vulnerabilities

**✅ Phase Gate:** All tests pass, code reviewed, security validated, performance acceptable

---

### Phase 4: Deployment

**🎯 Primary Agents:** deployment-specialist, DevOps, Release-Manager, build-automation-specialist

**📋 Phase Objectives:**
- Deploy to staging/production
- Verify deployment success
- Monitor post-deployment
- Enable rollback if needed

**🔄 Agent Workflow:**

#### Step 1: Deployment Strategy
**Agent:** deployment-specialist
**Input:** Implementation, deployment requirements
**Output:** Deployment plan (blue-green/canary/rolling), rollback procedure
**Validation:** Rollback tested in staging

#### Step 2: Infrastructure Setup (if needed)
**Agent:** DevOps
**Input:** Infrastructure requirements
**Output:** IaC updates, monitoring dashboards, alerts configured
**Validation:** Infrastructure provisioned, monitoring active

#### Step 3: Build Optimization (if needed)
**Agent:** build-automation-specialist
**Input:** Build configuration
**Output:** Optimized build process, bundle analysis
**Validation:** Build time acceptable, bundle size within budget

#### Step 4: Deployment Execution
**Agent:** deployment-specialist
**Input:** Deployment plan, artifacts
**Output:** Deployment to staging → production
**Validation:** Smoke tests pass, metrics healthy

#### Step 5: Git Commit & PR
**Agent:** Release-Manager
**Input:** All code and documentation
**Output:** Commits, PR, release notes
**Validation:** PR approved, merged

**✅ Phase Gate:** Deployed successfully, monitoring active, rollback ready

---

### Phase 5: Operations & Maintenance

**🎯 Primary Agents:** DevOps, tech-lead-reviewer, deployment-specialist, technical-writer

**📋 Phase Objectives:**
- Monitor system health
- Respond to incidents
- Maintain documentation
- Manage technical debt

**🔄 Incident Response Workflow:**

#### Step 1: Incident Detection & Triage
**Agent:** tech-lead-reviewer (Incident Commander)
**Input:** Alert, user report
**Output:** Severity classification, incident team assembled
**Validation:** Severity confirmed, stakeholders notified

#### Step 2: Investigation & Fix
**Agent:** deployment-specialist (Technical Lead)
**Input:** Incident details, system logs
**Output:** Root cause, hotfix implementation
**Validation:** Fix tested in staging

#### Step 3: Hotfix Deployment
**Agent:** deployment-specialist
**Input:** Hotfix code
**Output:** Emergency deployment to production
**Validation:** Incident resolved, metrics normalized

#### Step 4: Postmortem
**Agent:** tech-lead-reviewer
**Input:** Incident timeline, actions taken
**Output:** Blameless postmortem document, action items
**Validation:** Action items assigned with owners

#### Step 5: Documentation Update
**Agent:** technical-writer
**Input:** Postmortem, runbook gaps identified
**Output:** Updated runbooks, incident documentation
**Validation:** Documentation reviewed and published

**✅ Phase Gate:** Incident resolved, lessons documented, action items tracked

---

## Requirements Refinement Process

**🎯 Agent:** Product-Manager

**Purpose**: Ensure requirements are well-understood, validated, and complete before implementation begins.

### When to Deploy Agent

✅ **Always deploy Product-Manager when:**
- New features - Before starting any new feature work
- Complex tasks - Any task with ambiguity or multiple approaches
- Cross-team work - Features involving multiple teams or systems
- User-facing changes - Changes that affect user experience
- API changes - Changes to public interfaces or contracts

❌ **Skip for:**
- Minor bug fixes with clear scope
- Documentation-only updates
- Small refactoring with no functional changes

### Agent Invocation Template

```
Agent: Product-Manager

Task: Refine requirements for [feature name]

Context:
- Initial requirements: [description]
- Stakeholders: [list]
- Business goal: [objective]
- Timeline: [deadline]

Deliverables:
1. Refined requirements document with:
   - User stories (As a/I want/So that format)
   - Acceptance criteria (Given/When/Then format)
   - Non-functional requirements (performance, security, compliance)
   - Edge cases identified
   - Dependencies listed
2. Stakeholder sign-off confirmation
3. Risk assessment

Success Criteria:
- Requirements are clear and unambiguous
- Stakeholders approve requirements
- Acceptance criteria are testable
- Scope is well-defined
```

### Requirements Refinement Steps

#### 1. Stakeholder Identification

- **Identify key stakeholders** - Who needs this feature?
- **Identify decision makers** - Who has approval authority?
- **Identify subject matter experts** - Who has domain knowledge?
- **Identify affected teams** - Who will be impacted?

#### 2. Requirement Clarification

Ask the following questions:
- **What problem are we solving?** - Core business need
- **Who is the user?** - Target audience and use cases
- **What is the expected outcome?** - Success criteria
- **What are the constraints?** - Time, budget, technical limitations
- **What is out of scope?** - Explicit boundaries

#### 3. Acceptance Criteria Definition

Create clear, testable acceptance criteria:

```
Given [context/precondition]
When [action taken]
Then [expected result]
```

**Example**:
```
Given a user is logged in
When they click the "Export" button
Then a CSV file downloads with all transaction data
And the file includes headers
And the filename includes the current date
```

#### 4. Non-Functional Requirements

Capture requirements beyond functionality:

- **Performance** - Response time, throughput, load capacity
- **Security** - Authentication, authorization, encryption, compliance
- **Scalability** - Growth expectations, concurrent users
- **Reliability** - Uptime targets, error handling
- **Usability** - Accessibility, mobile support, browser compatibility
- **Maintainability** - Code standards, documentation needs
- **Compliance** - Regulatory requirements (GDPR, HIPAA, etc.)

#### 5. Edge Case Identification

Identify scenarios beyond the happy path:
- **Error conditions** - Invalid input, network failures, timeouts
- **Boundary conditions** - Empty data, max limits, minimum values
- **Concurrent operations** - Race conditions, locking
- **Data anomalies** - Missing data, corrupted data, legacy formats
- **Unusual user behavior** - Rapid clicking, browser back button

#### 6. Dependency Identification

Identify external dependencies:
- **APIs/Services** - Third-party integrations
- **Data sources** - Databases, files, external systems
- **Other teams** - Features requiring coordination
- **Infrastructure** - New servers, services, configurations

#### 7. Validation and Sign-Off

- **Review with stakeholders** - Confirm understanding is correct
- **Get explicit approval** - Written sign-off on requirements
- **Document assumptions** - Record any uncertainties or assumptions
- **Baseline estimates** - Initial time/effort estimates

### Requirements Documentation Template

```markdown
## Feature: [Feature Name]

### Business Need
[Why are we building this?]

### User Story
As a [user type]
I want [goal]
So that [benefit]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Non-Functional Requirements
- Performance: [targets]
- Security: [requirements]
- Compliance: [regulations]

### Edge Cases
- [Edge case 1]: [handling]
- [Edge case 2]: [handling]

### Dependencies
- [Dependency 1]: [status]
- [Dependency 2]: [status]

### Out of Scope
- [Explicitly not included]

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Stakeholders
- Owner: [name]
- Approver: [name]
- SMEs: [names]
```

### Common Requirements Pitfalls

**Avoid these mistakes:**
- ❌ Assuming you understand without asking questions
- ❌ Skipping edge case discussion
- ❌ Ignoring non-functional requirements
- ❌ Starting implementation before stakeholder approval
- ❌ Verbal agreements only (get written confirmation)
- ❌ Not documenting assumptions

---

## Architecture and Design Review

**🎯 Agent:** system-architect

**Purpose**: Ensure architectural decisions are sound before implementation and maintain system consistency.

### When to Deploy Agent

✅ **Always deploy system-architect for:**
- **New services or modules** - Greenfield development
- **Significant refactoring** - Changing core system structure
- **Database schema changes** - Altering data models
- **API design** - Creating or modifying public interfaces
- **Cross-cutting concerns** - Auth, logging, caching, etc.
- **Performance-critical features** - Features with strict SLAs
- **Integration with external systems** - Third-party APIs, services
- **Security-sensitive features** - Authentication, authorization, PII handling

⚠️ **Deploy if:**
- Feature sets a precedent others will copy
- Multiple valid approaches exist
- Complexity could grow significantly

❌ **Skip for:**
- Simple CRUD following established patterns
- Minor bug fixes with no architectural impact
- Documentation updates
- Test additions

### Agent Invocation Template

```
Agent: system-architect

Task: Design architecture for [feature/system name]

Context:
- Requirements: [from Product-Manager]
- Current architecture: [brief overview]
- Constraints: [technical, timeline, budget]
- Performance targets: [SLOs if applicable]

Deliverables:
1. Technical Design Document (TDD) including:
   - Architecture diagrams
   - Component breakdown
   - Data flow diagrams
   - API contracts
   - Database schema (if applicable)
2. Architectural Decision Records (ADRs) for key decisions
3. Risk assessment
4. Alternative approaches considered

Success Criteria:
- Design is scalable and maintainable
- Security considerations addressed
- Performance targets achievable
- tech-lead-reviewer approves design
```

### Architecture Review Process

#### 1. Technical Design Document (TDD)

For complex features, create a Technical Design Document covering:

**Document Structure:**
```markdown
## Technical Design: [Feature Name]

### Overview
- Purpose and goals
- Success criteria
- Timeline and milestones

### Current State
- Existing architecture
- Current limitations/problems
- Why change is needed

### Proposed Solution
- High-level approach
- Architecture diagram
- Component breakdown
- Data flow

### Design Decisions
- Key decisions made
- Alternatives considered
- Rationale for chosen approach

### API Design
- Endpoints (REST, GraphQL, etc.)
- Request/response formats
- Error handling
- Versioning strategy

### Data Model
- Schema changes
- Migration strategy
- Data retention
- Backup/recovery

### Security Considerations
- Authentication/authorization
- Data encryption
- Input validation
- Rate limiting

### Performance Considerations
- Expected load
- Scalability approach
- Caching strategy
- Database indexes

### Testing Strategy
- Unit test approach
- Integration test plan
- Load testing plan
- Rollback plan

### Deployment Strategy
- Rollout plan
- Feature flags
- Monitoring/alerts
- Rollback procedure

### Risks and Mitigation
- Technical risks
- Timeline risks
- Mitigation strategies

### Open Questions
- Unresolved items
- Decisions needed
```

#### 2. Architectural Decision Records (ADRs)

For significant architectural decisions, create an ADR:

**ADR Template:**
```markdown
# ADR-[NUMBER]: [Decision Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Date**: YYYY-MM-DD
**Decision Makers**: [Names]

## Context
[What is the issue we're seeing that motivates this decision?]

## Decision
[What is the change we're proposing/making?]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Tradeoff 1]
- [Tradeoff 2]

### Neutral
- [Note 1]

## Alternatives Considered
### Option 1: [Name]
- Pros: [...]
- Cons: [...]
- Why rejected: [...]

### Option 2: [Name]
- Pros: [...]
- Cons: [...]
- Why rejected: [...]
```

#### 3. Design Review Meeting

**Participants:**
- Feature owner
- Architect or tech lead
- Senior engineers
- Security engineer (if applicable)
- DevOps/SRE (for infrastructure changes)

**Agenda:**
1. Present problem and proposed solution (15 min)
2. Discuss architecture and design decisions (30 min)
3. Review alternatives considered (15 min)
4. Security and performance review (15 min)
5. Identify risks and mitigation (10 min)
6. Q&A and decision (15 min)

**Outputs:**
- Approved design or list of changes needed
- Action items for design updates
- Risks logged in risk register
- ADRs created for major decisions

#### 4. Design Review Checklist

Before approving a design, verify:

**Scalability**
- [ ] Solution scales to expected load
- [ ] Database queries optimized
- [ ] Caching strategy defined
- [ ] Rate limiting considered

**Maintainability**
- [ ] Code organization follows project patterns
- [ ] Modules have clear responsibilities
- [ ] Dependencies are minimal and justified
- [ ] Testing strategy is comprehensive

**Security**
- [ ] Authentication/authorization defined
- [ ] Input validation specified
- [ ] Sensitive data handling addressed
- [ ] Rate limiting and abuse prevention

**Reliability**
- [ ] Error handling defined
- [ ] Retry logic specified
- [ ] Circuit breakers for external calls
- [ ] Monitoring and alerting planned

**Performance**
- [ ] Performance targets defined
- [ ] Bottlenecks identified and addressed
- [ ] Load testing plan exists
- [ ] Optimization opportunities noted

**Compatibility**
- [ ] Backward compatibility maintained (or versioning strategy defined)
- [ ] Breaking changes documented
- [ ] Migration path for existing users
- [ ] Deprecation timeline (if applicable)

### Common Architecture Antipatterns to Avoid

**Red flags in design review:**
- 🚫 **Big Ball of Mud** - No clear structure or boundaries
- 🚫 **God Object** - One module doing too much
- 🚫 **Spaghetti Code** - Tangled dependencies
- 🚫 **Copy-Paste Programming** - Duplicated logic instead of abstraction
- 🚫 **Premature Optimization** - Over-engineering before proven need
- 🚫 **Not Invented Here** - Reinventing existing solutions
- 🚫 **Analysis Paralysis** - Over-designing instead of iterating

### When to Skip Architecture Review

**Review can be lightweight or skipped for:**
- Simple CRUD operations following established patterns
- Minor bug fixes with no architectural impact
- Documentation updates
- Test additions
- Configuration changes

**Even for simple changes, consider:**
- Does this set a precedent?
- Will others copy this pattern?
- Could this grow in complexity?

If yes, do a lightweight review to ensure good patterns are established.

---

## Validation Framework - Required Steps

### After EVERY Task Completion

**Step 1: Quick Validation**
- Run fast validation checks (type checking, linting, quick build)
- **Must pass before proceeding**

**Step 2: Domain-Specific Validation**
- Run validation specific to the domain (frontend, backend, infra, etc.)
- Review output and address any failures
- Document any exceptions or known issues

**Step 3: Manual Validation Checklist**

Review task-specific acceptance criteria:

- [ ] All required artifacts exist
- [ ] Code compiles/builds without errors
- [ ] Type safety maintained (no weakening of type system)
- [ ] Code follows project patterns and conventions
- [ ] Documentation is complete and accurate
- [ ] Examples demonstrate usage clearly
- [ ] No errors in runtime execution

**Step 4: QA Agent Deployment (Conditional)**

Deploy `qa-automation-specialist` agent when:
- Task involves complex logic or algorithms
- Integration testing required across modules
- Cross-component validation needed
- External API integration needs testing
- Performance requirements must be verified
- Critical user-facing functionality

**How to deploy:**
```
Launch qa-automation-specialist agent with:
- Clear task description
- List of artifacts to test
- Test scenarios to validate
- Success criteria to meet
- Expected deliverables
```

**Step 5: Full Validation (Before Phase/Milestone Completion)**
- Run comprehensive validation suite
- **Must pass before moving to next phase or milestone**
- Document any known issues or technical debt

---

## Quality Gates

### Task-Level Gate

**Required before marking task complete:**
- ✅ Automated validation passes
- ✅ Manual checklist complete
- ✅ QA agent validates (if applicable)
- ✅ All artifacts committed to version control
- ✅ Documentation updated

### Phase-Level Gate

**Required before starting next phase:**
- ✅ All tasks in phase complete
- ✅ Full validation suite passes
- ✅ Integration tests pass
- ✅ Performance benchmarks met (if applicable)
- ✅ Phase completion report generated
- ✅ Project tracking documentation updated

### Pre-Deployment Gate

**Required before production deployment:**
- ✅ All phases complete
- ✅ End-to-end testing complete
- ✅ Security review passed
- ✅ Performance validated against targets
- ✅ Documentation complete
- ✅ User acceptance testing passed (if applicable)

---

## Agent Deployment Guidelines

### Quick Agent Selection Reference

| Task Type | Primary Agent | When to Deploy |
|-----------|---------------|----------------|
| **Requirements** | Product-Manager | New features, unclear scope |
| **Architecture** | system-architect | New services, API design, refactoring |
| **Frontend** | Frontend-Engineer | UI components, state management |
| **Backend** | Backend-Engineer | API endpoints, business logic, DB |
| **Types** | typescript-specialist | TS conversion, type strengthening |
| **AI/RAG** | Data-AI-RAG | Knowledge bases, embeddings |
| **Lambda** | lambda-orchestrator | AWS Lambda functions |
| **Unit Tests** | test-engineer | Test creation, edge cases |
| **E2E Tests** | qa-automation-specialist | Integration tests, automation |
| **Performance** | performance-testing-specialist | Load tests, baselines, SLOs |
| **Code Review** | code-reviewer | Pre-commit review |
| **Security** | Security-Reviewer | Auth, PII, vulnerabilities |
| **Deployment** | deployment-specialist | Blue-green, canary, rollback |
| **Infrastructure** | DevOps | IaC, monitoring, CI/CD |
| **Documentation** | technical-writer | API docs, runbooks, guides |
| **Incidents** | tech-lead-reviewer | Incident command, postmortems |

### Detailed Agent Usage

**typescript-specialist**
- Creating type definitions or interfaces
- Converting JavaScript to TypeScript
- Strengthening existing type system
- Implementing complex generic types

**Frontend-Engineer**
- Building UI components
- Implementing user interface
- Setting up state management
- Configuring routing and navigation
- Enhanced: Database migrations, schema design

**Backend-Engineer**
- Developing API endpoints
- Implementing service layer logic
- Integrating with databases
- Setting up authentication/authorization
- **Enhanced:** Database migrations, schema design, query optimization

**qa-automation-specialist** (MANDATORY FOR COMPLEX TASKS)
- Creating automated test suites
- Performing integration testing
- Cross-environment validation
- Test coverage analysis
- Performance regression testing

**performance-testing-specialist** (NEW)
- Load testing (JMeter, K6, Artillery)
- Performance baseline establishment
- SLA/SLO validation
- Bottleneck identification
- Capacity planning

**test-engineer**
- Writing unit tests
- Maintaining test suites
- Testing edge cases
- Creating test mocks/fixtures

**code-reviewer**
- Pre-commit code review
- Architecture review
- Pattern compliance checking
- Security review

**technical-writer**
- Writing API documentation
- Creating user guides
- Documenting architecture
- Updating README files

**DevOps**
- Infrastructure as Code
- CI/CD pipelines
- **Enhanced:** Monitoring dashboards, SLO definition, alert configuration

**deployment-specialist**
- Deployment strategies (blue-green, canary)
- Rollback procedures
- **Enhanced:** Incident response, hotfix deployment

**tech-lead-reviewer**
- Architectural validation
- Scope management
- **Enhanced:** Incident Commander role, postmortem facilitation

### Agent Deployment Pattern

```
1. Identify task requirements and complexity
2. Select appropriate specialized agent(s) using selection table
3. Launch agent(s) with detailed invocation template
4. Monitor agent completion and progress
5. Review all deliverables for quality
6. RUN VALIDATION (mandatory step)
7. Deploy qa-automation-specialist if complexity warrants
8. Commit only after validation passes
```

### Standard Agent Invocation Template

```
Agent: [agent-name]

Task: [Clear, specific task description]

Context:
- [Relevant background information]
- [Dependencies from previous agents]
- [Constraints or requirements]

Input Artifacts:
- [File/document from previous step]
- [API contracts, designs, etc.]

Deliverables:
1. [Primary deliverable]
2. [Supporting deliverable]
3. [Documentation]

Success Criteria:
- [Measurable criterion 1]
- [Measurable criterion 2]
- [Validation requirement]

Validation:
- [How to verify success]
```

---

## Validation Scripts Best Practices

### Recommended Validation Commands

Projects should implement these validation levels:

**Quick Validation** (Fast feedback loop)
- Type checking
- Linting
- Quick build/compile
- Fast unit tests

**Full Validation** (Comprehensive checks)
- Type checking
- Linting
- Production build
- Full test suite
- Bundle size analysis (if applicable)

**Domain-Specific Validation**
- Frontend: Component tests, accessibility checks
- Backend: API tests, database migrations
- Infrastructure: Terraform plan, security scans

### Creating Validation Scripts

When setting up a project:

1. Define validation levels based on project needs
2. Create fast feedback loops (< 1 minute for quick validation)
3. Implement comprehensive checks (< 10 minutes for full validation)
4. Document validation commands in project README
5. Integrate into CI/CD pipeline

---

## Security Review Process

**Purpose**: Identify and mitigate security vulnerabilities before they reach production.

### When Security Review is MANDATORY

**Always perform security review for:**
- **Authentication/Authorization changes** - Login, signup, permissions, roles
- **Data handling** - PII, payment data, sensitive information
- **API exposure** - New public endpoints or interfaces
- **Third-party integrations** - External APIs, OAuth, webhooks
- **File upload functionality** - User-provided files or content
- **Database schema changes** - New tables storing sensitive data
- **Cryptographic operations** - Encryption, hashing, key management

### Security Review Checklist

#### Authentication and Authorization
- [ ] Authentication mechanism is secure (not custom crypto)
- [ ] Passwords hashed with strong algorithm (bcrypt, Argon2)
- [ ] Multi-factor authentication supported (if required)
- [ ] Session management is secure (timeouts, rotation)
- [ ] Authorization checks on all protected resources
- [ ] Principle of least privilege enforced
- [ ] No hardcoded credentials or API keys

#### Input Validation
- [ ] All user input is validated and sanitized
- [ ] SQL injection prevention (parameterized queries, ORM)
- [ ] XSS prevention (output encoding, CSP headers)
- [ ] Command injection prevention (no shell execution of user input)
- [ ] Path traversal prevention (file access restrictions)
- [ ] CSRF protection (tokens, SameSite cookies)
- [ ] File upload validation (type, size, content scanning)

#### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data encrypted in transit (TLS 1.2+)
- [ ] PII identified and handled according to regulations
- [ ] Secure deletion of sensitive data
- [ ] Data retention policies enforced
- [ ] Logging doesn't expose sensitive data
- [ ] Database credentials not in source code

#### API Security
- [ ] Rate limiting implemented
- [ ] API authentication required
- [ ] Input size limits enforced
- [ ] Proper error handling (no stack traces to users)
- [ ] CORS configured correctly
- [ ] API versioning strategy in place

#### Dependency Security
- [ ] Dependencies scanned for known vulnerabilities
- [ ] Dependencies from trusted sources
- [ ] Minimal dependencies (avoid unnecessary packages)
- [ ] Regular dependency updates planned
- [ ] License compliance verified

#### Infrastructure Security
- [ ] Secrets management system used (not env vars in code)
- [ ] Least privilege for service accounts
- [ ] Security groups/firewalls configured
- [ ] Logging and monitoring enabled
- [ ] Backup and disaster recovery tested

### Security Tools and Practices

**Recommended tools:**
- **SAST (Static Analysis)**: SonarQube, ESLint security plugins
- **Dependency scanning**: Snyk, Dependabot, npm audit
- **DAST (Dynamic Analysis)**: OWASP ZAP, Burp Suite
- **Secret scanning**: GitGuardian, TruffleHog
- **Container scanning**: Trivy, Clair

**Security practices:**
- Security training for developers
- Regular penetration testing
- Bug bounty program (if applicable)
- Incident response plan
- Security champions in teams

### Common Security Vulnerabilities to Avoid

**OWASP Top 10:**
1. **Broken Access Control** - Ensure authorization checks
2. **Cryptographic Failures** - Use proven crypto libraries
3. **Injection** - Parameterize queries, validate input
4. **Insecure Design** - Threat modeling during design
5. **Security Misconfiguration** - Secure defaults, hardening
6. **Vulnerable Components** - Keep dependencies updated
7. **Authentication Failures** - Strong auth mechanisms
8. **Data Integrity Failures** - Verify data integrity
9. **Logging Failures** - Log security events
10. **SSRF** - Validate URLs, whitelist allowed hosts

### Security Incident Response

If a security vulnerability is discovered:

1. **Assess severity** using CVSS scoring
2. **Notify security team** immediately for critical issues
3. **Create private tracking** (don't publicize until fixed)
4. **Develop fix** following hotfix workflow
5. **Test thoroughly** including security testing
6. **Deploy fix** using expedited process
7. **Notify affected users** (if required by regulations)
8. **Post-mortem** to prevent recurrence

---

## Deployment and Release Management

**Purpose**: Deploy changes safely to production with minimal risk and maximum reliability.

### Environment Strategy

**Standard environments:**
1. **Development** - Individual developer environments
2. **Staging** - Pre-production environment matching production
3. **Production** - Live user-facing environment

**Environment parity requirements:**
- Same infrastructure configuration
- Same dependency versions
- Same environment variables (different values)
- Same deployment process

### Deployment Pipeline

#### 1. Pre-Deployment Checklist

**Before deploying to any environment:**
- [ ] All tests pass (unit, integration, E2E)
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring and alerts configured
- [ ] Documentation updated
- [ ] Stakeholders notified

#### 2. Database Migration Strategy

**For schema changes:**
- **Backward compatible migrations** - Add columns/tables, don't remove
- **Two-phase deployments** - Deploy code, then remove old columns
- **Migration testing** - Test on copy of production data
- **Rollback scripts** - Have reverse migration ready
- **Data validation** - Verify data integrity after migration

**Migration checklist:**
- [ ] Migration script reviewed
- [ ] Tested on production-like data volume
- [ ] Execution time acceptable (< 5 minutes or scheduled maintenance)
- [ ] Rollback script tested
- [ ] Backup taken before migration
- [ ] Indexes added for new queries

#### 3. Deployment Strategies

**Blue-Green Deployment:**
- Two identical environments (blue = current, green = new)
- Deploy to green, test, then switch traffic
- Instant rollback by switching back to blue
- Best for: Zero-downtime deployments

**Canary Deployment:**
- Deploy to small subset of users first
- Monitor metrics and errors
- Gradually increase traffic to new version
- Best for: High-risk changes, large user base

**Rolling Deployment:**
- Deploy to servers one at a time
- Health check each server before continuing
- Roll back if issues detected
- Best for: Stateless applications, Kubernetes

**Feature Flags:**
- Deploy code with features disabled
- Enable features gradually via configuration
- Instant rollback by toggling flag
- Best for: Incremental rollouts, A/B testing

#### 4. Deployment Process

**Step-by-step:**

1. **Create release branch** from main/master
2. **Tag release** with version number (semantic versioning)
3. **Build artifacts** in CI/CD pipeline
4. **Deploy to staging** environment
5. **Run smoke tests** on staging
6. **Get deployment approval** from stakeholders
7. **Schedule deployment window** (if needed)
8. **Deploy to production** using chosen strategy
9. **Run smoke tests** on production
10. **Monitor metrics** for 15-30 minutes
11. **Verify functionality** through manual checks
12. **Mark deployment complete** or rollback if issues

#### 5. Rollback Procedures

**When to rollback:**
- Critical bugs discovered in production
- Performance degradation >20%
- Error rate increase >5%
- Data corruption detected
- Security vulnerability introduced

**Rollback process:**
1. **Stop deployment** if in progress
2. **Revert to previous version** (blue-green switch or previous container)
3. **Rollback database migrations** if schema changed
4. **Clear caches** if applicable
5. **Verify rollback** successful
6. **Notify stakeholders** of rollback
7. **Root cause analysis** after incident resolved

**Rollback checklist:**
- [ ] Previous version still available
- [ ] Database rollback script ready (if needed)
- [ ] Rollback tested in staging
- [ ] Rollback time < 5 minutes
- [ ] Communication plan ready

#### 6. Post-Deployment Verification

**After every deployment:**
- [ ] Smoke tests pass
- [ ] Critical user journeys working
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] Database connections stable
- [ ] External integrations functioning
- [ ] Logs showing expected behavior
- [ ] Monitoring dashboards green

**Monitor for 24 hours:**
- Error rates
- Response times
- Resource utilization (CPU, memory, disk)
- Database performance
- User-reported issues

### Deployment Automation

**CI/CD pipeline stages:**
1. **Build** - Compile code, run linting
2. **Test** - Unit tests, integration tests
3. **Security Scan** - SAST, dependency check
4. **Build Artifacts** - Docker images, packages
5. **Deploy to Staging** - Automated deployment
6. **Integration Tests** - E2E tests on staging
7. **Manual Approval** - Gate before production
8. **Deploy to Production** - Automated deployment
9. **Smoke Tests** - Verify critical paths
10. **Notify** - Success/failure notifications

### Deployment Schedule

**Recommended practices:**
- **Deploy during business hours** - Team available if issues
- **Avoid Fridays** - Weekend incident risk
- **Avoid holidays** - Reduced staff availability
- **Scheduled maintenance windows** - For high-risk changes
- **Change freeze periods** - During critical business periods

---

## Performance Monitoring and Observability

**Purpose**: Ensure system performance meets targets and detect issues before users are impacted.

### Performance Baseline Establishment

**Before deploying a feature:**
1. **Define performance targets**
   - Response time (p50, p95, p99)
   - Throughput (requests per second)
   - Resource utilization (CPU, memory, disk)
   - Error rate (< 0.1% typically)

2. **Measure current performance**
   - Benchmark existing system
   - Identify bottlenecks
   - Document baseline metrics

3. **Load test new features**
   - Simulate expected load
   - Simulate peak load (2-10x normal)
   - Identify breaking points

### Monitoring Strategy

#### 1. Application Monitoring

**Metrics to track:**
- **Request metrics**: Rate, duration, error rate
- **Resource metrics**: CPU, memory, disk, network
- **Business metrics**: User signups, transactions, conversions
- **Custom metrics**: Feature-specific KPIs

**Tools:**
- APM: New Relic, Datadog, AppDynamics
- Metrics: Prometheus, Grafana, CloudWatch
- Tracing: Jaeger, Zipkin, X-Ray

#### 2. Log Aggregation

**Logging best practices:**
- **Structured logging** - JSON format for parsing
- **Log levels** - DEBUG, INFO, WARN, ERROR, CRITICAL
- **Correlation IDs** - Track requests across services
- **Sensitive data redaction** - No PII in logs
- **Log retention** - 30-90 days typically

**Tools:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch Logs
- Datadog Logs

#### 3. Error Tracking

**Capture and alert on:**
- **Exceptions and stack traces**
- **Failed API calls**
- **Timeout errors**
- **Database errors**
- **Third-party integration failures**

**Tools:**
- Sentry
- Rollbar
- Bugsnag
- Raygun

#### 4. Synthetic Monitoring

**Proactive monitoring:**
- **Uptime checks** - Ping endpoints every 1-5 minutes
- **Synthetic transactions** - Simulate user journeys
- **Multi-region checks** - Verify global availability
- **SSL certificate monitoring** - Alert before expiry

**Tools:**
- Pingdom
- UptimeRobot
- Datadog Synthetics
- New Relic Synthetics

### SLA and SLO Definition

**Service Level Objectives (SLOs):**
- Internal targets for reliability
- Example: "99.9% uptime" = 43 minutes downtime/month
- Example: "95% of requests < 200ms"

**Service Level Agreements (SLAs):**
- External commitments to customers
- Usually more conservative than SLOs
- Financial penalties if breached

**Service Level Indicators (SLIs):**
- Metrics used to measure SLOs
- Availability, latency, error rate, throughput

**Example SLO definition:**
```
Service: User API
SLI: Request success rate
SLO: 99.95% of requests succeed (HTTP 2xx or 3xx)
Measurement window: 30-day rolling window
Alert threshold: < 99.9% over 1 hour
```

### Alerting Strategy

**Alert severity levels:**
1. **Critical** - Immediate action required, page on-call
2. **High** - Action needed within hours
3. **Medium** - Action needed within day
4. **Low** - Informational, review during business hours

**Alert best practices:**
- **Actionable** - Alert should indicate what to do
- **Avoid alert fatigue** - Don't alert on minor issues
- **Escalation policy** - Primary, secondary, manager
- **Alert routing** - PagerDuty, Opsgenie, VictorOps

**Common alerts:**
- Error rate > 1% for 5 minutes
- Response time p95 > 500ms for 10 minutes
- CPU utilization > 80% for 15 minutes
- Disk space < 10% remaining
- Failed deployments
- SSL certificate expiring in 7 days

### Performance Regression Detection

**Automated checks:**
- **Benchmark tests** - Run on every deploy
- **Load tests** - Weekly or monthly
- **Performance budgets** - Fail build if exceeded
- **Comparison to baseline** - Alert if >10% degradation

**Performance budgets:**
- Page load time < 3 seconds
- Time to interactive < 5 seconds
- Bundle size < 500KB
- API response time p95 < 200ms

### Dashboards

**Create dashboards for:**
- **System health** - Overall status at a glance
- **Business metrics** - Revenue, users, transactions
- **Service-specific** - Per microservice or component
- **On-call** - For incident responders

**Dashboard best practices:**
- Use graphs over numbers
- Color code by severity (green/yellow/red)
- Include comparison to previous period
- Link to runbooks for common issues

---

## QA Automation Specialist - Usage Guide

### Deployment Template

```
Launch qa-automation-specialist agent with:

Task: Validate [Task Description]

Context:
- Task completed by [agent-name or developer]
- Artifacts created: [list all files, components, modules]
- Key functionality: [describe what was built]

Validation Requirements:
1. [Specific test scenario 1]
2. [Specific test scenario 2]
3. [Specific test scenario 3]

Acceptance Criteria:
- [Criteria from requirements]
- Test coverage target (e.g., >80%)
- All tests must pass
- No errors in execution
- Performance benchmarks met

Deliverables:
- Test files created/updated
- Test execution report
- Coverage metrics provided
- Issues identified (if any)
- Recommendations for improvements
```

### When QA Agent is MANDATORY

**Always deploy qa-automation-specialist for:**
1. **Phase/milestone completion** - Before moving forward
2. **Complex business logic** - State machines, validation engines, algorithms
3. **External integrations** - API, database, third-party services
4. **Critical path features** - Features on the critical path to release
5. **User-facing functionality** - UIs, APIs, public interfaces

**Optional for:**
1. Simple CRUD operations (if validated by manual testing)
2. Documentation-only tasks
3. Minor refactoring (if covered by existing tests)
4. Internal tooling with low impact

---

## Incident Response and Hotfix Workflow

**Purpose**: Handle production incidents quickly and effectively while maintaining quality standards.

### Incident Severity Classification

**SEV 1 (Critical)**
- Complete service outage
- Data loss or corruption
- Security breach
- Financial impact > $10K/hour

**Response**: Immediate (< 15 minutes)
**Resolution Target**: < 4 hours
**Communication**: Hourly updates to stakeholders

**SEV 2 (High)**
- Major feature unavailable
- Severe performance degradation
- Affects >20% of users
- Workaround available

**Response**: < 1 hour
**Resolution Target**: < 24 hours
**Communication**: Every 4 hours

**SEV 3 (Medium)**
- Minor feature degraded
- Affects <20% of users
- Minimal business impact
- Workaround exists

**Response**: < 4 hours
**Resolution Target**: < 3 days
**Communication**: Daily updates

**SEV 4 (Low)**
- Cosmetic issues
- Minimal user impact
- Can be addressed in normal workflow

**Response**: Next business day
**Resolution Target**: Next sprint
**Communication**: Include in regular updates

### Incident Response Process

#### 1. Detection and Alert

**Incident can be detected by:**
- Monitoring alerts
- User reports
- Support tickets
- Social media
- Team members

**First responder actions:**
1. Acknowledge alert/report
2. Assess severity
3. Create incident tracking ticket
4. Page on-call if SEV 1 or SEV 2
5. Start incident timeline documentation

#### 2. Incident Response Roles

**Incident Commander**
- Owns incident resolution
- Coordinates team members
- Makes tactical decisions
- Communicates with stakeholders

**Technical Lead**
- Investigates root cause
- Implements fixes
- Coordinates with other engineers
- Documents technical details

**Communications Lead**
- Updates status page
- Notifies stakeholders
- Handles customer communication
- Documents incident timeline

**Subject Matter Experts**
- Provide domain expertise
- Assist with investigation
- Implement fixes
- Review changes

#### 3. Investigation and Diagnosis

**Systematic approach:**
1. **Gather information** - Logs, metrics, user reports
2. **Form hypothesis** - What could cause this?
3. **Test hypothesis** - Check logs, reproduce issue
4. **Identify root cause** - What is actually broken?
5. **Plan fix** - How to resolve quickly?

**Investigation checklist:**
- [ ] Check recent deployments
- [ ] Review error logs
- [ ] Check monitoring dashboards
- [ ] Review recent configuration changes
- [ ] Check third-party service status
- [ ] Review database performance
- [ ] Check resource utilization

#### 4. Resolution and Fix

**For SEV 1/SEV 2 incidents:**

**Option A: Rollback**
- If issue caused by recent deployment
- Fastest path to stability
- Use established rollback procedure

**Option B: Hotfix**
- If rollback not possible
- If issue not deployment-related
- Follow expedited workflow (below)

**Option C: Mitigation**
- If fix will take hours/days
- Implement temporary workaround
- Schedule proper fix

### Hotfix Workflow (Expedited)

**When to use hotfix workflow:**
- SEV 1 or SEV 2 incident
- Production bug requiring immediate fix
- Security vulnerability
- Data integrity issue

**Hotfix process:**

1. **Create hotfix branch** from production tag
2. **Implement minimal fix** - Smallest change to resolve issue
3. **Peer review** - Required even for hotfixes
4. **Testing** - Focused testing on fix area
5. **Security scan** - If security-related
6. **Deploy to staging** - Quick smoke test
7. **Deploy to production** - Using established deployment process
8. **Monitor** - Watch metrics for 1 hour minimum
9. **Merge to main** - Ensure fix in main branch
10. **Document** - Record in incident timeline

**Hotfix validation (reduced, but mandatory):**
- [ ] Code review by senior engineer (15 min max)
- [ ] Unit tests pass
- [ ] Smoke tests pass
- [ ] Security scan (if relevant)
- [ ] Rollback plan ready

**Quality gates can be relaxed for hotfixes:**
- ✅ Require: Code review, core tests, rollback plan
- ⚠️ Optional: Full test suite, performance tests, documentation updates
- 📝 Create follow-up tasks for skipped items

#### 5. Communication During Incidents

**Status page updates:**
- Initial: "Investigating issue with [service]"
- Update: "We have identified the cause and are implementing a fix"
- Resolution: "Issue resolved. Monitoring for stability."
- Postmortem: "Root cause analysis available [link]"

**Internal communication:**
- Create dedicated incident channel (Slack, Teams)
- Post updates every 15-30 minutes
- Tag relevant team members
- Document actions taken

**External communication:**
- Update status page immediately
- Notify affected customers
- Provide ETA if possible
- Apologize for inconvenience

#### 6. Incident Resolution

**Incident is resolved when:**
- Service restored to normal operation
- Monitoring shows healthy metrics
- No user-reported issues for 1 hour
- Root cause identified
- Fix verified in production

**Resolution checklist:**
- [ ] Service functioning normally
- [ ] Metrics returned to baseline
- [ ] No active alerts
- [ ] Users can complete critical workflows
- [ ] Fix verified
- [ ] Rollback plan tested (if not used)
- [ ] Status page updated
- [ ] Stakeholders notified

#### 7. Post-Incident Review (Blameless Postmortem)

**Schedule within 48 hours of resolution**

**Postmortem doc structure:**
```markdown
## Incident: [Title]

### Summary
- **Date**: YYYY-MM-DD
- **Duration**: X hours
- **Severity**: SEV 1/2/3/4
- **Impact**: [Users affected, revenue lost, etc.]

### Timeline
- [Time] Initial detection
- [Time] Incident declared
- [Time] Root cause identified
- [Time] Fix deployed
- [Time] Incident resolved

### Root Cause
[Technical explanation of what went wrong]

### Resolution
[How we fixed it]

### Impact
- Users affected: [number or %]
- Revenue impact: [$amount]
- Data loss: [description]
- Reputation impact: [social media, press]

### What Went Well
- [Things that helped resolve quickly]

### What Went Wrong
- [Things that slowed resolution]

### Action Items
- [ ] [Prevent recurrence] - Owner: [name] - Due: [date]
- [ ] [Improve detection] - Owner: [name] - Due: [date]
- [ ] [Improve response] - Owner: [name] - Due: [date]

### Lessons Learned
- [Key takeaways]
```

**Postmortem best practices:**
- **Blameless** - Focus on systems, not individuals
- **Actionable** - Concrete action items with owners
- **Transparent** - Share widely with team
- **Follow-up** - Track action items to completion

---

## Stakeholder Communication Plan

**Purpose**: Keep stakeholders informed and aligned throughout the development process.

### Stakeholder Identification

**Types of stakeholders:**
- **Product owners** - Define features and priorities
- **Business stakeholders** - Budget and timeline authority
- **End users** - Will use the software
- **Other teams** - Dependencies and integrations
- **Leadership** - Strategic oversight

### Communication Cadence

**Regular updates:**

**Daily (for active projects)**
- **Stand-up** - 15 min sync on progress/blockers
- **Slack updates** - Async status in project channel

**Weekly**
- **Sprint planning** - Plan next week's work
- **Demo** - Show completed features
- **Retrospective** - Process improvements

**Bi-weekly/Monthly**
- **Steering committee** - Strategic decisions
- **Roadmap review** - Long-term planning
- **Metrics review** - KPIs and success metrics

### Update Triggers

**Communicate immediately when:**
- **Blocker identified** - Can't proceed without resolution
- **Scope change needed** - Requirements need adjustment
- **Timeline at risk** - Won't hit committed deadline
- **Critical bug found** - Severity 1 or 2 issue
- **Dependency change** - External factor affects project
- **Resource change** - Team member leaving/joining

### Status Reporting Format

**Weekly status update template:**
```markdown
## Project: [Name] - Week of [Date]

### Progress This Week
- [Completed item 1]
- [Completed item 2]
- [Completed item 3]

### Planned for Next Week
- [Planned item 1]
- [Planned item 2]

### Blockers
- [Blocker 1] - Impact: High - Need: [what's needed]
- [Blocker 2] - Impact: Medium - Need: [what's needed]

### Risks
- [Risk 1] - Probability: Medium - Mitigation: [plan]

### Metrics
- Velocity: [X story points]
- Test coverage: [X%]
- Bugs: [X open, X resolved]

### Asks
- [Decision needed] - Due by: [date]
- [Resource needed] - Need by: [date]
```

### Demo and Review Sessions

**Sprint demo best practices:**
- **Prepare ahead** - Test demo environment
- **Show, don't tell** - Live demonstration
- **Focus on value** - Business benefit, not technical details
- **Gather feedback** - Allocate time for questions
- **Document feedback** - Capture for prioritization

**Demo structure (30 min)**
1. **Recap** (2 min) - What we planned vs. delivered
2. **Demo** (15 min) - Show completed features
3. **Discussion** (10 min) - Feedback and questions
4. **Next steps** (3 min) - Preview next sprint

### Feedback Incorporation

**When feedback is received:**
1. **Acknowledge** - Thank stakeholder for input
2. **Clarify** - Ensure you understand correctly
3. **Assess** - Evaluate effort and priority
4. **Decide** - Accept, defer, or decline
5. **Communicate** - Explain decision rationale
6. **Track** - Add to backlog if deferred

**Handling conflicting feedback:**
- Escalate to product owner for prioritization
- Present trade-offs clearly
- Document decision and rationale
- Communicate decision to all parties

### Change Request Handling

**Change request process:**
1. **Request submitted** - Stakeholder describes desired change
2. **Impact assessment** - Estimate effort, timeline impact, dependencies
3. **Present options** - Include in current scope (delay delivery) or defer to next sprint
4. **Decision** - Product owner or steering committee decides
5. **Update plan** - Adjust timeline, scope, or backlog
6. **Communicate** - Notify all stakeholders of decision

**Change request template:**
```markdown
## Change Request: [Title]

### Requested By
[Stakeholder name]

### Description
[What needs to change]

### Business Justification
[Why is this needed]

### Impact Assessment
- **Effort**: [X days/story points]
- **Timeline impact**: [X days delay if included now]
- **Dependencies**: [What else is affected]
- **Risks**: [Potential issues]

### Options
1. **Include in current sprint** - Delays delivery by [X days]
2. **Next sprint** - Earliest delivery [date]
3. **Backlog** - Prioritize later

### Decision
[Chosen option and rationale]

### Communicated To
- [ ] Requester
- [ ] Product owner
- [ ] Development team
- [ ] Other stakeholders
```

---

## Dependency Management

**Purpose**: Keep dependencies secure, up-to-date, and well-managed.

### Dependency Strategy

**Before adding a new dependency:**
- [ ] Is it actively maintained? (commits in last 6 months)
- [ ] Does it have good documentation?
- [ ] Is it well-tested? (>80% coverage)
- [ ] Does it have a compatible license?
- [ ] Are there known security vulnerabilities?
- [ ] What's the bundle size impact?
- [ ] Could we implement this ourselves easily?

**Prefer:**
- Well-established packages (>1M downloads/month for npm)
- Packages with strong community
- Packages with semantic versioning
- Minimal transitive dependencies

**Avoid:**
- Unmaintained packages (no activity in 1+ years)
- Packages with known security issues
- Overly complex packages for simple needs
- Packages with restrictive licenses (GPL in commercial software)

### Dependency Updates

**Update strategy:**
- **Security patches** - Apply immediately
- **Minor version updates** - Weekly or bi-weekly
- **Major version updates** - Quarterly, with testing

**Before updating dependencies:**
1. **Review changelog** - Understand what changed
2. **Check for breaking changes** - Review migration guide
3. **Update in separate branch** - Isolate changes
4. **Run full test suite** - Ensure nothing broke
5. **Test critical paths manually** - Verify key functionality
6. **Monitor after deploy** - Watch for issues

**Automated dependency updates:**
- Use Dependabot, Renovate, or similar tools
- Auto-merge minor/patch updates if tests pass
- Require manual review for major updates
- Group related dependencies together

### Security Vulnerability Scanning

**Regular scans:**
- **Daily** - Automated scans in CI/CD
- **Weekly** - Review vulnerability reports
- **Monthly** - Audit all dependencies

**When vulnerability discovered:**
1. **Assess severity** - CVSS score, exploitability
2. **Check if exploitable** - Are we using affected code?
3. **Prioritize fix**:
   - Critical/High: Fix within 24 hours
   - Medium: Fix within 1 week
   - Low: Fix in next sprint
4. **Update dependency** or **find alternative**
5. **Test thoroughly**
6. **Deploy fix**
7. **Document** in security log

**Tools:**
- npm audit / yarn audit
- Snyk
- GitHub Dependabot
- WhiteSource
- OWASP Dependency-Check

### License Compliance

**Track licenses for all dependencies:**
- **Permissive** (OK for commercial): MIT, Apache 2.0, BSD
- **Weak copyleft** (Usually OK): LGPL, MPL
- **Strong copyleft** (Problematic): GPL, AGPL

**License audit process:**
- Document all dependency licenses
- Flag GPL/AGPL for legal review
- Maintain license inventory
- Review licenses before adding dependencies

### Dependency Removal

**When to remove a dependency:**
- No longer needed
- Replaced by native functionality
- Security issues with no fix available
- Maintenance burden too high
- License incompatibility

**Removal process:**
1. **Identify dependencies** of the package
2. **Find alternative** or implement functionality
3. **Refactor code** to remove usage
4. **Remove from package manifest**
5. **Test thoroughly**
6. **Document** decision

---

## Technical Debt Management

**Purpose**: Track, prioritize, and pay down technical debt systematically.

### Technical Debt Definition

**Intentional debt** (Deliberate shortcuts):
- Quick fix to meet deadline
- Prototype code promoted to production
- Temporary workaround for external issue
- Documented with // TODO or // HACK

**Accidental debt** (Unintentional accumulation):
- Outdated dependencies
- Deprecated API usage
- Code duplication
- Missing tests
- Poor documentation

### Debt Categorization

**Type of debt:**
- **Code quality** - Duplication, complexity, code smells
- **Test debt** - Missing tests, low coverage
- **Documentation debt** - Missing or outdated docs
- **Infrastructure debt** - Outdated servers, manual processes
- **Design debt** - Suboptimal architecture

**Severity:**
- **High** - Blocking new features, security risk
- **Medium** - Slowing development, increasing bugs
- **Low** - Minor inconvenience

### Debt Tracking

**Document debt when created:**
```javascript
// TODO: [DEBT-123] Refactor to use async/await instead of callbacks
// This was a quick fix to meet Q3 deadline. Should be refactored
// for better error handling and readability.
// Estimated effort: 2 days
// Impact: Medium - makes error handling fragile
// Created: 2025-11-15 by Chris
function fetchData(callback) {
  // legacy callback-based code
}
```

**Centralized tracking:**
- Create "Technical Debt" label in issue tracker
- Log each debt item with:
  - Description
  - Location in code
  - Reason it was created
  - Impact (High/Medium/Low)
  - Estimated effort to fix
  - Suggested approach

### Debt Paydown Strategy

**Allocate debt budget:**
- **20% rule** - Dedicate 20% of each sprint to debt reduction
- **Debt sprints** - Quarterly sprint focused on debt only
- **Opportunistic paydown** - Fix debt when touching related code

**Prioritization framework:**
```
Priority = (Impact × Frequency) / Effort

Where:
- Impact: 1-5 (how much it hurts)
- Frequency: 1-5 (how often encountered)
- Effort: 1-5 (days to fix)
```

**Example:**
- Slow database query hit 1000x/day: (4 × 5) / 2 = 10 (High priority)
- Outdated comment: (1 × 1) / 1 = 1 (Low priority)

### Debt Prevention

**Prevent new debt:**
- **Code review** - Catch debt before merge
- **Definition of Done** - Includes tests and docs
- **Refactoring time** - Budget time for cleanup
- **Pair programming** - Share knowledge, improve design
- **Documentation standards** - Require docs for complex code

### Debt Visibility

**Make debt visible:**
- **Dashboard** - Track total debt items and trends
- **Retrospectives** - Discuss debt impact and wins
- **Architecture reviews** - Identify systemic debt
- **Debt reports** - Monthly summary of debt added/removed

**Debt metrics to track:**
- Total debt items
- Debt added this month
- Debt resolved this month
- Debt trend (increasing/decreasing)
- Time spent on debt

---

## Knowledge Transfer

**Purpose**: Ensure knowledge is shared across the team and documented for future reference.

### Documentation Requirements

**For every feature:**
- **README** - How to run, test, deploy
- **Architecture docs** - Design decisions, data flow
- **API documentation** - Endpoints, request/response formats
- **Runbooks** - How to operate, troubleshoot
- **Change log** - What changed and why

### Code Documentation

**When to add code comments:**
- **Complex algorithms** - Explain the approach
- **Non-obvious decisions** - Why this way, not another
- **External constraints** - API limitations, browser bugs
- **Temporary code** - TODO with context
- **Public APIs** - Function purpose, parameters, return values

**What NOT to comment:**
- Obvious code (`i++; // increment i`)
- Redundant explanations (comments that repeat code)
- Commented-out code (delete it, it's in git)

**Good comment examples:**
```javascript
// Use binary search because array is sorted and can have 1M+ items
// Linear search was too slow (>2s for large datasets)

// HACK: Force reflow to fix Safari rendering bug
// See: https://bugs.webkit.org/show_bug.cgi?id=123456

// TODO: Replace with Web Workers for better performance
// Current synchronous implementation blocks UI for large files
```

### Knowledge Sharing Sessions

**Regular sessions:**
- **Lunch & Learn** - Weekly, informal knowledge sharing
- **Tech talks** - Monthly deep dive on topic
- **Code walkthroughs** - Review complex code with team
- **Architecture review** - Quarterly system overview

**Session types:**
- **Show & Tell** - Demo new feature or tool
- **Deep Dive** - Detailed technical explanation
- **Lessons Learned** - Share project insights
- **Problem Solving** - Collaborative debugging
- **Best Practices** - Share patterns and techniques

### Onboarding Documentation

**For new team members:**
- **Getting started guide** - Environment setup
- **Architecture overview** - System components
- **Development workflow** - How we work
- **Common tasks** - How to add feature, fix bug, deploy
- **Team contacts** - Who to ask for help

**30-60-90 day plan:**
- **Day 1-30**: Environment setup, first small bug fix
- **Day 31-60**: First medium feature, participate in design review
- **Day 61-90**: Lead feature implementation, help onboard next person

### Runbook Creation

**Operational runbooks should cover:**
- **How to deploy** - Step-by-step deployment process
- **How to rollback** - Emergency rollback procedure
- **How to scale** - Adding capacity
- **Common issues** - Known problems and solutions
- **Monitoring** - What to watch, what alerts mean
- **On-call procedures** - Escalation, who to contact

**Runbook template:**
```markdown
## Runbook: [Process Name]

### Overview
[What this process does and when to use it]

### Prerequisites
- [Required access/permissions]
- [Required tools/credentials]

### Procedure
1. [Step 1 with specific commands]
2. [Step 2 with expected output]
3. [Step 3 with verification]

### Verification
- [ ] [How to verify success]

### Rollback
[How to undo if something goes wrong]

### Troubleshooting
**Problem**: [Common issue]
**Solution**: [How to fix]

### Contacts
- Owner: [name]
- Escalation: [name]
```

### Knowledge Base Maintenance

**Centralized knowledge base should include:**
- Architecture decision records (ADRs)
- Design documents
- API documentation
- Runbooks
- Troubleshooting guides
- Best practices
- Lessons learned

**Keep knowledge base up-to-date:**
- Review quarterly
- Update when systems change
- Archive outdated content
- Link from code to docs

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
- `docs:` Documentation changes
- `test:` Test creation/updates
- `refactor:` Code refactoring without functionality changes
- `chore:` Build/tooling changes, dependency updates
- `perf:` Performance improvements
- `style:` Code style changes (formatting, whitespace)

### Required in Body

- Task identifier (e.g., "Task 2.3: Implementation Name")
- Agent used (e.g., "Frontend-Engineer" or "Manual Development")
- Key deliverables (bullet list of what was created/changed)
- Validation status (e.g., "✅ All validations passed")
- Impact summary (lines of code, files changed, breaking changes)

### Footer

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

*Optional: Can be adapted based on development environment*

---

## Task Completion Checklist

Before marking ANY task as complete, verify:

### Code Quality

- [ ] Code compiles/builds without errors
- [ ] Type safety maintained (no regression in type system)
- [ ] No security vulnerabilities (credentials, injection, XSS)
- [ ] Code follows project patterns and conventions
- [ ] Error handling implemented appropriately
- [ ] Loading/pending states handled (if applicable)
- [ ] Edge cases considered and handled

### Testing

- [ ] Automated validation passes
- [ ] Manual testing complete against acceptance criteria
- [ ] QA agent deployed (if required by complexity)
- [ ] Edge cases tested
- [ ] Error/failure cases tested
- [ ] Performance acceptable against targets

### Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Code comments added for complex logic
- [ ] Examples created or updated
- [ ] Validation checklist updated (if new validations added)

### Integration

- [ ] Integrates correctly with existing code
- [ ] No breaking changes (or documented/versioned appropriately)
- [ ] Dependencies tracked and documented
- [ ] Import paths correct

### Version Control

- [ ] All files staged
- [ ] Commit message follows standards
- [ ] Project tracking documentation updated
- [ ] Task list updated
- [ ] No debug code or unnecessary logging

---

## Failure Recovery

### If Validation Fails

1. **Identify root cause** - Review validation output carefully
2. **Fix issues** - Address errors and warnings
3. **Re-run validation** - Verify fix resolved the problem
4. **Document issue** - Add to decision log if architectural
5. **Commit fix** - Separate commit for validation fixes

### If QA Agent Finds Issues

1. **Triage issues** - Categorize as critical vs. non-critical
2. **Fix critical issues** - Must fix before proceeding
3. **Log non-critical** - Create tracking issues for later
4. **Re-validate** - Run QA agent again after fixes
5. **Update tests** - Add regression tests for issues found

### If Task is Blocked

1. **Document blocker** in project tracking system
2. **Update task list** with blocked status
3. **Identify workaround** or alternate approach
4. **Escalate** if blocker affects critical path
5. **Move to parallel task** if possible

---

## Validation Metrics

### Track These Metrics

**Per Task:**
- Time to complete (actual vs. estimated)
- Artifacts created (files, lines of code, tests)
- Type safety score (% strongly typed)
- Validation time duration
- Number of validation failures before passing

**Per Phase/Milestone:**
- Total time to complete
- Total artifacts created
- Test coverage percentage
- Build size (if applicable)
- Performance metrics (load time, response time, etc.)
- Number of commits

**Project-Level:**
- Velocity (story points or tasks per sprint)
- Quality gate pass rate
- Bug/defect density
- Technical debt accumulation
- Documentation coverage

---

## Continuous Improvement

### After Each Task

1. Review what worked well
2. Identify bottlenecks or inefficiencies
3. Update SOP if patterns emerge
4. Share learnings in decision log or team retrospective

### After Each Phase/Milestone

1. Generate phase completion report
2. Review metrics vs. targets
3. Identify process improvements
4. Update project tracking documentation
5. Conduct retrospective with team

### After Project Completion

1. Full project retrospective
2. Update SOP based on lessons learned
3. Document best practices discovered
4. Create templates for future projects

---

## Quick Reference Card

### Standard Task Flow

```
1. Review task → 2. Plan → 3. Implement → 4. VALIDATE → 5. Commit
```

### Validation Flow

```
Quick validate → Domain validate → Manual checklist → QA agent (if needed) → Full validate
```

### Quality Gate Flow

```
Task gate → Phase gate → Pre-deployment gate
```

### When in Doubt

1. Check project-specific validation documentation
2. Run quick validation checks
3. Review acceptance criteria carefully
4. Deploy qa-automation-specialist for verification
5. Document in decision log and seek guidance

---

## SOP Compliance

**This SOP is mandatory for all development work.**

Non-compliance (skipping validation, incomplete commits, missing documentation) will result in:
1. Failed quality gates
2. Required rework
3. Project delays
4. Technical debt accumulation

### Exception Process

If validation must be skipped (rare circumstances):
1. Document reason in project tracking system
2. Get approval from technical lead or project manager
3. Create tracking issue to address validation later
4. Add to technical debt log
5. Set deadline for resolution

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-15 | Initial SOP created with validation framework | System |
| 2.0 | 2025-11-15 | Generalized for all projects, removed project-specific references | System |
| 2.1 | 2025-11-15 | Added 10 comprehensive sections (Requirements, Architecture, Security, Deployment, Performance, Incidents, Stakeholder Comm, Dependencies, Technical Debt, Knowledge Transfer) | System |
| 2.2 | 2025-11-17 | **Orchestration Update:** Added explicit agent assignments, handoff points, invocation templates, phase workflows, and agent selection logic throughout document | System |

---

**Last Updated**: 2025-11-17
**Next Review**: After first 3 Orchestrator-driven projects or 6 months

## Orchestration Notes

**For Orchestrator Agents:**
- Each phase includes explicit agent assignments
- Agent invocation templates provided for consistency
- Phase gates define completion criteria
- Handoff points specify artifacts passed between agents
- Selection logic helps choose appropriate agents
- See [AGENT_RESPONSIBILITY_MATRIX.md](./AGENT_RESPONSIBILITY_MATRIX.md) for detailed agent capabilities

**Key Patterns:**
- Sequential: Product-Manager → system-architect → Backend-Engineer → test-engineer
- Parallel: Frontend-Engineer + Backend-Engineer (full-stack features)
- Conditional: Deploy Security-Reviewer only for security-sensitive features
- Incident: tech-lead-reviewer (Commander) + deployment-specialist (Technical Lead)
