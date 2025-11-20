# Agent Responsibility Matrix

**Version**: 1.0
**Last Updated**: 2025-11-17
**Purpose**: Define specialized agent responsibilities and map them to SOP phases

---

## Table of Contents

1. [Agent Definitions](#agent-definitions)
2. [Phase-to-Agent Mapping](#phase-to-agent-mapping)
3. [Agent Selection Guide](#agent-selection-guide)
4. [Agent Collaboration Patterns](#agent-collaboration-patterns)
5. [Escalation Paths](#escalation-paths)

---

## Agent Definitions

### Requirements & Planning Agents

#### Product-Manager
**When to use:** At the beginning of projects to create project plans, define requirements, and manage stakeholder expectations.

**Responsibilities:**
- Requirements refinement and clarification
- Stakeholder identification and management
- Acceptance criteria definition (Given/When/Then)
- User story creation
- Sprint planning and backlog management
- Feature prioritization
- Change request evaluation

**Tools:** All tools available

**Example usage:**
```
Use Product-Manager when:
- Starting a new project or feature
- Requirements are unclear or need refinement
- Multiple stakeholders need alignment
- Creating sprint plans or roadmaps
```

---

### Architecture & Design Agents

#### system-architect
**When to use:** Design overall system architecture before implementation, evaluate architectural patterns, break down complex systems, or define component boundaries.

**Responsibilities:**
- System architecture design
- Technical Design Document (TDD) creation
- Architectural Decision Record (ADR) authoring
- Component boundary definition
- API design and contracts
- Database schema design (high-level)
- Design pattern selection
- Architecture review and validation
- Cross-cutting concern design (auth, logging, caching)

**Tools:** All tools available

**Example usage:**
```
Use system-architect when:
- Building new services or modules
- Significant refactoring required
- API design for public interfaces
- Integration with external systems
- Performance-critical features need design
```

---

### Implementation Agents

#### Frontend-Engineer
**When to use:** Frontend development work is required.

**Responsibilities:**
- UI component development (React, Vue, Angular, etc.)
- State management implementation
- Routing and navigation setup
- Responsive design implementation
- Accessibility (a11y) compliance
- Performance optimization (bundle size, lazy loading)
- Browser compatibility testing
- Frontend build configuration
- CSS/styling (Tailwind, CSS-in-JS, etc.)

**Tools:** All tools available

**Example usage:**
```
Use Frontend-Engineer when:
- Building UI components
- Implementing user interfaces
- Setting up state management
- Configuring routing
- Frontend performance optimization
```

#### Backend-Engineer
**When to use:** Backend work is required.

**Responsibilities:**
- API endpoint development (REST, GraphQL, gRPC)
- Service layer business logic
- Database integration and queries
- Authentication/authorization implementation
- **Database migrations and schema design** (NEW)
- Background job processing
- Third-party API integrations
- Caching strategy implementation
- Server-side performance optimization

**Enhanced capabilities:**
- Creating backward-compatible database migrations
- Writing migration rollback scripts
- Optimizing database queries and indexes
- Data validation and integrity enforcement

**Tools:** All tools available

**Example usage:**
```
Use Backend-Engineer when:
- Developing API endpoints
- Implementing business logic
- Database schema changes needed
- Creating migration scripts
- Integrating with databases or external services
```

#### typescript-specialist
**When to use:** Write, improve, or maintain TypeScript code with proper typing, convert JavaScript to TypeScript, strengthen type definitions, or ensure type safety.

**Responsibilities:**
- TypeScript code conversion from JavaScript
- Interface and type definition creation
- Generic type implementation
- Type guard creation
- Discriminated union design
- Type utility creation
- Type system strengthening
- TypeScript configuration (tsconfig.json)

**Tools:** All tools available

**Example usage:**
```
Use typescript-specialist when:
- Converting JavaScript to TypeScript
- Creating complex type definitions
- Strengthening existing type safety
- Implementing generic types
- Type-related refactoring
```

#### Data-AI-RAG
**When to use:** Data and AI expertise needed.

**Responsibilities:**
- Knowledge base design and implementation
- RAG (Retrieval-Augmented Generation) pipeline setup
- Vector database integration
- Embedding generation and management
- AI/ML model integration
- Data preprocessing pipelines
- Prompt engineering
- AI response optimization

**Tools:** All tools available

**Example usage:**
```
Use Data-AI-RAG when:
- Building knowledge base systems
- Implementing RAG pipelines
- AI model integration
- Vector search implementation
```

#### lambda-orchestrator
**When to use:** Design, implement, or optimize AWS Lambda functions with production-grade requirements including infrastructure, security, testing, and observability.

**Responsibilities:**
- Lambda function architecture and design
- IAM policy creation and security
- Lambda deployment configuration
- Performance optimization (cold starts, memory tuning)
- Event source integration (S3, DynamoDB, SQS, etc.)
- Comprehensive error handling
- CloudWatch logging and monitoring
- Lambda testing strategies
- Cost optimization

**Tools:** All tools available

**Example usage:**
```
Use lambda-orchestrator when:
- Building serverless data pipelines
- Creating event-driven Lambda functions
- Optimizing Lambda performance
- Complex Lambda architectures
```

---

### Testing & Quality Agents

#### test-engineer
**When to use:** Implementing new features, modifying existing logic, or when comprehensive test coverage is needed. Should be called proactively before and after code changes.

**Responsibilities:**
- Unit test creation and maintenance
- Test fixture and mock creation
- Edge case testing
- Test suite maintenance
- Test coverage analysis
- TDD (Test-Driven Development) support
- Integration test support

**Tools:** All tools available

**Example usage:**
```
Use test-engineer when:
- New methods or functions added
- Logic changes made
- Edge cases need coverage
- Refactoring requires test updates
```

#### qa-automation-specialist
**When to use:** Design, implement, or review automated testing frameworks and validation suites.

**Responsibilities:**
- End-to-end test framework design
- Cross-environment test compatibility
- Test coverage analysis (95%+ target)
- Performance regression testing
- Integration test suite creation
- Test automation strategy
- CI/CD test integration
- Quality gate establishment
- Smoke test creation

**Tools:** All tools available

**Example usage:**
```
Use qa-automation-specialist when:
- Setting up test automation frameworks
- Cross-environment validation needed
- Test coverage improvement required
- Performance regression detection
- E2E test creation
```

#### performance-testing-specialist (NEW)
**When to use:** Establish performance baselines, conduct load testing, identify performance bottlenecks, or validate SLA compliance.

**Responsibilities:**
- Performance baseline establishment
- Load testing (JMeter, K6, Artillery, Gatling)
- Stress testing and capacity planning
- Performance regression detection
- SLA/SLO validation
- Performance profiling (CPU, memory, I/O)
- Database query optimization testing
- API response time testing
- Throughput and latency measurement
- Performance budget enforcement
- Bottleneck identification
- Performance monitoring setup
- Load test scenario design
- Performance reporting and dashboards

**Deliverables:**
- Load test scripts and scenarios
- Performance baseline reports
- Regression test results
- Capacity planning recommendations
- Performance optimization suggestions
- SLA compliance reports

**Tools:** All tools available

**Example usage:**
```
Use performance-testing-specialist when:
- Establishing performance baselines for new features
- Running load tests before production deployment
- Identifying performance bottlenecks
- Validating system can handle expected load
- Detecting performance regressions
- Capacity planning for scale-up
```

---

### Code Quality & Security Agents

#### code-reviewer
**When to use:** Review code for quality, style, and adherence to project standards.

**Responsibilities:**
- Code quality review
- Pattern compliance checking
- Best practice validation
- Code smell identification
- Refactoring suggestions
- Architecture review (lightweight)
- Security review (basic)
- Performance review (basic)

**Tools:** All tools available

**Example usage:**
```
Use code-reviewer when:
- Code review before committing
- Checking compliance with standards
- Identifying quality issues
- Pre-merge review
```

#### Security-Reviewer
**When to use:** Security reviews required.

**Responsibilities:**
- Security vulnerability identification
- OWASP Top 10 validation
- Authentication/authorization review
- Input validation review
- Dependency vulnerability scanning
- Security best practice enforcement
- Threat modeling
- Security testing coordination
- Penetration testing support

**Tools:** All tools available

**Example usage:**
```
Use Security-Reviewer when:
- Security-sensitive features developed
- Authentication/authorization changes
- Data handling changes (PII, payment)
- API exposure
- Third-party integrations
```

#### xss-protection-specialist
**When to use:** Implementing advanced XSS protection, auditing user input handling, enhancing sanitization, implementing CSP policies, or when security vulnerabilities discovered.

**Responsibilities:**
- XSS vulnerability assessment
- Input sanitization implementation
- Content Security Policy (CSP) design
- DOMPurify configuration
- Output encoding strategies
- User-generated content security
- Multi-layered XSS defense

**Tools:** All tools available

**Example usage:**
```
Use xss-protection-specialist when:
- User content rendering needs security review
- XSS vulnerabilities suspected
- Advanced sanitization required beyond basic DOMPurify
```

#### memory-optimizer
**When to use:** Identify and fix memory leaks, implement resource cleanup, or establish memory monitoring.

**Responsibilities:**
- Memory leak detection and fixing
- Resource cleanup implementation
- Memory profiling
- Memory monitoring setup
- Garbage collection optimization
- Memory usage analysis
- Event listener cleanup
- Subscription management

**Tools:** All tools available

**Example usage:**
```
Use memory-optimizer when:
- Memory leaks suspected
- Long-running applications
- Memory usage increasing over time
- Resource cleanup needed
```

---

### Deployment & Operations Agents

#### DevOps
**When to use:** Setup development infrastructure.

**Responsibilities:**
- Infrastructure as Code (Terraform, CloudFormation, CDK)
- CI/CD pipeline setup and maintenance
- Container orchestration (Kubernetes, ECS)
- Infrastructure monitoring setup
- **Monitoring strategy and dashboard creation** (ENHANCED)
- **SLO/SLI definition and tracking** (ENHANCED)
- **Alert configuration and tuning** (ENHANCED)
- Secrets management
- Infrastructure security
- Cost optimization
- Disaster recovery planning

**Enhanced capabilities:**
- Creating observability dashboards (Grafana, CloudWatch, Datadog)
- Defining Service Level Objectives (SLOs) and Indicators (SLIs)
- Implementing alerting strategies with proper escalation
- Log aggregation and analysis setup

**Tools:** All tools available

**Example usage:**
```
Use DevOps when:
- Setting up infrastructure
- Configuring CI/CD pipelines
- Container deployment needed
- Infrastructure monitoring setup
- Creating dashboards and alerts
- Defining SLOs for services
```

#### deployment-specialist
**When to use:** Expertise in deployment processes, CI/CD pipelines, or production release strategies needed. Includes zero-downtime deployments, environment promotion, and rollback procedures.

**Responsibilities:**
- Blue-green deployment implementation
- Canary deployment strategies
- Rolling deployment configuration
- Feature flag implementation
- Deployment automation
- Rollback procedure design
- Environment promotion workflows
- Database migration deployment
- **Incident response coordination** (ENHANCED)
- **Incident rollback execution** (ENHANCED)
- Zero-downtime deployment design
- Deployment verification and smoke testing

**Enhanced capabilities:**
- Leading incident response for deployment failures
- Coordinating emergency rollbacks
- Executing hotfix deployments
- Post-deployment validation

**Tools:** All tools available

**Example usage:**
```
Use deployment-specialist when:
- Designing deployment strategies
- Implementing blue-green or canary deployments
- Setting up feature flag systems
- Rollback procedures needed
- Production deployment incidents
- Emergency hotfix deployments
```

#### build-automation-specialist
**When to use:** Optimize build processes, implement build automation, analyze bundle sizes, configure caching strategies, or improve build performance.

**Responsibilities:**
- Build process optimization
- Build caching implementation
- Bundle size analysis and reduction
- Webpack/Vite/ESBuild configuration
- CI/CD build pipeline setup
- Build time optimization
- Build artifact management
- Build monitoring and metrics

**Tools:** All tools available

**Example usage:**
```
Use build-automation-specialist when:
- Build times too slow
- Bundle sizes too large
- Build caching needed
- Build process optimization required
```

---

### Documentation & Developer Experience Agents

#### technical-writer
**When to use:** Create, review, or improve technical documentation including API docs, guides, tutorials, runbooks, or architecture documents.

**Responsibilities:**
- API documentation creation
- User guide authoring
- Architecture documentation
- Runbook creation
- Tutorial development
- Documentation review and editing
- Knowledge base organization
- Documentation standards enforcement

**Tools:** All tools available

**Example usage:**
```
Use technical-writer when:
- API documentation needed
- Creating user guides or tutorials
- Runbook creation for operations
- Architecture documentation
- Documentation review required
```

#### Docs-DX
**When to use:** Writing developer documentation.

**Responsibilities:**
- Developer-focused documentation
- Getting started guides
- Code examples and snippets
- SDK documentation
- CLI documentation
- Developer portal content

**Tools:** All tools available

**Example usage:**
```
Use Docs-DX when:
- Developer guides needed
- SDK documentation required
- CLI usage documentation
```

#### dx-engineer
**When to use:** Improve developer experience through workflow optimization, create developer tools, enhance error reporting, or create developer documentation.

**Responsibilities:**
- Developer workflow optimization
- Developer tooling creation (CLI, dashboards)
- Error message improvement
- Debugging tool development
- Developer dashboard creation
- Development environment optimization
- Developer onboarding improvement

**Tools:** All tools available

**Example usage:**
```
Use dx-engineer when:
- Error messages need improvement
- Developer tooling needed
- Development workflow optimization
- Developer dashboards required
```

---

### Orchestration & Leadership Agents

#### Orchestrator
**When to use:** Complex multi-step tasks requiring team coordination.

**Responsibilities:**
- Task delegation to specialized agents
- Multi-agent coordination
- Complex workflow orchestration
- Progress tracking across agents
- Deliverable aggregation

**Tools:** All tools available

**Example usage:**
```
Use Orchestrator when:
- Complex tasks spanning multiple domains
- Coordination of multiple specialized agents
- Large projects with many moving parts
```

#### tech-lead-reviewer
**When to use:** Technical leadership oversight, architectural decision validation, or scope management needed.

**Responsibilities:**
- Architectural decision validation
- Scope creep detection
- Feasibility assessment
- Trade-off analysis
- Quality gate enforcement
- Technical debt assessment
- **Incident coordination** (ENHANCED)
- **Postmortem facilitation** (ENHANCED)
- Risk identification
- Team unblocking

**Enhanced capabilities:**
- Acting as Incident Commander for production incidents
- Facilitating blameless postmortems
- Coordinating cross-functional incident response

**Tools:** All tools available

**Example usage:**
```
Use tech-lead-reviewer when:
- Architectural proposals need validation
- Scope concerns exist
- Technical decisions need leadership review
- Production incidents require coordination
- Postmortem facilitation needed
```

#### Release-Manager
**When to use:** Commits and deployments.

**Responsibilities:**
- Git commit creation
- Pull request creation
- Deployment execution
- Release coordination
- Version management
- Release notes creation

**Tools:** All tools available

**Example usage:**
```
Use Release-Manager when:
- Creating commits and PRs
- Deploying to production
- Managing releases
```

---

### Specialized Utility Agents

#### streaming-architect
**When to use:** Design, implement, or optimize EventSource streaming architecture for production readiness. Includes auditing streaming implementations, debugging connections, implementing reconnection logic, or optimizing data flow.

**Responsibilities:**
- EventSource streaming architecture design
- Connection reliability optimization
- Reconnection logic implementation
- Streaming performance optimization
- Production readiness validation
- Streaming debugging

**Tools:** All tools available

**Example usage:**
```
Use streaming-architect when:
- EventSource streaming needed
- Connection issues with streaming
- Streaming performance optimization
- Production streaming validation
```

---

## Phase-to-Agent Mapping

### Phase 0: Requirements and Design

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Requirements refinement | Product-Manager | - |
| Stakeholder identification | Product-Manager | - |
| Acceptance criteria definition | Product-Manager | - |
| Architecture review | system-architect | tech-lead-reviewer |
| TDD creation | system-architect | technical-writer |
| ADR creation | system-architect | tech-lead-reviewer |
| Security assessment | Security-Reviewer | - |
| Performance planning | performance-testing-specialist | system-architect |
| API design | system-architect | Backend-Engineer |
| Database schema design | Backend-Engineer | system-architect |

### Phase 1: Planning

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Sprint planning | Product-Manager | tech-lead-reviewer |
| Task breakdown | Product-Manager | Orchestrator (complex projects) |
| Resource allocation | Product-Manager | tech-lead-reviewer |
| Risk identification | tech-lead-reviewer | Product-Manager |
| Design validation | system-architect | tech-lead-reviewer |

### Phase 2: Implementation

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| UI components | Frontend-Engineer | typescript-specialist |
| API endpoints | Backend-Engineer | typescript-specialist |
| Database migrations | Backend-Engineer | system-architect |
| Business logic | Backend-Engineer | - |
| State management | Frontend-Engineer | - |
| AI/RAG integration | Data-AI-RAG | Backend-Engineer |
| Lambda functions | lambda-orchestrator | Backend-Engineer |
| Type definitions | typescript-specialist | - |
| XSS protection | xss-protection-specialist | Frontend-Engineer |

### Phase 3: Testing & Quality

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Unit tests | test-engineer | - |
| Integration tests | test-engineer | qa-automation-specialist |
| E2E tests | qa-automation-specialist | - |
| Performance tests | performance-testing-specialist | qa-automation-specialist |
| Load testing | performance-testing-specialist | - |
| Security testing | Security-Reviewer | - |
| Code review | code-reviewer | tech-lead-reviewer |
| Test coverage analysis | qa-automation-specialist | test-engineer |
| Memory leak detection | memory-optimizer | - |

### Phase 4: Deployment

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Deployment strategy | deployment-specialist | DevOps |
| Infrastructure setup | DevOps | deployment-specialist |
| CI/CD pipeline | DevOps | build-automation-specialist |
| Build optimization | build-automation-specialist | DevOps |
| Monitoring setup | DevOps | performance-testing-specialist |
| Dashboard creation | DevOps | dx-engineer |
| SLO definition | DevOps | performance-testing-specialist |
| Rollback testing | deployment-specialist | - |
| Git commits | Release-Manager | - |
| PR creation | Release-Manager | - |

### Phase 5: Operations & Maintenance

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| Incident response | tech-lead-reviewer (Commander) | deployment-specialist (Technical) |
| Hotfix deployment | deployment-specialist | Release-Manager |
| Postmortem facilitation | tech-lead-reviewer | technical-writer |
| Performance monitoring | DevOps | performance-testing-specialist |
| Memory optimization | memory-optimizer | - |
| Dependency updates | Backend-Engineer | Security-Reviewer |
| Security patching | Security-Reviewer | deployment-specialist |
| Documentation updates | technical-writer | Docs-DX |
| Developer tooling | dx-engineer | - |

### Cross-Cutting Concerns

| Concern | Primary Agent | Supporting Agents |
|---------|---------------|-------------------|
| Technical debt tracking | tech-lead-reviewer | Product-Manager |
| Knowledge transfer | technical-writer | Docs-DX |
| Stakeholder communication | Product-Manager | tech-lead-reviewer |
| Dependency management | Backend-Engineer | Security-Reviewer |
| License compliance | Security-Reviewer | Backend-Engineer |

---

## Agent Selection Guide

### Decision Tree

```
1. Is this about requirements or planning?
   └─ YES → Product-Manager
   └─ NO → Continue

2. Is this architectural design?
   └─ YES → system-architect
   └─ NO → Continue

3. Is this implementation?
   ├─ Frontend? → Frontend-Engineer
   ├─ Backend/API? → Backend-Engineer
   ├─ Types/TypeScript? → typescript-specialist
   ├─ AI/RAG? → Data-AI-RAG
   ├─ Lambda? → lambda-orchestrator
   └─ NO → Continue

4. Is this testing or quality?
   ├─ Unit tests? → test-engineer
   ├─ E2E/integration tests? → qa-automation-specialist
   ├─ Performance tests? → performance-testing-specialist
   ├─ Security review? → Security-Reviewer
   ├─ Code review? → code-reviewer
   └─ NO → Continue

5. Is this deployment or operations?
   ├─ Infrastructure? → DevOps
   ├─ Deployment strategy? → deployment-specialist
   ├─ Build optimization? → build-automation-specialist
   ├─ Incident response? → tech-lead-reviewer + deployment-specialist
   └─ NO → Continue

6. Is this documentation?
   ├─ API docs/runbooks? → technical-writer
   ├─ Developer docs? → Docs-DX
   ├─ Developer tooling? → dx-engineer
   └─ NO → Continue

7. Is this complex coordination?
   └─ YES → Orchestrator

8. Is this leadership/oversight?
   └─ YES → tech-lead-reviewer
```

### When to Use Multiple Agents

**Parallel work (launch simultaneously):**
- Frontend-Engineer + Backend-Engineer (full-stack feature)
- test-engineer + Security-Reviewer (testing + security review)
- technical-writer + Docs-DX (API docs + developer guides)

**Sequential work (one after another):**
1. system-architect → Backend-Engineer → test-engineer → deployment-specialist
2. Product-Manager → system-architect → Frontend-Engineer → qa-automation-specialist
3. Backend-Engineer → performance-testing-specialist → deployment-specialist

**Collaborative work (work together):**
- system-architect + Backend-Engineer (complex database design)
- DevOps + deployment-specialist (complex deployment strategy)
- tech-lead-reviewer + Security-Reviewer (security-critical architecture)

---

## Agent Collaboration Patterns

### Pattern 1: Full-Stack Feature Development

**Sequence:**
1. Product-Manager: Requirements refinement
2. system-architect: Design review
3. Frontend-Engineer + Backend-Engineer (parallel)
4. test-engineer: Unit tests
5. qa-automation-specialist: E2E tests
6. code-reviewer: Code review
7. Release-Manager: Commit and PR

### Pattern 2: Performance-Critical Feature

**Sequence:**
1. Product-Manager: Requirements with performance targets
2. system-architect: Performance-aware design
3. performance-testing-specialist: Baseline establishment
4. Backend-Engineer: Implementation
5. performance-testing-specialist: Load testing
6. memory-optimizer: Memory profiling (if needed)
7. deployment-specialist: Canary deployment

### Pattern 3: Security-Sensitive Feature

**Sequence:**
1. Product-Manager: Requirements with security considerations
2. Security-Reviewer: Threat modeling
3. system-architect: Security-aware design
4. Backend-Engineer: Implementation
5. xss-protection-specialist: Input sanitization review (if frontend)
6. Security-Reviewer: Security testing
7. deployment-specialist: Secure deployment

### Pattern 4: Production Incident

**Parallel:**
- tech-lead-reviewer: Incident Commander
- deployment-specialist: Technical Lead (investigation + fix)
- Product-Manager: Communications Lead
- DevOps: Infrastructure investigation

**Sequential:**
1. Incident detected
2. tech-lead-reviewer coordinates response
3. deployment-specialist investigates and fixes
4. deployment-specialist deploys hotfix
5. tech-lead-reviewer facilitates postmortem
6. technical-writer documents lessons learned

### Pattern 5: New Microservice

**Sequence:**
1. Product-Manager: Requirements
2. system-architect: Service design + ADR
3. Backend-Engineer: Implementation
4. test-engineer: Unit tests
5. qa-automation-specialist: Integration tests
6. performance-testing-specialist: Load testing
7. Security-Reviewer: Security review
8. DevOps: Infrastructure setup
9. deployment-specialist: Deployment strategy
10. technical-writer: API documentation
11. Release-Manager: Release

---

## Escalation Paths

### When Agent is Blocked

1. **Agent reports blocker** in deliverables
2. **Orchestrator** (if active) escalates to tech-lead-reviewer
3. **tech-lead-reviewer** assesses and unblocks or escalates to Product-Manager
4. **Product-Manager** resolves with stakeholders or adjusts scope

### When Quality Gates Fail

1. **qa-automation-specialist** reports failures
2. **code-reviewer** investigates quality issues
3. **tech-lead-reviewer** decides: fix now or defer
4. **Product-Manager** approves if deferral impacts timeline

### When Architecture Concerns Arise

1. **Backend-Engineer** or **Frontend-Engineer** raises concern
2. **system-architect** reviews and proposes alternatives
3. **tech-lead-reviewer** validates technical feasibility
4. **Product-Manager** approves if scope/timeline impacted

### When Performance Issues Detected

1. **performance-testing-specialist** identifies bottleneck
2. **Backend-Engineer** or **Frontend-Engineer** investigates code
3. **system-architect** evaluates architectural changes needed
4. **tech-lead-reviewer** prioritizes fix vs. defer
5. **Product-Manager** adjusts timeline if needed

### When Security Vulnerabilities Found

1. **Security-Reviewer** identifies vulnerability
2. **tech-lead-reviewer** assesses severity (CVSS)
3. **deployment-specialist** coordinates hotfix (if critical)
4. **Backend-Engineer** or **Frontend-Engineer** implements fix
5. **Security-Reviewer** validates fix
6. **deployment-specialist** deploys via expedited process

---

## Best Practices

### Agent Deployment

1. **Be specific:** Provide clear task descriptions and acceptance criteria
2. **Set context:** Give agents relevant background and constraints
3. **Define deliverables:** Explicitly state expected outputs
4. **Provide examples:** Show desired formats or patterns
5. **Monitor progress:** Check agent status and outputs
6. **Validate outputs:** Always verify agent deliverables meet requirements

### Agent Selection

1. **Match expertise:** Choose agent whose specialty aligns with task
2. **Consider scope:** Use Orchestrator for multi-domain work
3. **Think sequentially:** Plan agent handoffs for dependent work
4. **Leverage parallelism:** Run independent tasks simultaneously
5. **Avoid overloading:** Don't assign tasks outside agent expertise

### Agent Coordination

1. **Define handoff points:** Clear deliverables between agents
2. **Share context:** Ensure downstream agents have needed info
3. **Track dependencies:** Map agent outputs to agent inputs
4. **Document decisions:** Capture ADRs and rationale for future agents
5. **Maintain consistency:** Ensure agents follow same standards

---

## Summary Table

| Phase | Primary Agents | Supporting Agents |
|-------|----------------|-------------------|
| **Requirements & Design** | Product-Manager, system-architect | Security-Reviewer, performance-testing-specialist |
| **Planning** | Product-Manager, system-architect | tech-lead-reviewer, Orchestrator |
| **Implementation** | Frontend-Engineer, Backend-Engineer, typescript-specialist | Data-AI-RAG, lambda-orchestrator, xss-protection-specialist |
| **Testing & Quality** | test-engineer, qa-automation-specialist, performance-testing-specialist | code-reviewer, Security-Reviewer, memory-optimizer |
| **Deployment** | deployment-specialist, DevOps, Release-Manager | build-automation-specialist |
| **Operations** | tech-lead-reviewer, DevOps, deployment-specialist | technical-writer, memory-optimizer, performance-testing-specialist |
| **Documentation** | technical-writer, Docs-DX | dx-engineer |
| **Leadership** | tech-lead-reviewer, Product-Manager | Orchestrator |

---

**Document Status:** Active
**Maintained By:** Engineering Team
**Review Cadence:** Quarterly or after major process changes
