# Content Showcase - Implementation Guide

**Version**: 1.0
**Date**: 2025-10-16
**Status**: Ready for Implementation
**Owner**: Engineering Team

---

## Executive Summary

The Content Showcase feature represents an **architectural pivot** from the original "Card Inventory" design. It aligns with the existing keyword-based architecture and provides a simpler, more maintainable solution for presenting rich visual content contextually.

**Key Changes:**
- Removed: Readiness scoring, strategy system, requirements (duplicated existing features)
- Kept: Keyword-based triggering, visual content, CTA integration
- Added: Clear content hierarchy, multi-use case support

---

## Mental Model: Ad Inventory

Think of Content Showcase as **advertising inventory** that can be served contextually:

```
User asks about foster families
    ↓
Bedrock responds with program info
    ↓
Lambda detects "foster families" keyword
    ↓
Injects Love Box showcase card
    ↓
Frontend renders rich visual card with image, testimonial, stats
    ↓
User clicks "Apply for Love Box" CTA
    ↓
Form collection begins
```

**Unlike CTAs (simple buttons), Showcase Cards are:**
- Richer: Images, testimonials, stats, highlights
- Larger: More visual real estate
- Targeted: Keyword-based like CTAs but for storytelling
- Connected: Link to existing CTAs for action

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT CONFIG (S3)                        │
│                                                              │
│  content_showcase: [                                         │
│    {                                                         │
│      id: "lovebox_card",                                     │
│      type: "program",                                        │
│      keywords: ["love box", "foster families"],             │
│      name: "Love Box",                                       │
│      image_url: "...",                                       │
│      cta_id: "lovebox_apply"                                 │
│    }                                                         │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           LAMBDA (response_enhancer.js)                      │
│                                                              │
│  1. Load config (cached 5 min)                               │
│  2. detectContentShowcase(bedrockResponse, userQuery)       │
│  3. Keyword matching (like CTA detection)                    │
│  4. Get linked CTA from definitions                          │
│  5. Return showcaseCard + linkedCta                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ENHANCED RESPONSE                               │
│                                                              │
│  {                                                           │
│    message: "Bedrock response...",                           │
│    showcaseCards: [{                                         │
│      id: "lovebox_card",                                     │
│      type: "program",                                        │
│      name: "Love Box",                                       │
│      image_url: "...",                                       │
│      cta: { label: "Apply", action: "start_form" }          │
│    }],                                                       │
│    ctaButtons: [...]                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          PICASSO WIDGET (Frontend)                           │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  Bedrock Message                            │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  [IMAGE]                                    │            │
│  │  Love Box                                   │            │
│  │  Support foster families                    │            │
│  │  2-3 hours/month | "Best experience!"      │            │
│  │  [Apply for Love Box] ← linked CTA         │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  [Learn More] [Contact Us] ← regular CTAs                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Web Config Builder

### File: `src/components/editors/showcase/ContentShowcaseEditor.tsx`

**Purpose:** CRUD interface for managing showcase items

**Key Features:**
- List view of all showcase items (filterable by type)
- Create/Edit/Delete operations
- Enable/disable toggle per item
- Preview of how card will look
- Validation feedback

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Content Showcase                           [+ New Item] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Type Filter: [All] [Programs] [Events] [Campaigns]     │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ☑ Love Box (program)                    [Edit] [×] │  │
│  │   Keywords: love box, foster families              │  │
│  │   Linked CTA: lovebox_apply                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ☐ Holiday Drive (campaign)              [Edit] [×] │  │
│  │   Keywords: holiday, christmas, gifts              │  │
│  │   Linked CTA: holiday_donate                       │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

### File: `src/components/editors/showcase/ShowcaseItemForm.tsx`

**Purpose:** Form for creating/editing showcase items

**Fields:**

1. **Basic Info**
   - ID (auto-generated from name, editable)
   - Type (dropdown: program, event, initiative, campaign)
   - Enabled (toggle)

2. **Content**
   - Name (required)
   - Tagline (optional)
   - Description (textarea, optional)
   - Image URL (optional, with preview)

3. **Supporting Details**
   - Stats (optional, e.g., "2-3 hours/month")
   - Testimonial (optional, e.g., "Best experience! - Sarah M.")
   - Highlights (array, e.g., ["Flexible schedule", "Monthly commitment"])

4. **Targeting**
   - Keywords (array input, required, at least 1)
   - Linked CTA (dropdown from cta_definitions, required)

**UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Create Showcase Item                                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Basic Info                                               │
│  ├─ ID: [lovebox_card____________________]               │
│  ├─ Type: [Program ▼]                                    │
│  └─ Enabled: [☑]                                         │
│                                                           │
│  Content                                                  │
│  ├─ Name: [Love Box_____________________]               │
│  ├─ Tagline: [Support foster families___]               │
│  ├─ Description:                                          │
│  │   [Pack monthly care boxes with...]                   │
│  └─ Image URL: [https://...____________]                 │
│      [Preview: 📷 image loads here]                       │
│                                                           │
│  Supporting Details (Optional)                            │
│  ├─ Stats: [2-3 hours/month___________]                  │
│  ├─ Testimonial: [Best experience!...]                   │
│  └─ Highlights:                                           │
│      • Flexible schedule - pack boxes at home            │
│      • Monthly commitment                                 │
│      [+ Add highlight]                                    │
│                                                           │
│  Targeting                                                │
│  ├─ Keywords:                                             │
│  │   [love box] [foster families] [+ Add]               │
│  └─ Linked CTA: [lovebox_apply ▼]                       │
│                                                           │
│  [Cancel]                              [Save Item]       │
└──────────────────────────────────────────────────────────┘
```

---

### Validation Logic

**Required Field Validation:**
```typescript
// src/lib/validation/showcaseValidation.ts

export function validateShowcaseItem(item: ShowcaseItem, ctas: CTADefinition[]) {
  const errors: ValidationError[] = [];

  // Required fields
  if (!item.id) errors.push({ field: 'id', message: 'ID is required' });
  if (!item.type) errors.push({ field: 'type', message: 'Type is required' });
  if (!item.name) errors.push({ field: 'name', message: 'Name is required' });

  // Type validation
  const validTypes = ['program', 'event', 'initiative', 'campaign'];
  if (item.type && !validTypes.includes(item.type)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${validTypes.join(', ')}`
    });
  }

  // Keywords validation
  if (!item.keywords || item.keywords.length === 0) {
    errors.push({
      field: 'keywords',
      message: 'At least one keyword is required'
    });
  }

  // CTA link validation
  if (!item.cta_id) {
    errors.push({
      field: 'cta_id',
      message: 'Linked CTA is required'
    });
  } else {
    const ctaExists = ctas.some(cta => cta.id === item.cta_id);
    if (!ctaExists) {
      errors.push({
        field: 'cta_id',
        message: `CTA "${item.cta_id}" does not exist`
      });
    }
  }

  return errors;
}

export function validateShowcaseWarnings(item: ShowcaseItem) {
  const warnings: ValidationWarning[] = [];

  // Optional but recommended
  if (!item.image_url) {
    warnings.push({
      field: 'image_url',
      message: 'Adding an image increases visual impact'
    });
  }

  if (!item.tagline) {
    warnings.push({
      field: 'tagline',
      message: 'Tagline helps communicate value quickly'
    });
  }

  return warnings;
}
```

---

## Component 2: Lambda Response Enhancer

### File: `/Lambdas/lambda/Bedrock_Streaming_Handler_Staging/response_enhancer.js`

**Changes Required:** See SPRINT_PLAN.md Appendix C for detailed line-by-line changes

**Summary:**
1. Load `content_showcase` from config (line 74)
2. Add `detectContentShowcase()` function (after line 236)
3. Call showcase detection in `enhanceResponse()` (after line 406)
4. Update all return statements to include `showcaseCards` array
5. Export `detectContentShowcase` for testing

**Detection Logic:**
```javascript
function detectContentShowcase(bedrockResponse, userQuery, config) {
  const { content_showcase, cta_definitions } = config;

  // Return null if no showcase items
  if (!content_showcase || content_showcase.length === 0) return null;

  // Check each item
  for (const item of content_showcase) {
    if (!item.enabled) continue;
    if (!item.keywords) continue;

    // Keyword matching (same as branches)
    const matches = item.keywords.some(keyword =>
      bedrockResponse.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matches) {
      const linkedCta = cta_definitions[item.cta_id];
      if (!linkedCta) continue; // Skip if CTA missing

      return {
        showcaseCard: {
          ...item,
          cta: linkedCta
        }
      };
    }
  }

  return null;
}
```

---

## Component 3: Frontend Widget Rendering

### File: `Picasso/src/components/chat/ShowcaseCard.tsx` (NEW)

**Purpose:** Render rich showcase card in chat interface

**Component Structure:**
```tsx
interface ShowcaseCardProps {
  card: {
    id: string;
    type: string;
    name: string;
    tagline?: string;
    description?: string;
    image_url?: string;
    stats?: string;
    testimonial?: string;
    highlights?: string[];
    cta: {
      label: string;
      action: string;
      formId?: string;
      url?: string;
    };
  };
  onCtaClick: (cta: CTAButton) => void;
}

export function ShowcaseCard({ card, onCtaClick }: ShowcaseCardProps) {
  return (
    <div className="showcase-card">
      {card.image_url && (
        <img
          src={card.image_url}
          alt={card.name}
          className="showcase-image"
          loading="lazy"
        />
      )}

      <div className="showcase-content">
        <div className="showcase-header">
          <h3>{card.name}</h3>
          {card.tagline && <p className="tagline">{card.tagline}</p>}
        </div>

        {card.description && (
          <p className="description">{card.description}</p>
        )}

        <div className="showcase-details">
          {card.stats && (
            <span className="stats">{card.stats}</span>
          )}
          {card.testimonial && (
            <blockquote className="testimonial">{card.testimonial}</blockquote>
          )}
          {card.highlights && card.highlights.length > 0 && (
            <ul className="highlights">
              {card.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="showcase-cta"
          onClick={() => onCtaClick(card.cta)}
        >
          {card.cta.label}
        </button>
      </div>
    </div>
  );
}
```

**Styling Recommendations:**
```css
.showcase-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  margin: 16px 0;
  max-width: 400px;
}

.showcase-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.showcase-content {
  padding: 20px;
}

.showcase-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.tagline {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.description {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.showcase-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.stats {
  font-weight: 600;
  color: var(--primary-color);
}

.testimonial {
  font-style: italic;
  color: #555;
  border-left: 3px solid var(--primary-color);
  padding-left: 12px;
  margin: 0;
}

.highlights {
  list-style: none;
  padding: 0;
}

.highlights li::before {
  content: "✓ ";
  color: var(--primary-color);
  font-weight: bold;
  margin-right: 8px;
}

.showcase-cta {
  width: 100%;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.showcase-cta:hover {
  background: var(--primary-color-dark);
}
```

---

### Integration in Chat Provider

**File: `Picasso/src/context/StreamingChatProvider.tsx`**

**Update to handle showcaseCards:**
```tsx
// When processing enhanced response
const enhancedData = JSON.parse(line.substring(6));

// Add to message state
setMessages(prev => [...prev, {
  role: 'assistant',
  content: enhancedData.message,
  showcaseCards: enhancedData.showcaseCards || [],  // NEW
  ctaButtons: enhancedData.ctaButtons || []
}]);
```

**Update Message Rendering:**
```tsx
// In chat message component
{message.showcaseCards?.map(card => (
  <ShowcaseCard
    key={card.id}
    card={card}
    onCtaClick={handleCtaClick}
  />
))}

{message.ctaButtons?.map(cta => (
  <CTAButton
    key={cta.id}
    cta={cta}
    onClick={handleCtaClick}
  />
))}
```

---

## Use Cases & Examples

### Use Case 1: Program Showcase

**Scenario:** User asks about foster family support programs

**Config:**
```json
{
  "content_showcase": [
    {
      "id": "lovebox_card",
      "type": "program",
      "enabled": true,
      "name": "Love Box",
      "tagline": "Support foster families in your community",
      "description": "Pack monthly care boxes with essential items for foster families. Make a direct impact with just 2-3 hours per month.",
      "image_url": "https://cdn.example.com/programs/lovebox.jpg",
      "stats": "2-3 hours/month",
      "testimonial": "Best volunteer experience I've had! - Sarah M.",
      "highlights": [
        "Flexible schedule - pack boxes at home",
        "Monthly commitment",
        "Direct impact on local families"
      ],
      "keywords": [
        "love box",
        "foster families",
        "foster care",
        "wraparound services",
        "care packages"
      ],
      "cta_id": "lovebox_apply"
    }
  ],
  "cta_definitions": {
    "lovebox_apply": {
      "text": "Apply for Love Box",
      "action": "start_form",
      "formId": "lb_apply"
    }
  }
}
```

**Conversation:**
```
User: "How can I help foster families in my area?"

Bedrock: "We have several programs to support foster families. Our
Love Box program provides monthly care packages with essential items..."

Lambda Enhancement:
- Detects "foster families" keyword in response
- Matches lovebox_card
- Injects showcase card with linked CTA

Widget Display:
[Rich card with image, Love Box details, testimonial, Apply button]
[Regular CTAs below if applicable]
```

---

### Use Case 2: Campaign Showcase

**Scenario:** User asks about holiday volunteering

**Config:**
```json
{
  "content_showcase": [
    {
      "id": "holiday_drive_card",
      "type": "campaign",
      "enabled": true,
      "name": "Holiday Gift Drive",
      "tagline": "Bring joy to families this season",
      "description": "Help us collect and distribute gifts to 200+ families during the holiday season.",
      "image_url": "https://cdn.example.com/campaigns/holiday-2025.jpg",
      "stats": "Goal: 200 families",
      "highlights": [
        "Nov 1 - Dec 15",
        "Drop-off locations across the city",
        "Tax-deductible donations"
      ],
      "keywords": [
        "holiday",
        "christmas",
        "gifts",
        "seasonal",
        "donation drive"
      ],
      "cta_id": "holiday_donate"
    }
  ]
}
```

---

### Use Case 3: Event Showcase

**Config:**
```json
{
  "content_showcase": [
    {
      "id": "volunteer_orientation_card",
      "type": "event",
      "enabled": true,
      "name": "Volunteer Orientation",
      "tagline": "Learn more about our programs",
      "description": "Join us for a 1-hour session to learn about volunteer opportunities, meet our team, and ask questions.",
      "stats": "Next session: Nov 15 @ 6pm",
      "highlights": [
        "Free pizza provided",
        "No commitment required",
        "Bring your questions"
      ],
      "keywords": [
        "orientation",
        "volunteer training",
        "information session",
        "learn more about programs"
      ],
      "cta_id": "orientation_register"
    }
  ]
}
```

---

## Testing Strategy

### Unit Tests

**Test: Showcase detection with matching keyword**
```typescript
const config = {
  content_showcase: [{
    id: 'test_card',
    enabled: true,
    keywords: ['test keyword'],
    cta_id: 'test_cta'
  }],
  cta_definitions: {
    test_cta: { text: 'Test', action: 'external_link' }
  }
};

const result = detectContentShowcase(
  "This response contains test keyword",
  "user query",
  config
);

expect(result).not.toBeNull();
expect(result.showcaseCard.id).toBe('test_card');
```

**Test: No match returns null**
```typescript
const result = detectContentShowcase(
  "This response has no matching keywords",
  "user query",
  config
);

expect(result).toBeNull();
```

**Test: Disabled item is skipped**
```typescript
config.content_showcase[0].enabled = false;

const result = detectContentShowcase(
  "This response contains test keyword",
  "user query",
  config
);

expect(result).toBeNull();
```

---

### Integration Tests

**Test: Full enhanceResponse with showcase**
```typescript
const result = await enhanceResponse(
  "We have Love Box and other programs",
  "what programs?",
  "test-tenant",
  {}
);

expect(result.showcaseCards).toHaveLength(1);
expect(result.showcaseCards[0].id).toBe('lovebox_card');
expect(result.showcaseCards[0].cta.label).toBe('Apply for Love Box');
expect(result.ctaButtons).toBeDefined();
```

---

### E2E Tests

**Test: Showcase card appears in widget**
```typescript
// Using Playwright
await page.goto('widget-test-page');
await page.type('#chat-input', 'tell me about foster family programs');
await page.click('#send-button');

// Wait for showcase card
const showcaseCard = await page.waitForSelector('.showcase-card');
expect(await showcaseCard.textContent()).toContain('Love Box');

// Click CTA
await page.click('.showcase-cta');
// Verify form opens
await page.waitForSelector('.conversational-form');
```

---

## Migration & Rollout

### Phase 1: Lambda Deployment (Week 1)

1. **Update Lambda code** (response_enhancer.js)
2. **Deploy to staging**
3. **Test with staging tenant** (add test showcase item)
4. **Verify response format** (showcaseCards array present)
5. **Deploy to production**

**Success Criteria:**
- No errors in CloudWatch logs
- Existing tenants continue to work (no showcase = null)
- Test tenant shows showcase cards correctly

---

### Phase 2: Web Builder Deployment (Week 2)

1. **Build showcase editor** (ContentShowcaseEditor.tsx)
2. **Add validation** (showcaseValidation.ts)
3. **Test locally** (create/edit/delete showcase items)
4. **Deploy to production**

**Success Criteria:**
- Can create showcase items in config builder
- Validation prevents broken references
- Config deploys to S3 successfully

---

### Phase 3: Frontend Widget Update (Week 3)

1. **Build ShowcaseCard component** (ShowcaseCard.tsx)
2. **Update chat providers** (handle showcaseCards array)
3. **Test rendering** (with mock data)
4. **Deploy to production**

**Success Criteria:**
- Showcase cards render with images
- Linked CTA buttons work
- Visual hierarchy (cards before CTAs)
- Responsive design works

---

### Phase 4: Gradual Tenant Rollout (Week 4)

1. **Enable for 2 pilot tenants**
2. **Monitor performance** (load time, error rate)
3. **Gather feedback** (ops team, end users)
4. **Iterate on design** (if needed)
5. **Roll out to remaining tenants**

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Lambda response time | <200ms additional | Showcase detection is simple keyword matching |
| Frontend render time | <500ms | Image lazy loading prevents blocking |
| Bundle size increase | <50KB | ShowcaseCard component is lightweight |
| Cache hit rate | >90% | Config cached 5 min, high hit rate expected |

### Monitoring

**CloudWatch Metrics:**
- `ShowcaseDetectionTime` (custom metric)
- `ShowcaseCardDelivered` (custom metric)
- Lambda execution duration
- Error rate

**Frontend Metrics:**
- Image load time
- Showcase card render time
- CTA click-through rate

---

## Troubleshooting

### Issue: Showcase card not appearing

**Possible causes:**
1. Keywords don't match Bedrock response
2. Showcase item is disabled
3. Linked CTA doesn't exist
4. Config not loaded (cache miss + S3 error)

**Debug steps:**
1. Check CloudWatch logs for `detectContentShowcase` calls
2. Verify keywords in config match Bedrock response
3. Check `enabled: true` on showcase item
4. Verify `cta_id` exists in `cta_definitions`

---

### Issue: Image not loading

**Possible causes:**
1. Invalid image URL
2. CORS blocking image load
3. Image host down

**Debug steps:**
1. Test image URL directly in browser
2. Check browser console for CORS errors
3. Verify image_url in config is https://

---

### Issue: CTA button not working

**Possible causes:**
1. Linked CTA has wrong action
2. formId doesn't exist
3. Frontend handler not implemented

**Debug steps:**
1. Check CTA definition in config
2. Verify action type is valid
3. Check frontend onClick handler

---

## Future Enhancements

### Phase 2 Considerations

**Priority-based showcasing:**
- Currently shows first match only
- Could add priority field to showcase items
- Sort by priority before matching

**Multiple showcase cards:**
- Currently max 1 per response
- Could allow 2-3 cards for broad queries
- Would need frontend carousel

**Analytics:**
- Track showcase card impressions
- Track CTA click-through rates
- A/B test different content/images

**Dynamic content:**
- Pull stats from live APIs
- Update testimonials periodically
- Seasonal campaigns auto-enable/disable

---

## Conclusion

The Content Showcase feature provides a simple, maintainable way to present rich visual content contextually. By following existing architectural patterns (keyword-based detection, config-driven behavior), it integrates seamlessly with the current system while providing differentiated value over simple CTAs.

**Next Steps:**
1. Review this guide with engineering team
2. Begin Lambda implementation (Week 1)
3. Build web builder interface (Week 2)
4. Update frontend widget (Week 3)
5. Gradual tenant rollout (Week 4)

---

**Questions?** Contact engineering team or refer to:
- WEB_CONFIG_BUILDER_PRD.md (Content Showcase section)
- SPRINT_PLAN.md (Task 3.5, Appendix C)
- response_enhancer.js (implementation reference)
