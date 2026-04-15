# Picasso Config Builder: Operator Guide

How to configure a client implementation from scratch using the config builder.

---

## Build Order

Every tenant config has a dependency chain. Build in this order or you'll hit validation errors:

```
1. Tenant Identity + AWS        (no dependencies)
2. Programs                     (no dependencies)
3. Forms                        (requires: programs)
4. CTAs                         (requires: forms if using start_form)
5. Branches                     (requires: CTAs)
6. Action Chips                 (requires: branches, optional)
7. Content Showcase             (requires: CTAs, optional)
8. Settings                     (requires: branches for fallback_branch)
9. Validate + Deploy
```

Each step below explains what to configure, what each field does, and what must exist before you can proceed.

---

## Step 1: Load or Create Tenant

**Prerequisites:** None

From the home page, either select an existing tenant or click **Create New Tenant**.

A new tenant needs these identity fields:

| Field | Required | What it does |
|---|---|---|
| `tenant_id` | Yes | Unique slug (lowercase, underscores). Cannot change after creation. |
| `chat_title` | Yes | Displayed in the widget header. Max 100 chars. |
| `welcome_message` | Yes | First message the user sees. Max 500 chars. |
| `tone_prompt` | Yes | Personality instructions for the AI. Max 2000 chars. This is one of the most important fields -- it shapes every response. |
| `subscription_tier` | Yes | Free / Standard / Premium / Enterprise. Controls feature availability. |

**AWS Configuration** (Settings > AI & AWS tab):

| Field | Required | What it does |
|---|---|---|
| `knowledge_base_id` | Yes | Bedrock Knowledge Base ID (10-20 chars, uppercase alphanumeric). Get this from the AWS console after the KB is created. |
| `aws_region` | Yes | Region where the KB lives (e.g., `us-east-1`). |

Without the KB ID and region, the widget cannot retrieve knowledge base content. Set these before testing.

**When you're done:** You have a loadable tenant with identity and AWS connectivity. Nothing else exists yet.

---

## Step 2: Programs

**Prerequisites:** Tenant loaded

Programs are organizational containers. Every form must belong to a program. If the client has one product/service, one program is fine. If they serve multiple audiences or have distinct offerings, create a program for each.

Navigate to **Programs** and create one for each logical grouping.

| Field | Required | Validation | What it does |
|---|---|---|---|
| `program_id` | Yes | Lowercase letters, numbers, underscores. Max 50 chars. | Unique key. Used by forms, CTAs, and branches to group entities. |
| `program_name` | Yes | Max 100 chars | Display name shown in the builder UI (not shown to end users). |
| `description` | No | Max 500 chars | Internal notes about what this program covers. |

**Example:** A nonprofit with mentoring and food distribution might create:
- `dare2dream` -- "Dare2Dream Mentoring Program"
- `lovebox` -- "Love Box Distribution Program"

**When you're done:** You have at least one program. You can now create forms.

---

## Step 3: Forms

**Prerequisites:** At least one program exists

Forms collect structured data from users through conversational prompts. Each form belongs to a program and contains one or more fields.

Navigate to **Forms** and create forms for each data collection need.

### Form Metadata

| Field | Required | Validation | What it does |
|---|---|---|---|
| `form_id` | Yes | Lowercase letters, numbers, underscores. Max 50 chars. | Unique key. CTAs reference this to trigger the form. |
| `program` | Yes | Must match an existing program_id | Which program this form belongs to. |
| `title` | Yes | Max 100 chars | Internal title (shown in builder, also used as conversation header). |
| `description` | Yes | Max 500 chars | Explains the form's purpose. Shown to the user as context. |
| `enabled` | Yes | Boolean | Toggle form on/off without deleting it. Defaults to true. |
| `introduction` | No | Max 1000 chars | Opening message before the first field is asked. |
| `cta_text` | No | Max 50 chars | Custom button text (e.g., "Start Application"). |

### Form Fields

Each form needs at least one field. Click **Add Field** to add them in order -- the order you add them is the order the AI asks them.

| Field property | Required | Validation | What it does |
|---|---|---|---|
| `id` | Yes | Lowercase, unique within this form | Field identifier. Submitted data uses this as the key. |
| `type` | Yes | See types below | Controls input validation and UI rendering. |
| `label` | Yes | Max 100 chars | Human-readable field name (e.g., "Full Name"). |
| `prompt` | Yes | Max 500 chars | The question the AI asks the user. Write this conversationally. |
| `hint` | No | Max 200 chars | Helper text shown below the field. |
| `required` | Yes | Boolean | Whether the user can skip this field. |

**Field types:**

| Type | Notes |
|---|---|
| `text` | Single-line free text |
| `email` | Validates email format |
| `phone` | Accepts most phone formats |
| `number` | Numeric input only |
| `textarea` | Multi-line text |
| `date` | Date picker. Can add `minimum_age` gate (1-120 years). |
| `select` | Dropdown. Requires `options` array of `{value, label}` pairs. |
| `name` | Composite field -- auto-creates First Name + Last Name subfields. |
| `address` | Composite field -- auto-creates Street, City, State, ZIP subfields. |

**Eligibility gates** (select and date types only): Set `eligibility_gate: true` to block form progression if the user's answer doesn't meet criteria. Provide a `failure_message` to explain why.

### Post-Submission (Optional)

After all fields are collected, you can configure what happens:

| Field | Required | What it does |
|---|---|---|
| `confirmation_message` | If post-submission configured | Thank-you message shown after submit. Max 1000 chars. |
| `on_completion_branch` | No | Branch to activate after form submission (routes user to next conversation path). |
| `fulfillment` | No | Where to send the data: `email` (SES), `webhook` (HTTP POST), `dynamodb`, or `sheets`. |

**When you're done:** You have forms with fields, each assigned to a program. You can now create CTAs that trigger these forms.

---

## Step 4: CTAs (Call-to-Actions)

**Prerequisites:** Forms exist (if any CTA uses `start_form` action)

CTAs are the buttons users click. They're the core routing mechanism -- every branch, action chip, and showcase card ultimately surfaces CTAs.

Navigate to **CTAs** and create buttons for each user action.

### CTA Fields

| Field | Required | Validation | What it does |
|---|---|---|---|
| `ctaId` | Yes | Unique. Letters, numbers, hyphens, underscores. | Internal key. Branches and chips reference this. |
| `label` | Yes | Max 100 chars | Button text the user sees (e.g., "Apply to Mentor"). |
| `action` | Yes | Enum (see below) | What happens when the button is clicked. |
| `type` | Yes | Auto-set from action | Internal classification. Don't set manually -- it auto-matches. |
| `ai_available` | No | Boolean | When true, the AI can suggest this CTA dynamically (Tier 1-2 scoring). |
| `target_branch` | No | Must reference existing branch | Navigates to a conversation branch when clicked. |
| `on_completion_branch` | No | Must reference existing branch | Branch to show after a form completes. |
| `program_id` | No | Must reference existing program | Organizational grouping. |

### Action Types

| Action | Type (auto) | Required field | What happens |
|---|---|---|---|
| `start_form` | `form_trigger` | `formId` (must reference existing form) | Opens the specified conversational form. |
| `external_link` | `external_link` | `url` (valid HTTP/HTTPS) | Opens URL in new tab. |
| `send_query` | `bedrock_query` | `query` (text, no max) | Sends the query text to the AI as if the user typed it. |
| `show_info` | `info_request` | `prompt` (text, no max) | Displays a static info message (no AI call). |

### CTA Design Patterns

**Form trigger with follow-up branch:**
- Action: `start_form`, formId: `mentor_application`
- `on_completion_branch`: `mentor_next_steps`
- After the form submits, the user sees the next-steps branch CTAs.

**Navigation CTA (rigid path):**
- Action: `show_info`, prompt: "Here's what you need to know about mentoring..."
- `target_branch`: `dare2dream`
- Clicking routes to the branch, which shows its own CTAs. The AI exits the conversation loop.

**AI-available CTA (flexible path):**
- Action: `send_query`, query: "Tell me about volunteering opportunities"
- `ai_available`: true
- No `target_branch`. The AI stays in the loop and may suggest follow-up chips.

**When you're done:** You have CTAs for all user actions. You can now group them into branches.

---

## Step 5: Branches

**Prerequisites:** CTAs exist

Branches group CTAs into routing destinations. When the AI (or a click) routes to a branch, the branch's primary and secondary CTAs are displayed as buttons.

Navigate to **Branches** and create a branch for each conversation path.

### Branch Fields

| Field | Required | Validation | What it does |
|---|---|---|---|
| `branchId` | Yes | Unique identifier | Key used by CTAs (`target_branch`), chips, and intent definitions. |
| `available_ctas.primary` | Yes | Must reference existing CTA, cannot also be in secondary | The featured/prominent CTA button. |
| `available_ctas.secondary` | Yes (can be empty) | Each must reference existing CTA, no duplicates | Additional CTA buttons shown below the primary. |
| `description` | No | Free text | Internal note: when should this branch activate? Useful for intent definitions. |
| `program_id` | No | Must reference existing program | Organizational grouping. |
| `showcase_item_id` | No | Must reference existing showcase item | Display a content card alongside the branch CTAs. |

### How Branches Work at Runtime

1. User clicks a CTA with `target_branch: "dare2dream"` (or AI routes there)
2. Lambda looks up `conversation_branches.dare2dream`
3. Resolves `available_ctas.primary` → full CTA object from `cta_definitions`
4. Resolves `available_ctas.secondary` → array of full CTA objects
5. Sends all resolved CTAs to the widget as buttons

**Branch design tip:** The primary CTA should be the most important action for that path. Secondary CTAs are supporting options. Example:
- Branch `dare2dream`: primary = "Apply to Be a Mentor", secondary = ["Learn More About Mentoring", "Back to Programs"]

**When you're done:** You have branches that organize CTAs into paths. The core routing structure is complete. Steps 6-7 are optional enhancements.

---

## Step 6: Action Chips (Optional)

**Prerequisites:** Branches exist (if chips use `target_branch`)

Action chips are the quick-access buttons shown at the bottom of the chat. They provide Tier 1 routing -- explicit, operator-defined shortcuts that bypass AI classification entirely.

Navigate to **Action Chips** and configure the chip set.

### Chip Fields

| Field | Required | Validation | What it does |
|---|---|---|---|
| `chipId` | Yes | Unique within chips | Auto-generated from label, or set manually. |
| `label` | Yes | Max 30 chars | Text shown on the chip. Keep it short. |
| `action` | No | `send_query` or `show_info` | Default: `send_query`. What happens when tapped. |
| `value` | Yes | No max length | The query to send (send_query) or message to show (show_info). |
| `target_branch` | No | Must reference existing branch | Forces routing to this branch, overriding AI classification. |
| `target_showcase_id` | No | Must reference existing showcase item | Display a showcase card instead of querying the AI. |
| `program_id` | No | Must reference existing program | Organizational grouping. |

### Global Chip Settings

These are set at the `action_chips` level, not per-chip:

| Setting | Default | What it does |
|---|---|---|
| `enabled` | true | Master toggle for all chips. |
| `max_display` | 4 | How many chips to show at once. |
| `show_on_welcome` | true | Show chips on the welcome screen. |

**When you're done:** Users see quick-access chips that shortcut to key paths.

---

## Step 7: Content Showcase (Optional)

**Prerequisites:** CTAs exist (if showcase items use `available_ctas`)

Showcase items are promotional content cards -- "digital flyers" that display an image, description, and CTA buttons. They appear when the AI or a branch routes to them.

Navigate to **Showcase** and create cards for promotable content.

### Showcase Item Fields

| Field | Required | Validation | What it does |
|---|---|---|---|
| `id` | Yes | Unique | Item identifier. |
| `type` | Yes | `program`, `event`, `initiative`, `campaign` | Content category. |
| `enabled` | Yes | Boolean | Toggle visibility. |
| `name` | Yes | -- | Card title. |
| `tagline` | Yes | -- | Short subtitle. |
| `description` | Yes | -- | Full description text. |
| `image_url` | No | Valid URL | Card image. |
| `keywords` | Yes | Array of strings | Tags for AI matching/filtering. |
| `stats` | No | -- | Stat line (e.g., "500+ participants"). |
| `testimonial` | No | -- | User quote. |
| `highlights` | No | Array of strings | Bullet point features. |
| `available_ctas.primary` | No | Must reference existing CTA | Featured CTA on the card. |
| `available_ctas.secondary` | No | Each must reference existing CTA | Additional CTA buttons. |
| `program_id` | No | Must reference existing program | Organizational grouping. |

**When you're done:** You have rich content cards that can be surfaced by branches or action chips.

---

## Step 8: Settings

**Prerequisites:** Branches exist (for `fallback_branch`)

Now configure global behavior. Navigate to **Settings**.

### Branding (Settings > Branding tab)

Set visual styling. At minimum:

| Field | Priority | Notes |
|---|---|---|
| `primary_color` | Required | Main brand color (hex). Used for buttons, links, widget icon. |
| `font_family` | Required | Font name. Must be available on the client's site. |
| `logo_url` | Recommended | Widget header logo. Host on S3 or client CDN. |
| `header_background` | Recommended | Header bar color. |
| `user_bubble_color` / `bot_bubble_color` | Optional | Chat bubble colors. |

### Features (Settings > Features tab)

Toggle capabilities on/off. Key ones:

| Feature | Default | When to enable |
|---|---|---|
| `conversational_forms` | false | **Must be true** if you created any forms. |
| `streaming` | true | Keep enabled for real-time responses. |
| `smart_cards` | false | Enable if using content showcase. |
| `uploads` / `photo_uploads` | false | Only if the client needs file collection. |

### CTA Settings (Settings > AI & AWS tab)

| Field | When to set |
|---|---|
| `fallback_branch` | **Recommended.** The default branch when no intent classification matches. |
| `max_ctas_per_response` | Default 4. Increase if branches have many secondary CTAs. |

### Bedrock Instructions (Settings > AI & AWS tab)

Fine-tune the AI's behavior:

| Field | What it does |
|---|---|
| `role_instructions` | System-level instructions that shape every response. |
| `formatting_preferences` | Emoji usage, response style, detail level. |
| `custom_constraints` | Rules like "Never discuss competitor products" or "Always mention the hotline number". |
| `fallback_message` | Message if the AI fails entirely. |

**When you're done:** All settings are configured. The tenant is ready for validation.

---

## Step 9: Validate and Deploy

### Validation

Click the validation summary on the Settings page or check the Dashboard for status indicators.

**Errors (must fix before deploy):**
- Form references a program that doesn't exist
- CTA references a form that doesn't exist (start_form action)
- Branch references a CTA that doesn't exist
- Missing required fields
- Missing `fallback_branch` when intent definitions are configured

**Warnings (should fix, won't block deploy):**
- Orphaned entities (CTA not used by any branch)
- `conversational_forms` feature disabled but forms exist
- Intent definition references a branch that doesn't exist

### Deploy

1. Click **Deploy to S3** in the header
2. Review the deployment summary (entity counts, version bump)
3. Confirm
4. The builder:
   - Merges your edits with the latest remote config
   - Creates an automatic backup
   - Increments the version by 0.1
   - Uploads to S3
5. The Lambda picks up the new config on next request (cache TTL: 5 minutes)

---

## Intent Definitions

Intent definitions power the classification pipeline. After each AI response, a separate classifier reads the user's message and matches it against these definitions to determine which branch CTAs to display.

Navigate to **Intent Definitions** (available from the sidebar or Settings > AI & AWS tab).

```json
"intent_definitions": [
  {
    "name": "mentoring_applicant",
    "description": "The visitor wants to BECOME a mentor -- asking how to apply, requirements, time commitment. NOT when someone wants to RECEIVE mentorship.",
    "target_branch": "dare2dream"
  },
  {
    "name": "donating",
    "description": "User wants to donate money, items, or gifts.",
    "target_branch": "donate"
  }
]
```

| Field | Required | Validation | What it does |
|---|---|---|---|
| `name` | Yes | Lowercase with underscores, max 100 chars, unique across definitions | Intent identifier. Logged in CloudWatch. |
| `description` | Yes | Min 10 chars, max 1000 chars | **This is what the classifier reads.** Quality determines accuracy. Write clear positive AND negative cases. |
| `target_branch` | No | Must reference existing branch | Branch to route to when this intent matches. |
| `cta_id` | No | Must reference existing CTA | Single CTA to surface (if no branch). |

**Description quality tips:**
- Include what the intent IS and what it IS NOT
- Use the user's perspective ("The visitor wants to...")
- Differentiate similar intents explicitly (e.g., mentor applicant vs. mentee)
- Keep under ~200 chars for best classifier performance

**Routing priority:** `target_branch` > `cta_id` > fallback. If an intent matches but has neither, the fallback branch is used.

The builder validates cross-references (branch exists, CTA exists, unique names) and preserves `intent_definitions` through load/save/deploy cycles.

---

## Quick Reference: Entity Limits

| Entity | Max per tenant | Notes |
|---|---|---|
| Programs | No hard limit | Keep reasonable (5-15 typical) |
| Forms | No hard limit | Each needs at least 1 field |
| Form fields | No hard limit per form | Order matters -- it's the question sequence |
| CTAs | No hard limit | Every CTA needs a unique ID |
| Branches | No hard limit | Each needs a primary CTA |
| Action chips | Governed by `max_display` | Default 4 shown at a time |
| Showcase items | No hard limit | Each needs name, tagline, description, keywords |
| Intent definitions | Max 12 | Keep focused -- quality over quantity. |
| Quick help prompts | 1-8 | Suggested prompts on the help panel |

---

## Common Patterns

### Pattern: Simple lead capture
1. One program (e.g., `general`)
2. One form with name, email, phone fields
3. One CTA: `start_form` → the form
4. One branch with that CTA as primary
5. Set as `fallback_branch`

### Pattern: Multi-program nonprofit
1. Program per initiative (mentoring, food bank, donations)
2. Forms per program (volunteer app, donation form, enrollment)
3. CTAs: form triggers + info CTAs per program
4. Branches per program path, each with relevant CTAs
5. Action chips for top-level navigation ("Volunteer", "Donate", "Get Help")
6. Intent definitions to classify user messages into the right program

### Pattern: Information-only (no forms)
1. One program
2. No forms
3. CTAs all using `show_info` or `send_query`
4. Branches grouping related info CTAs
5. Action chips for quick navigation
6. `conversational_forms` feature OFF
