# Web Config Builder - Product Requirements Document

**Version**: 1.2
**Date**: 2025-10-14
**Owner**: Product Management
**Status**: Ready for Review

---

## Problem Statement

Operations teams currently manage conversational forms through manual JSON editing, causing deployment delays, frequent errors, and scaling bottlenecks. With Phase 1 forms implementation complete, we lack the configuration tooling to deploy forms-enabled tenants at scale. This blocks revenue growth and creates operational risk.

**Target Users**: Internal operations team (primary), future customer self-service (secondary)

---

## Jobs-to-be-Done

1. **Deploy forms-enabled tenants** in under 10 minutes without technical expertise
2. **Create complex form structures** using templates and visual tools instead of JSON
3. **Validate configurations** before deployment to prevent widget breakage
4. **Maintain consistency** across multi-tenant deployments with reusable patterns

---

## Non-Functional Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Load time | <2s for config editor | Operational efficiency |
| Availability | 99.9% uptime | Critical business tool |
| Security | S3 IAM permissions + tenant isolation | Single-user MVP (auth can be added later) |
| Browser support | Chrome, Firefox, Safari (latest 2 versions) | Operations team environment |
| Mobile support | Not required (desktop tool) | Workflow context |

---

## Out of Scope

- Customer-facing self-service (Phase 2 consideration)
- Real-time collaboration (multiple users editing simultaneously)
- Integration with Bubble.io admin UI (remains separate)
- Email notification configuration (handled in Bubble)
- Integration routing configuration (handled in Bubble)
- Notification/integration testing (handled in Bubble test console)
- Migration tools for existing manual configs
- Analytics/reporting on form performance

---

## Acceptance Criteria

**MVP (Phase 1) - 2 weeks**

**Note:** For MVP, authentication is simplified (no Bubble JWT required for single-user tool)

1. User opens web console and sees list of all tenants from S3
2. User selects tenant and loads existing base config from S3 (read-only display)
3. User creates programs (program_id, program_name, description)
4. User creates new form with 5+ fields using manual field editor
5. User assigns form to a program (required for completion filtering)
6. User adds trigger phrases to form (for direct form activation)
7. User creates CTAs with three action types:
   - Form trigger CTAs (action: start_form, requires: formId)
   - External link CTAs (action: external_link, requires: url)
   - Info request CTAs (action: show_info, requires: prompt for Bedrock)
8. User creates conversation branches with:
   - Detection keywords (match Bedrock responses)
   - Branch priority/sort order
   - Primary CTA assignment
   - Secondary CTAs assignment (max 2 recommended for 3 total)
9. User configures content showcase (optional):
   - Showcase items (programs, events, campaigns, initiatives)
   - Rich visual content (images, testimonials, stats, highlights)
   - Keyword targeting for contextual delivery
   - Links to existing CTAs for action
10. User configures post-submission settings (confirmation message, next steps, action buttons)
    - Note: Email notifications and integrations are configured separately in Bubble
11. System validates config with relationship checking:
    - Form-to-program assignments exist
    - CTA-to-form references exist
    - Branch-to-CTA references exist
    - Info CTAs have prompts
    - Form CTAs have valid formIds
    - Link CTAs have valid URLs
    - Branch keywords don't look like user queries
    - Branch priority is logical (broad before specific)
12. System shows dependency warnings before deletion (e.g., "Program used by 2 forms, 3 CTAs")
13. User deploys merged config to S3 successfully
14. Forms, CTAs, and branches load and function correctly in production Picasso widget
15. Zero configuration-related errors in first 5 tenant deployments

**Templates (Phase 2) - 1 week**

16. User selects from 5+ pre-built form templates (volunteer, donation, contact, support, newsletter, event)
17. User customizes template fields and messaging
18. 80%+ of forms created use templates (measured after 20 tenant deployments)

**Visual Builder (Phase 3) - 2 weeks**

19. User drags fields from palette onto canvas to build form
20. Live preview iframe shows real-time form rendering
21. User creates CTAs and links them to forms visually
22. Validation dashboard highlights errors with fix suggestions

---

## Validation Rules

The Web Config Builder enforces comprehensive validation to prevent runtime errors and ensure optimal conversation flow. Validation occurs in real-time during editing and before deployment.

### CTA Validation

**Action Type Requirements:**
- **start_form**: Must have valid `formId` that references an existing form
- **external_link**: Must have valid `url` (https:// protocol required)
- **show_info**: Must have `prompt` field (text sent to Bedrock for response)

**CTA Quality Checks:**
- Button text should be clear and actionable (warn if generic like "Click Here")
- Info CTA prompts should be specific questions or requests
- Form CTAs should only reference forms with assigned programs

**Example Validation Messages:**
```
❌ CTA "learn_dd" has action "show_info" but missing prompt field
✅ CTA "apply_lovebox" correctly references form "lb_apply"
⚠️  CTA button text "Click Here" is too generic - suggest more descriptive text
```

### Form Validation

**Required Fields:**
- `form_id`: Unique identifier (lowercase, underscores)
- `program`: Must reference an existing program ID
- `fields`: At least one field required
- `trigger_phrases`: Optional but recommended for direct activation

**Field-Level Validation:**
- Required fields must have validation rules
- Email fields must have email format validation
- Phone fields should have phone format validation
- Select fields must have at least 2 options

**Example Validation Messages:**
```
❌ Form "volunteer_app" missing program assignment
✅ Form "lb_apply" assigned to program "lovebox"
⚠️  Form has no trigger phrases - users can only access via CTA
```

### Conversation Branch Validation

**Detection Keywords:**
- Keywords should match anticipated Bedrock responses, not user queries
- Warn if keywords contain question words: "how", "what", "tell me", "show me"
- Keywords should be distinct across branches (no significant overlap)

**Branch Priority:**
- Broader topics should have higher priority (sorted first)
- Specific programs should have lower priority (sorted last)
- System validates logical ordering based on keyword breadth

**CTA Assignments:**
- Primary CTA is required
- Secondary CTAs are optional (max 2 recommended for 3 total)
- All referenced CTAs must exist in `cta_definitions`

**Example Validation Messages:**
```
⚠️  Branch "lovebox_discussion" keyword "how do I apply" looks like user query - should match Bedrock response
❌ Branch "volunteer_interest" references CTA "vol_apply" which doesn't exist
✅ Branch priority is logical: program_exploration (broad) before lovebox_discussion (specific)
⚠️  Branch has 4 secondary CTAs - only first 2 will be shown (3 CTA max at runtime)
```

### Relationship Validation

**Cross-Reference Checks:**
- Form-to-program: Every form must reference an existing program
- CTA-to-form: Form CTAs must reference existing form IDs
- Branch-to-CTA: Branch primary and secondary CTAs must exist
- Program usage: Track which forms, CTAs, branches use each program

**Circular Reference Detection:**
- Detect if form trigger phrases could trigger infinite loops
- Warn if branch keywords match form confirmation messages

**Example Validation Messages:**
```
❌ Form "dd_apply" references program "dare_to_dream" which doesn't exist
✅ All 3 branches reference valid CTAs
⚠️  Program "lovebox" is used by 2 forms, 3 CTAs, 1 branch
```

### Dependency Warnings

Before deleting any entity, show dependency impact:

**Delete Program Example:**
```
⚠️  WARNING: This program is in use

Program: Love Box (lovebox)

Dependencies:
• 2 Forms: lb_apply, lb_interest
• 3 CTAs: lovebox_apply, lovebox_info, lovebox_schedule
• 1 Branch: lovebox_discussion

Deleting this program will break these configurations.
Recommended: Remove dependencies first, then delete program.

[Cancel] [Delete Anyway]
```

**Delete CTA Example:**
```
⚠️  WARNING: This CTA is referenced by branches

CTA: Apply for Love Box (lovebox_apply)

Used in branches:
• lovebox_discussion (primary CTA)
• program_exploration (secondary CTA)

Deleting this CTA will remove it from these branches.

[Cancel] [Delete and Update Branches]
```

### Runtime Behavior Validation

**Program-Based Filtering:**
- Warn if form doesn't have program assigned (can't be filtered after completion)
- Explain that completed forms are filtered by program match

**Max 3 CTAs:**
- Warn when branch has >3 total CTAs (1 primary + 2 secondary)
- Explain that runtime limits to 3 buttons for clarity

**Content Showcase Alignment (Optional):**
- If content_showcase exists, validate that cta_id references exist
- Warn if showcase item missing image_url (reduces visual impact)
- Validate type is one of: program, event, initiative, campaign

**Example Validation Messages:**
```
⚠️  Branch "volunteer_interest" has 4 total CTAs - only first 3 will display at runtime
ℹ️  Form "lb_apply" assigned to program "lovebox" - will be filtered after completion
✅ Content showcase item "lovebox_card" correctly linked to CTA "lovebox_apply"
⚠️  Showcase item "holiday_drive_card" missing image_url - will have less visual impact
```

### Pre-Deployment Validation

Before allowing deployment to S3, system must pass all critical validations:

**Critical Validations (must pass):**
- All CTA action types have required fields
- All form-to-program references are valid
- All CTA-to-form references are valid
- All branch-to-CTA references are valid
- No circular dependencies detected

**Warning Validations (can deploy with warnings):**
- Branch keyword quality issues
- Branch priority ordering suggestions
- CTA button text quality suggestions
- Missing trigger phrases on forms
- More than 3 CTAs in branch

**Deployment Checklist:**
```
✅ 5 Programs defined
✅ 8 Forms created (all have program assignments)
✅ 12 CTAs defined (all have required fields)
✅ 6 Branches configured (all reference valid CTAs)
⚠️  2 Warnings (non-blocking)
   • Branch "volunteer_interest" has generic keyword "volunteer"
   • Form "contact_form" missing trigger phrases

[Review Warnings] [Deploy to S3]
```

---

## Content Showcase (Optional Feature)

### Overview

The Content Showcase feature allows tenants to present contextually relevant programs, events, campaigns, and initiatives as rich visual cards during conversations. Think of it as **advertising inventory** that can be served based on conversation context—similar to how CTAs work, but with enhanced visual storytelling.

### Mental Model: Ad Inventory

Content showcase items are like **sponsored content** that appears when contextually relevant:
- Could be programs (Love Box, Dare to Dream), events (volunteer fairs), campaigns (holiday drives), or initiatives (community outreach)
- Keyword-based triggering (same pattern as existing CTAs)
- Rich visual content (images, testimonials, stats, highlights)
- Links to existing CTAs for action (creates a pathway: showcase → CTA → form)

### Why This Approach?

**Simplified from original "Card Inventory" design:**
- ❌ Removed: Readiness thresholds (0.0-1.0 scoring) - Lambda doesn't support scoring systems
- ❌ Removed: Strategy system (qualification_first vs exploration_first) - duplicates existing branch priority
- ❌ Removed: Requirements section - duplicates form eligibility gates
- ✅ Kept: Keyword-based triggering (aligns with existing architecture)
- ✅ Kept: Visual content presentation (differentiated from simple CTAs)
- ✅ Added: Clear link to CTAs (creates content hierarchy)

### Data Structure

```javascript
content_showcase: [
  {
    id: "lovebox_card",
    type: "program",  // program | event | initiative | campaign
    enabled: true,

    // Core Content
    name: "Love Box",
    tagline: "Support foster families in your community",
    description: "Pack monthly care boxes with essential items for foster families. Make a direct impact with just 2-3 hours per month.",
    image_url: "https://cdn.example.com/programs/lovebox.jpg",

    // Supporting Details (optional)
    stats: "2-3 hours/month",
    testimonial: "Best volunteer experience I've had! - Sarah M.",
    highlights: [
      "Flexible schedule - pack boxes at home",
      "Monthly commitment",
      "Direct impact on local families"
    ],

    // Keyword Targeting
    keywords: [
      "love box",
      "foster families",
      "foster care",
      "wraparound services",
      "care packages"
    ],

    // Link to Existing CTA
    cta_id: "lovebox_apply"  // References cta_definitions
  },
  {
    id: "holiday_drive_card",
    type: "campaign",
    enabled: true,

    name: "Holiday Gift Drive",
    tagline: "Bring joy to families this season",
    description: "Help us collect and distribute gifts to 200+ families during the holiday season.",
    image_url: "https://cdn.example.com/campaigns/holiday-2025.jpg",

    stats: "Goal: 200 families",
    highlights: [
      "Nov 1 - Dec 15",
      "Drop-off locations across the city",
      "Tax-deductible donations"
    ],

    keywords: [
      "holiday",
      "christmas",
      "gifts",
      "seasonal",
      "donation drive"
    ],

    cta_id: "holiday_donate"
  }
]
```

### How It Works

**1. Lambda Detection (response_enhancer.js)**
```javascript
function detectContentShowcase(bedrockResponse, userQuery, config) {
  const { content_showcase, cta_definitions } = config;

  // Similar to detectConversationBranch, use keyword matching
  for (const item of content_showcase || []) {
    if (!item.enabled) continue;

    const matches = item.keywords.some(keyword =>
      bedrockResponse.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matches) {
      // Get linked CTA
      const linkedCta = cta_definitions[item.cta_id];

      return {
        showcaseCard: item,
        linkedCta: linkedCta
      };
    }
  }

  return null;
}
```

**2. Enhanced Response Format**
```javascript
{
  message: "Bedrock response...",
  showcaseCards: [
    {
      id: "lovebox_card",
      type: "program",
      name: "Love Box",
      tagline: "Support foster families...",
      description: "...",
      image_url: "...",
      stats: "2-3 hours/month",
      testimonial: "...",
      highlights: ["...", "..."],
      cta: {
        label: "Apply for Love Box",
        action: "start_form",
        formId: "lb_apply"
      }
    }
  ],
  ctaButtons: [...], // Regular CTAs
  metadata: {...}
}
```

**3. Frontend Rendering**
- Showcase cards render as rich visual components (larger than CTAs)
- Display image, name, tagline, description, stats, testimonial, highlights
- Include linked CTA button at bottom of card
- Cards appear before regular CTAs (visual hierarchy)

### Use Cases

**Programs:**
- Love Box (foster family support)
- Dare to Dream (mentorship)
- After-school tutoring programs
- Community gardening initiatives

**Events:**
- Volunteer orientation sessions
- Community fundraisers
- Training workshops
- Annual galas

**Campaigns:**
- Holiday gift drives
- Back-to-school supply drives
- Summer reading program
- Matching donation campaigns

**Initiatives:**
- New community center opening
- Partnership announcements
- Recognition programs
- Special projects

### Integration with Existing CTAs

Content showcase creates a **content hierarchy**:

1. **Conversation** (Bedrock response)
2. **Showcase Card** (rich visual storytelling)
3. **CTA** (linked action button)
4. **Form** (data collection)

Example flow:
```
User: "How can I help foster families?"
→ Bedrock: "We have several programs..."
→ Showcase Card: [Love Box visual card with testimonial]
→ CTA: "Apply for Love Box" button
→ Form: Love Box application
```

### Multi-Tenant Considerations

- Each tenant defines their own showcase inventory
- Disabled by default (optional feature)
- Keywords are tenant-specific (no cross-tenant conflicts)
- Images hosted by tenant (or CDN)
- No limits on number of showcase items (but recommend 3-5 per tenant)

### Validation Rules

**Required Fields:**
- `id`: Unique identifier
- `type`: One of program, event, initiative, campaign
- `enabled`: Boolean
- `name`: Display name
- `keywords`: Array with at least 1 keyword
- `cta_id`: Must reference existing CTA in cta_definitions

**Optional Fields:**
- `tagline`, `description`, `image_url`, `stats`, `testimonial`, `highlights`

**Validation Messages:**
```
❌ Showcase item "lovebox_card" references CTA "lovebox_apply" which doesn't exist
✅ Showcase item "holiday_drive_card" correctly linked to CTA "holiday_donate"
⚠️  Showcase item "lovebox_card" missing image_url - card will have less visual impact
```

### Runtime Behavior

**Priority Order:**
1. Forms (direct trigger phrases - highest priority)
2. Showcase Cards (contextual, rich content)
3. Regular CTAs (fallback, simple buttons)

**Max Cards Per Response:**
- Show at most 1 showcase card per response
- If multiple cards match, show first match
- Regular CTAs still appear (max 3 total)

**Performance:**
- Showcase config cached with rest of tenant config (5 min TTL)
- Keyword matching is O(n*m) where n=items, m=keywords (acceptable for <20 items)
- Image loading handled by frontend (lazy load)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Config corruption breaks production widgets** | Critical | Version control + rollback, strict validation before save |
| **S3 permission issues block deployments** | High | Least-privilege IAM policies, automated permission testing |
| **Poor UX leads to low adoption** | High | User testing with ops team, iterative feedback cycles |
| **Invalid branching logic causes poor UX** | Medium | Comprehensive validation rules, runtime behavior testing |
| **Performance degrades with large configs** | Medium | Pagination, lazy loading, frontend optimization |

---

## Success Metrics

| Metric | Baseline | Target | Measurement Period |
|--------|----------|--------|-------------------|
| Time to add forms to tenant | 60+ min (manual) | <10 min | First 90 days |
| Config validation error rate | 15% (estimated) | <1% | Ongoing |
| Template usage rate | 0% (no templates) | >80% | First 90 days |
| Config-related support tickets | 8/month (estimated) | <4/month | First 90 days |
| User satisfaction (ops team) | N/A | 4.5/5 | After 2 weeks of use |
| Tenants deployed with builder | 0 | 25+ | First 90 days |

---

## Technical Constraints

- Must integrate with existing Bubble.io tenant management system
- Must read/write configs from S3 bucket `myrecruiter-picasso`
- Must validate against existing Picasso config schema
- Must support Phase 1 forms implementation (post_submission config)
- Must work with existing `deploy_tenant_stack` Lambda
- Authentication simplified for MVP (single-user, no JWT required)
- Programs are canonical source of truth in config file
- Bubble routing rules reference programs by string matching (manual duplication)
- Web Builder does NOT configure email/integration routing (that's in Bubble)
- Config schema v1.3 required (adds prompt field to CTAs, program field to forms)

---

## Dependencies

**External Systems**:
- AWS S3 (config storage in `myrecruiter-picasso` bucket)
- AWS Lambda + API Gateway (backend for config read/write)
- Existing Picasso widget (config consumer)
- Bubble.io tenant management system (for routing only)

**Existing Bubble Infrastructure**:
- form_submission webhook workflow
- send_to_integration workflow
- Form_Notification_Rule (for email routing)
- Integration_Config and Integration_Rule (for integration routing)
- Manual routing rules creation in Bubble (references programs by name)

**Internal Prerequisites**:
- Forms Iteration 2 implementation complete (or parallel deployment)
- Config schema v1.3 documented (with prompt field for CTAs, program field for forms)
- Development AWS credentials and S3 access provisioned
- Understanding of response_enhancer.js runtime behavior

---

## Go-to-Market Strategy

**Launch Approach**: Internal operations tool (no customer-facing launch)

**Rollout Plan**:
1. **Week 1-2**: Build MVP and test with 2 internal pilot tenants
2. **Week 3**: Add templates, train operations team (2-hour workshop)
3. **Week 4-5**: Build visual features, onboard 10 tenants
4. **Week 6+**: Advanced features, scale to 25+ tenants

**Training & Documentation**:
- User guide (step-by-step with screenshots)
- Video walkthrough (15-minute demo)
- API documentation (for future integrations)
- Troubleshooting guide

**Success Criteria for GA**:
- 5 tenants successfully deployed using builder
- Zero production incidents related to builder
- Operations team satisfaction rating >4/5
- All acceptance criteria met

---

**Approval**: [Product Manager], [Engineering Lead], [Operations Lead]
**Next Steps**: Engineering review → Sprint planning → Kickoff
