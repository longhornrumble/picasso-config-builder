# Tenant-Specific Bedrock Prompts Implementation Plan

## Executive Summary

Enable per-tenant customization of Bedrock AI prompt instructions while maintaining centralized control over critical safety rules. This allows different organizations to have distinct AI personalities (professional vs warm, formal vs casual) while ensuring all tenants benefit from core improvements to anti-hallucination, URL handling, and other critical functionality.

## Business Driver

**Problem:** Foster Village loves the current professional AI tone, but Austin Angels rejected it as too corporate/formal for their youth-focused brand. Different organizations need different AI personalities to match their brand voice.

**Solution:** Allow brand voice customization (tone, emoji usage, structure) while locking down safety-critical rules (anti-hallucination, URL preservation) that should apply to all tenants.

---

## Architecture: Locked vs Unlocked Layers

### 🔒 LOCKED (System-Level, Never Customizable)

These sections live in Lambda code and apply to ALL tenants. Updates deploy instantly to everyone.

**1. Anti-Hallucination Rules**
- "You MUST ONLY use information explicitly stated in the knowledge base"
- "NEVER make up program names, services, or contact information"
- Prevents AI from inventing facts not in KB

**Why locked:** One hallucination incident could destroy client trust. Non-negotiable safety.

**2. URL/Link Preservation**
- "PRESERVE ALL MARKDOWN FORMATTING: [text](url)"
- "ALWAYS include complete URLs exactly as they appear"
- "Do not modify, shorten, or reformat URLs"

**Why locked:** Broken links = lost conversions. Technical correctness, not preference.

**3. KB Context Integration**
- How knowledge base chunks get injected into prompt
- Format: `KNOWLEDGE BASE INFORMATION:\n${kbContext}`

**Why locked:** Core system functionality. Not customizable.

**4. Conversation History Handling**
- How previous messages are formatted and injected
- Ensures continuity and memory across conversation

**Why locked:** System-level behavior that enables multi-turn conversations.

**5. Fallback Logic**
- WHEN to show "no information" message (logic is locked)
- WHAT to say can be customized (message is unlocked)

**Why locked:** System needs to know when KB has no relevant content.

### 🔓 UNLOCKED (Tenant-Configurable)

These sections can be customized per tenant via `bedrock_instructions` config field.

**1. Role Instructions**
- How AI introduces itself
- Professional: "You are a virtual assistant..."
- Warm: "I'm here to help you! I'm part of the team..."

**Why unlocked:** Brand voice preference.

**2. Custom Domain Constraints**
- Tenant-specific rules that ADD to locked constraints
- Examples:
  - "Always mention programs are free for foster families"
  - "Emphasize trauma-informed approach"
  - "Include disclaimer about medical advice"

**Why unlocked:** Domain-specific rules, but ADDITIVE only (can't weaken locked rules).

**3. Formatting Preferences**
- **Emoji usage:** none, moderate (2-3), generous (4-6)
- **Response style:** structured_bullets, warm_conversational, professional_concise
- **Detail level:** concise, balanced, comprehensive

**Why unlocked:** Pure brand preference, no safety implications.

**4. Fallback Message**
- Custom message when KB has no context
- Default: "I don't have information about this topic..."
- Custom: "I don't have details on that - would you like to speak with our intake team?"

**Why unlocked:** Brand voice, but trigger logic is locked.

---

## Storage Strategy

### Option: S3 Config File (RECOMMENDED)

Store `bedrock_instructions` in existing tenant config.json files alongside forms, CTAs, etc.

**Pros:**
- Everything in one place
- Already have S3 + Lambda cache infrastructure
- Version control friendly (git commit configs)
- Simple backup/rollback (S3 versioning)
- Config builder already reads/writes S3

**Cons:**
- No query capability ("which tenants use template X?")
- Need to enable S3 versioning for audit trail

**Structure:**
```json
{
  "tenant_id": "AUS123957",
  "tone_prompt": "You are a compassionate assistant...",

  "bedrock_instructions": {
    "_version": "1.0",
    "_created": "2025-11-15",
    "_source": "prompt_library/warm_conversational_v1.txt",

    "role_instructions": "I'm here to help answer your questions about our programs...",

    "custom_constraints": [
      "Always mention that all programs are free for foster families",
      "Emphasize our trauma-informed care approach in all responses"
    ],

    "formatting_preferences": {
      "emoji_usage": "generous",
      "max_emojis": 5,
      "response_style": "warm_conversational",
      "detail_level": "comprehensive"
    },

    "fallback_message": "I don't have specific information about that, but I'd love to connect you with our team who can help!"
  },

  "aws": { ... },
  "conversational_forms": { ... }
}
```

---

## Prompt Version Control Strategy

### Lambda Code Versioning (Locked Sections)

```javascript
// At top of index.js
const PROMPT_VERSION = '2.1.0'; // Semantic versioning for locked rules

// In QA logging
console.log(JSON.stringify({
  type: 'QA_COMPLETE',
  prompt_version: PROMPT_VERSION,  // Track which version generated response
  tenant_id: config.tenant_id,
  has_custom_prompt: config?.bedrock_instructions ? true : false,
  // ...
}));
```

**Update workflow:**
1. Discover hallucination issue
2. Update `LOCKED_ANTI_HALLUCINATION` constant in Lambda
3. Bump `PROMPT_VERSION` to 2.2.0
4. Deploy Lambda
5. ALL tenants immediately protected
6. Logs track which version generated each response

### Prompt Library (Version-Controlled Variants)

Create reusable prompt variants in git:

```
lambda-repo/Bedrock_Streaming_Handler_Staging/
├── prompt_library/
│   ├── README.md                    # Documents each variant
│   ├── CHANGELOG.md                 # Track changes over time
│   ├── role_instructions/
│   │   ├── standard_professional.txt    # Current default (Foster Village)
│   │   ├── warm_conversational.txt      # Austin Angels variant
│   │   └── medical_conservative.txt     # Future hospice clients
│   ├── formatting_rules/
│   │   ├── structured_skimmable.txt
│   │   ├── conversational_flowing.txt
│   │   └── formal_detailed.txt
│   └── custom_constraints/
│       ├── healthcare_disclaimers.json
│       ├── nonprofit_common.json
│       └── educational_requirements.json
```

**Example: standard_professional.txt**
```
---
Version: 1.0
Created: 2025-11-15
Use Case: General professional organizations (B2B, corporate nonprofits)
Success Examples: Foster Village
Failed For: Austin Angels (too formal for youth-focused brand)
---

You are a virtual assistant answering the questions of website visitors.
You are always courteous and respectful and respond as if you are an
employee of the organization. You replace words like they or their with
our, which conveys that you are a representative of the team...
```

**Git workflow:**
```bash
# Create new variant for Austin Angels
git add prompt_library/role_instructions/warm_conversational.txt
git commit -m "feat: Add warm_conversational variant for youth-focused nonprofits

- Based on standard_professional but softer language
- First-person voice ('I'm here to help' vs 'You are a virtual assistant')
- More generous emoji usage (4-6 vs 2-3)
- Deployed to: AUS123957 (Austin Angels)"
```

---

## Implementation Phases

### Phase 1: Lambda Backend Refactoring

**Goal:** Enable `bedrock_instructions` config field support while preserving current behavior.

**Tasks:**
1. **Extract hardcoded sections into helper functions**
   ```javascript
   function getDefaultRoleInstructions() { ... }
   function getLockedAntiHallucinationRules() { ... }
   function getLockedUrlHandling() { ... }
   ```

2. **Refactor `buildPrompt()` function** (index.js line 162-298)
   - Implement layered architecture (locked base + custom overrides)
   - Add config reading with fallbacks
   - Preserve current behavior when no `bedrock_instructions` present

3. **Add version tracking**
   - `PROMPT_VERSION` constant for locked sections
   - Log version with each Q&A pair

4. **Test with existing tenants**
   - Verify no behavior change (configs don't have `bedrock_instructions` yet)
   - Confirm logs show prompt version

**Deliverable:** Lambda that supports customization but behaves identically for existing tenants.

---

### Phase 2: Create Initial Variants

**Goal:** Document current prompt as baseline, create Austin Angels variant.

**Tasks:**
1. **Create prompt library structure**
   ```bash
   mkdir -p lambda-repo/Bedrock_Streaming_Handler_Staging/prompt_library/{role_instructions,formatting_rules,custom_constraints}
   ```

2. **Document standard_professional variant**
   - Extract current hardcoded prompt → `standard_professional.txt`
   - Document: "Used since 2025-08, Foster Village success"

3. **Create warm_conversational variant**
   - Softer language, first-person voice
   - More generous emoji usage
   - Conversational flow vs structured bullets
   - Document: "Created for Austin Angels (youth-focused nonprofit)"

4. **Create README and CHANGELOG**
   - Document when to use each variant
   - Track success/failure examples

**Deliverable:** Version-controlled prompt library with 2 variants.

---

### Phase 3: Deploy to Test Tenants

**Goal:** Validate warm variant with Austin Angels, keep Foster Village on standard.

**Tasks:**
1. **Update Austin Angels config**
   ```json
   {
     "tenant_id": "AUS123957",
     "bedrock_instructions": {
       "_source": "prompt_library/warm_conversational_v1.txt",
       "role_instructions": "I'm here to help answer...",
       "formatting_preferences": {
         "emoji_usage": "generous",
         "max_emojis": 5,
         "response_style": "warm_conversational"
       }
     }
   }
   ```

2. **Foster Village config stays empty** (uses default)

3. **Test both personalities**
   - Same questions to both tenants
   - Verify distinct responses
   - Document what works/doesn't

4. **Gather feedback**
   - Austin Angels: "Is this closer to your brand?"
   - Foster Village: "Behavior unchanged?"

**Deliverable:** Two live tenants with different AI personalities, documented feedback.

---

### Phase 4: Config Builder UI (Later)

**Goal:** Visual interface for editing prompt personality.

**Tasks:**
1. **Add "Bedrock Instructions" section** to config builder

2. **Show locked vs unlocked clearly**
   ```
   🔒 Anti-Hallucination Rules (System-Level)
   These rules are managed by MyRecruiter and cannot be customized.
   [View Current Rules]

   ✏️ Role Instructions (Customizable)
   Define how your AI introduces itself.
   [Edit]
   ```

3. **Provide editing interface**
   - Textarea for role instructions
   - Array input for custom constraints
   - Dropdowns for emoji usage, response style
   - Live preview of example responses

4. **Save to S3**
   - Update `bedrock_instructions` in config.json
   - Add metadata (version, last modified)

**Deliverable:** Self-service UI for prompt customization (after validation).

---

### Phase 5: Sales/Demo Assets (After Validation)

**Goal:** Show prospects the value of AI personality customization.

**Tasks:**
1. **Create static personality gallery**
   - HTML page (like use case library)
   - Shows same question, 3 different responses:
     - 💼 Professional/Formal
     - 🤝 Balanced/Approachable
     - 💛 Warm/Conversational

2. **Use in sales presentations**
   - Show prospects their brand can be reflected
   - Demonstrate competitive differentiation
   - Spark "that's OUR voice" recognition

3. **Observe patterns**
   - Which industries prefer which personalities?
   - What sections get customized most?
   - Build templates based on real data

**Deliverable:** Sales collateral demonstrating AI personality customization.

---

## Example: Locked + Unlocked Layers

### Prompt Assembly (Simplified)

```javascript
function buildPrompt(userInput, kbContext, tone, conversationHistory, config) {
  const parts = [];

  // LAYER 1: LOCKED - Tone
  parts.push(tone || DEFAULT_TONE);

  // LAYER 2: CUSTOMIZABLE - Role/Identity
  const roleInstructions =
    config?.bedrock_instructions?.role_instructions ||
    getDefaultRoleInstructions();
  parts.push(roleInstructions);

  // LAYER 3: LOCKED - Conversation History
  if (conversationHistory?.length > 0) {
    parts.push('\nPREVIOUS CONVERSATION:');
    conversationHistory.forEach(msg => {
      parts.push(`${msg.role}: ${msg.content}`);
    });
  }

  // LAYER 4: LOCKED - Anti-Hallucination
  if (kbContext) {
    parts.push(LOCKED_ANTI_HALLUCINATION);  // Never customizable
    parts.push(`KNOWLEDGE BASE INFORMATION:\n${kbContext}`);
  }

  // LAYER 5: CUSTOMIZABLE - Domain Constraints
  if (config?.bedrock_instructions?.custom_constraints) {
    parts.push('\nADDITIONAL CONSTRAINTS:');
    config.bedrock_instructions.custom_constraints.forEach(c => {
      parts.push(`- ${c}`);
    });
  }

  // LAYER 6: LOCKED - URL Handling
  parts.push(LOCKED_URL_HANDLING);  // Never customizable

  // LAYER 7: CUSTOMIZABLE - Formatting Rules
  const formattingRules = buildFormattingRules(
    config?.bedrock_instructions?.formatting_preferences
  );
  parts.push(formattingRules);

  // LAYER 8: LOCKED - Question Injection
  parts.push(`\nCURRENT USER QUESTION: ${userInput}`);

  return parts.join('\n');
}
```

---

## Example Personalities

### Standard Professional (Foster Village)

**Config:** Empty (uses defaults)

**Response to "Tell me about grief counseling":**
```
We offer individual grief counseling and group support programs.
Services include:

• One-on-one sessions with licensed counselors
• Seven-week peer support groups
• Ongoing bereavement support

Contact our intake team for scheduling.
```

### Warm Conversational (Austin Angels)

**Config:**
```json
{
  "bedrock_instructions": {
    "role_instructions": "I'm here to help answer your questions! I'm part of the Austin Angels team...",
    "formatting_preferences": {
      "emoji_usage": "generous",
      "max_emojis": 5,
      "response_style": "warm_conversational"
    },
    "custom_constraints": [
      "Always mention that all programs are free for foster families"
    ]
  }
}
```

**Response to "Tell me about your mentorship program":**
```
I'm so glad you're asking about this! 💛 Our Dare to Dream mentorship
program is really special - it's all about helping foster youth believe
in themselves and their future.

Here's how it works:

🌟 We match young people with caring mentors who become trusted guides
   and cheerleaders
💪 Together, they work on goals that matter - school, career dreams,
   life skills
❤️ It's a one-year commitment, but many relationships last much longer!

And here's the best part - this program is completely free for foster
families. We believe every young person deserves this support.

Want to learn more about becoming a mentor?
```

---

## Maintenance Strategy

### When Locked Sections Need Updates

**Scenario:** Discover hallucination bug across multiple tenants.

**Process:**
1. Update `LOCKED_ANTI_HALLUCINATION` in Lambda code
2. Bump `PROMPT_VERSION` to 2.2.0
3. Deploy Lambda
4. ALL tenants get fix immediately (no config changes needed)
5. Logs track which version generated each response

### When Custom Sections Need Updates

**Scenario:** Austin Angels wants to change emoji usage from generous to moderate.

**Process:**
1. Update `formatting_preferences.emoji_usage` in their config
2. Upload to S3
3. Change takes effect within 5 minutes (cache TTL)
4. Other tenants unaffected

---

## Success Metrics

### Technical
- Zero behavior change for existing tenants after Phase 1
- Prompt version logged with every Q&A pair
- Config changes take effect within 5 minutes
- Locked sections update instantly on Lambda deploy

### Business
- Austin Angels approves warm variant (brand fit)
- Foster Village behavior unchanged (stability)
- 3-5 additional tenants configured with distinct personalities
- Patterns emerge for industry-specific templates

### Operational
- Prompt library with 3-5 proven variants
- CHANGELOG documenting what works per industry
- Config builder UI enables self-service (Phase 4)

---

## Key Principles

1. **Safety First:** Anti-hallucination, URL handling, KB integration NEVER customizable
2. **Central Control:** Locked sections update globally, instantly
3. **Brand Flexibility:** Voice, tone, style customizable per tenant
4. **Version Everything:** Track locked version + custom config version
5. **Start Simple:** Build infrastructure after observing real patterns
6. **80/20 Rule:** Most tenants use standard with minor tweaks

---

## Next Steps

1. ✅ Document plan (this file)
2. ⏳ Phase 1: Refactor Lambda `buildPrompt()` function
3. ⏳ Phase 2: Create prompt library with 2 variants
4. ⏳ Phase 3: Deploy to Austin Angels + Foster Village
5. ⏳ Validate and iterate based on feedback

---

## References

- Lambda Handler: `lambda-repo/Bedrock_Streaming_Handler_Staging/index.js` (line 162-298)
- Current Prompt: Hardcoded in `buildPrompt()` function
- Tenant Configs: `s3://myrecruiter-picasso/tenants/{tenant_id}/config.json`
- Cache TTL: 5 minutes (index.js line 40)

---

**Document Version:** 1.0
**Created:** 2025-11-15
**Author:** MyRecruiter Engineering
**Status:** Planning - No code changes yet
