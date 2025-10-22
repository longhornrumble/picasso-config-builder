# Picasso Config Builder - User Guide

**Version**: 1.0
**Last Updated**: 2025-10-19
**Audience**: Operations teams, non-technical administrators

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Programs Editor](#2-programs-editor)
3. [Forms Editor](#3-forms-editor)
4. [CTAs Editor](#4-ctas-editor)
5. [Branches Editor](#5-branches-editor)
6. [Content Showcase Editor](#6-content-showcase-editor)
7. [Understanding Validation](#7-understanding-validation)
8. [Deploying Configurations](#8-deploying-configurations)
9. [Troubleshooting](#9-troubleshooting)
10. [Best Practices](#10-best-practices)

---

## 1. Getting Started

### What is the Picasso Config Builder?

The Picasso Config Builder is a web-based tool that lets you configure conversational forms, call-to-action buttons, and conversation branches for your organization's Picasso chat widget—without writing any code.

**Key Capabilities:**
- Create and manage conversational forms that collect information from users
- Design call-to-action (CTA) buttons that appear in chat conversations
- Configure conversation branches that route users to relevant information
- Set up content showcase cards to highlight programs and initiatives
- Validate configurations to prevent errors
- Deploy directly to AWS S3 where Picasso reads configurations

### Prerequisites

Before using the Config Builder, ensure you have:

1. **AWS Credentials**: Access credentials for the `myrecruiter-picasso` S3 bucket
2. **Tenant ID**: Your organization's unique tenant identifier (e.g., `MYR384719`)
3. **Browser**: Modern web browser (Chrome, Firefox, or Safari recommended)
4. **Network Access**: Connection to AWS services

### Accessing the Application

1. Navigate to the Config Builder URL (provided by your administrator)
2. The application will load with a tenant selector at the top
3. Select your tenant from the dropdown
4. The system will automatically load your current configuration from S3

**Load Time**: The application should load in under 2 seconds. If it takes longer, check your network connection.

### Understanding the Interface

The Config Builder interface has four main sections:

```
┌─────────────────────────────────────────────────────────┐
│  Header: Tenant Selector | Deploy Button | Status      │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Sidebar:    │  Main Editor Area:                       │
│  - Programs  │  - Entity List                          │
│  - Forms     │  - Create/Edit Forms                    │
│  - CTAs      │  - Entity Details                       │
│  - Branches  │                                          │
│  - Showcase  │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  Validation Panel: Errors and Warnings                  │
└─────────────────────────────────────────────────────────┘
```

### Initial Setup Steps

**First Time Using the Config Builder:**

1. **Load Your Tenant Configuration**
   - Select your tenant from the dropdown
   - Wait for the configuration to load from S3
   - You'll see existing programs, forms, CTAs, and branches (if any)

2. **Review Existing Configuration**
   - Navigate through each section using the sidebar
   - Familiarize yourself with what's already configured
   - Note: Some sections are read-only (branding, AWS settings)

3. **Make Your First Change**
   - Start with the Programs section (simplest)
   - Create a test program
   - Save and validate
   - Deploy to S3

4. **Verify Deployment**
   - Check that the deployment succeeded
   - Verify the change appears in your Picasso chat widget
   - If testing, use a staging environment first

**Auto-Save**: The Config Builder automatically saves your work to browser session storage every 30 seconds. If you refresh the page, unsaved changes will be recovered.

---

## 2. Programs Editor

### What are Programs?

Programs are organizational units that forms can be assigned to. They help categorize and organize your conversational forms.

**Examples:**
- Volunteer Programs
- Donation Programs
- Event Registration
- Support Services
- Mentorship Programs

### Creating a Program

**Step-by-Step:**

1. **Navigate to Programs**
   - Click "Programs" in the sidebar
   - You'll see a list of existing programs (or an empty state)

2. **Click "Create Program"**
   - A form dialog will appear

3. **Fill in Required Fields:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Program ID** | Unique identifier (lowercase, underscores) | `volunteer_programs` |
   | **Program Name** | Display name shown to users | `Volunteer Programs` |
   | **Description** | Brief explanation of the program | `Opportunities to volunteer with our organization` |

4. **Click "Create"**
   - The program will be added to your configuration
   - You'll see it appear in the programs list

**Field Requirements:**
- Program ID must be unique across all programs
- Program ID should use lowercase letters, numbers, and underscores only
- Program Name is required and should be user-friendly
- Description is optional but recommended for clarity

### Editing a Program

1. Click the program card you want to edit
2. Click the "Edit" button (pencil icon)
3. Modify the fields
4. Click "Save Changes"

**Note**: If you change the Program ID, you'll need to update any forms that reference the old ID.

### Deleting a Program

**Before Deleting:**
- Check if any forms are assigned to this program
- The system will warn you if there are dependencies

**Steps:**

1. Click the program card
2. Click the "Delete" button (trash icon)
3. Review the dependency warning (if any)
4. If forms are using this program:
   - **Option A**: Delete the forms first, then delete the program
   - **Option B**: Reassign the forms to a different program, then delete
5. Confirm deletion

**Warning**: Deleting a program that's used by forms will prevent those forms from working correctly. Always check dependencies first.

### Program Dependencies

The Config Builder tracks where programs are used:

- **Forms**: Which conversational forms are assigned to this program
- **Referenced By**: Which CTAs or branches might reference forms in this program

When you try to delete a program with dependencies, you'll see a warning:

```
⚠️ Cannot delete program "Volunteer Programs"
This program is used by:
- Forms: 3 (Volunteer Application, Background Check Form, Orientation Registration)

Please reassign or delete these forms first.
```

---

## 3. Forms Editor

### What are Conversational Forms?

Conversational forms collect information from users through a natural, question-by-question conversation in the chat widget. Instead of a traditional web form, users answer one question at a time.

**Example Flow:**
```
Bot: "What's your first name?"
User: "Sarah"
Bot: "Thanks Sarah! What's your email address?"
User: "sarah@example.com"
Bot: "Great! What's your phone number?"
...
```

### Creating a Form

**Step-by-Step:**

1. **Navigate to Forms**
   - Click "Forms" in the sidebar

2. **Click "Create Form"**
   - A multi-section form editor will appear

3. **Fill in Form Metadata:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Form ID** | Unique identifier | `volunteer_application` |
   | **Title** | Form name shown to users | `Volunteer Application` |
   | **Description** | Brief explanation | `Apply to become a volunteer` |
   | **Program** | Assign to a program | `volunteer_programs` |
   | **Enabled** | Toggle to activate/deactivate | ✓ |
   | **CTA Text** | Button text (optional) | `Apply Now` |

4. **Add Trigger Phrases** (Optional but Recommended)
   - These phrases will automatically start the form when users type them
   - Click "Add Trigger Phrase"
   - Examples:
     - "I want to volunteer"
     - "volunteer application"
     - "sign up to help"
     - "become a volunteer"
   - Add multiple variations users might say

5. **Add Form Fields** (The Core of Your Form)
   - Click "Add Field" to create each question
   - See [Form Fields](#form-fields-in-detail) section below

6. **Configure Post-Submission** (What happens after form completion)
   - See [Post-Submission Configuration](#post-submission-configuration) section below

7. **Click "Create Form"**

### Form Fields in Detail

Each form field represents one question in the conversation.

**Available Field Types:**

| Type | Description | Validation | Example |
|------|-------------|------------|---------|
| **Text** | Short text input | Max length | First name, city |
| **Email** | Email address | Email format | user@example.com |
| **Phone** | Phone number | Phone format | (555) 123-4567 |
| **Number** | Numeric input | Number format | Age, zip code |
| **Date** | Date picker | Date format | Birth date, event date |
| **Textarea** | Long text input | Max length | Comments, address |
| **Select** | Dropdown/multiple choice | Must pick option | State, program interest |

**Field Configuration:**

When adding/editing a field, you'll configure:

1. **Field ID** (required)
   - Unique identifier within the form
   - Lowercase, underscores only
   - Example: `first_name`, `email_address`

2. **Label** (required)
   - Field name shown in completed forms
   - Example: "First Name", "Email Address"

3. **Prompt** (required)
   - The question the bot asks
   - Should be conversational and clear
   - Examples:
     - "What's your first name?"
     - "What email address should we use to contact you?"
     - "What's the best phone number to reach you?"

4. **Hint** (optional)
   - Additional context or instructions
   - Example: "We'll only use this for volunteer opportunities"

5. **Required** (checkbox)
   - Check if this field must be filled out
   - Users can't skip required fields

6. **Eligibility Gate** (checkbox)
   - Special field that determines if user can continue
   - If user fails this check, form ends early
   - Use for age requirements, location restrictions, etc.

7. **Failure Message** (required if Eligibility Gate is checked)
   - Message shown if user doesn't meet eligibility
   - Example: "Sorry, volunteers must be at least 18 years old."

**Select Field Options:**

For select fields, you must define the available choices:

1. Click "Add Option"
2. Enter:
   - **Value**: Internal value (e.g., `red`, `blue`)
   - **Label**: Display text (e.g., "Red", "Blue")
3. Add multiple options (minimum 2 required)

**Example Select Field:**
```
Prompt: "Which program are you interested in?"
Options:
  - Value: love_box | Label: Love Box
  - Value: dare_to_dream | Label: Dare to Dream
  - Value: mentorship | Label: Mentorship Program
```

**Field Ordering:**

Fields are asked in the order they appear in the editor. To reorder:
1. Use the drag handle (⋮⋮) on the left of each field
2. Drag up or down to reposition

### Post-Submission Configuration

After a user completes the form, you can configure what happens next.

**Confirmation Message** (required)
- Thank you message shown to the user
- Example: "Thank you for your application! We'll review it and get back to you within 2 business days."

**Next Steps** (optional)
- Bulleted list of what happens next
- Example:
  - Check your email for a confirmation message
  - We'll contact you within 2 business days
  - Meanwhile, explore our volunteer opportunities

**Actions** (optional)
- Buttons or links shown after form submission
- Configure follow-up actions:

| Action Type | Description | Configuration |
|-------------|-------------|---------------|
| **End Conversation** | Closes the chat | No additional config |
| **Continue Conversation** | Keeps chat open for more questions | No additional config |
| **Start Form** | Begins another form | Select form from dropdown |
| **External Link** | Opens a URL | Enter URL and link text |

**Example Post-Submission Flow:**
```
Confirmation: "Thank you for applying to be a volunteer!"

Next Steps:
- Check your email for a confirmation
- We'll contact you within 2 business days
- Complete a background check (if required)

Actions:
[Background Check Form] [Visit Our Website] [Close]
```

**Fulfillment Configuration** (How the data is sent)

Configure where form submissions are sent:

| Method | Description | Required Fields |
|--------|-------------|-----------------|
| **Email** | Send to email addresses | Recipients, CC (optional), subject template |
| **Webhook** | POST to external API | Webhook URL |
| **DynamoDB** | Store in database | Table name (auto-configured) |
| **Google Sheets** | Append to spreadsheet | Sheet ID, credentials |

**Most Common**: Email fulfillment sends form data to your team's email address.

**Email Fulfillment Example:**
```
Recipients: volunteers@myorg.org
CC: admin@myorg.org
Subject Template: "New Volunteer Application from {first_name} {last_name}"
Notification Enabled: ✓
```

### Editing a Form

1. Click the form card in the forms list
2. Click "Edit" button
3. Modify any section (metadata, fields, post-submission)
4. Click "Save Changes"

**Tips:**
- Test your changes in a staging environment first
- If you modify trigger phrases, consider backward compatibility
- Changing field IDs can break integrations—use caution

### Deleting a Form

1. Click the form card
2. Click "Delete" button
3. Review dependencies (CTAs that reference this form)
4. Confirm deletion

**Warning**: If a CTA is configured to start this form, deleting it will break that CTA. Update or delete the CTA first.

### Form Best Practices

1. **Keep Forms Short**: 5-7 fields is optimal. Longer forms have higher abandonment rates.

2. **Use Clear Prompts**: Write questions as if you're having a conversation.
   - Good: "What's your first name?"
   - Bad: "Enter first name"

3. **Add Hints for Complex Fields**: Help users understand what's expected.
   - Phone: "Include area code (e.g., 555-123-4567)"
   - Date: "Format: MM/DD/YYYY"

4. **Use Eligibility Gates Strategically**:
   - Place early in the form to save users time
   - Be clear about requirements

5. **Test Your Forms**: Fill out the form yourself before deploying to catch issues.

6. **Use Trigger Phrases**: Add 3-5 variations of what users might say.

---

## 4. CTAs Editor

### What are CTAs?

CTAs (Call-to-Actions) are buttons that appear in chat conversations, guiding users to take specific actions.

**CTA Types:**
1. **Start Form**: Begins a conversational form
2. **External Link**: Opens a URL in a new tab
3. **Send Query**: Sends a predefined question to the AI
4. **Show Info**: Displays specific information

### Creating a CTA

**Step-by-Step:**

1. **Navigate to CTAs**
   - Click "CTAs" in the sidebar

2. **Click "Create CTA"**

3. **Fill in CTA Configuration:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **CTA ID** | Unique identifier | `volunteer_apply_cta` |
   | **Label** | Button text shown to users | `Apply to Volunteer` |
   | **Action Type** | What happens when clicked | `Start Form` |
   | **Style** | Visual style | `Primary` (green), `Secondary` (gray), `Info` (blue) |

4. **Configure Action-Specific Fields**
   - Fields change based on Action Type selected
   - See sections below for each type

5. **Click "Create CTA"**

### CTA Action Types

#### 1. Start Form

Starts a conversational form when clicked.

**Configuration:**
- **Form ID**: Select from dropdown of available forms
- **Validation**: Form must exist in your configuration

**Example:**
```
Label: "Apply Now"
Action: Start Form
Form ID: volunteer_application
Style: Primary
```

**When to Use**: Guide users to applications, registrations, or data collection forms.

#### 2. External Link

Opens a URL in a new browser tab.

**Configuration:**
- **URL**: Full URL including https://
- **Validation**: Must be a valid URL format

**Example:**
```
Label: "Visit Our Website"
Action: External Link
URL: https://www.myorganization.org/volunteer
Style: Secondary
```

**When to Use**:
- Link to external resources
- Redirect to your main website
- Point to social media profiles
- Link to documentation

#### 3. Send Query

Sends a predefined question to the AI chatbot on behalf of the user.

**Configuration:**
- **Query**: The question to send
- **Use Case**: Pre-populate common questions

**Example:**
```
Label: "Learn About Requirements"
Action: Send Query
Query: "What are the requirements to become a volunteer?"
Style: Info
```

**When to Use**:
- Offer quick access to common questions
- Guide conversation flow
- Provide topic shortcuts

#### 4. Show Info

Displays specific information or prompts the AI to explain a topic.

**Configuration:**
- **Prompt**: Instructions for what information to show
- **The AI will generate a response based on this prompt**

**Example:**
```
Label: "Time Commitment"
Action: Show Info
Prompt: "Explain the time commitment required for our volunteer programs, including typical hours per week and duration of commitment."
Style: Info
```

**When to Use**:
- Provide explanations
- Show detailed information
- Clarify complex topics

### CTA Styles

| Style | Visual | When to Use |
|-------|--------|-------------|
| **Primary** | Green button | Main actions (apply, register, submit) |
| **Secondary** | Gray button | Alternative actions (learn more, view details) |
| **Info** | Blue button | Informational actions (help, what is this?) |

**Visual Hierarchy**: Use one Primary CTA per conversation branch. Secondary and Info CTAs support the primary action.

### Editing a CTA

1. Click the CTA card
2. Click "Edit" button
3. Modify fields
4. Click "Save Changes"

**Note**: Changing the action type will reset action-specific fields. Save important data first.

### Deleting a CTA

1. Click the CTA card
2. Click "Delete" button
3. Review dependencies (branches that use this CTA)
4. Confirm deletion

**Warning**: If a branch references this CTA, deleting it will leave the branch without a working button. Update the branch first.

### CTA Best Practices

1. **Use Action-Oriented Labels**:
   - Good: "Apply Now", "Get Started", "Learn More"
   - Bad: "Click Here", "Submit", "Go"

2. **Keep Labels Short**: 2-4 words is ideal. Long labels get truncated on mobile.

3. **Match Style to Intent**:
   - Primary: Most important action
   - Secondary: Alternative or supplementary actions
   - Info: Exploratory or educational actions

4. **Test Links**: Always verify external links work before deploying.

5. **Use Descriptive IDs**: CTA IDs should indicate their purpose (e.g., `volunteer_apply_cta` not `cta_1`).

---

## 5. Branches Editor

### What are Conversation Branches?

Branches detect keywords in the AI's responses and automatically display relevant CTAs to the user. They help route conversations to appropriate actions.

**Example:**
```
User: "Tell me about volunteering"
Bot: "We have several volunteer opportunities including Love Box,
      Dare to Dream, and Mentorship programs. Each has different
      time commitments and requirements."

[Branch "volunteer_opportunities" detects keywords: "volunteer", "opportunities"]

Displayed CTAs:
[Apply to Volunteer] [View Requirements] [Learn More]
```

### Creating a Branch

**Step-by-Step:**

1. **Navigate to Branches**
   - Click "Branches" in the sidebar

2. **Click "Create Branch"**

3. **Fill in Branch Configuration:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Branch ID** | Unique identifier | `volunteer_opportunities` |
   | **Detection Keywords** | Words/phrases that trigger this branch | volunteer, opportunities, help |
   | **Primary CTA** | Main call-to-action button | volunteer_apply_cta |
   | **Secondary CTAs** | Additional action buttons (max 2) | learn_more_cta, requirements_cta |
   | **Priority** | Order for matching (1=highest) | 1 |

4. **Configure Keywords**
   - Click "Add Keyword"
   - Enter a word or short phrase
   - Add multiple keywords (recommended: 3-8)
   - Keywords are case-insensitive

5. **Select CTAs**
   - **Primary CTA**: Choose from dropdown (required)
   - **Secondary CTAs**: Click "Add Secondary CTA" (optional, max 2)

6. **Set Priority** (optional)
   - Default: 1 (highest)
   - Use lower numbers for more specific branches
   - Use higher numbers for general/catch-all branches

7. **Click "Create Branch"**

### Detection Keywords

Keywords are words or phrases the system looks for in the AI's response to trigger CTAs.

**Guidelines:**

1. **Use Topic-Specific Keywords**
   - Good: "volunteer", "Love Box", "donate", "mentor"
   - Bad: "yes", "no", "help", "please"

2. **Avoid User Intent Keywords**
   - Don't use: "I want", "how do I", "can I"
   - Do use: Program names, services, topics

3. **Include Variations**
   - Example: "volunteer", "volunteering", "volunteers"

4. **Use 3-8 Keywords per Branch**
   - Too few: Branch won't trigger reliably
   - Too many: May trigger on unrelated conversations

**Example Keyword Sets:**

```
Branch: Volunteer Opportunities
Keywords: volunteer, volunteering, volunteer programs, help out, give time

Branch: Love Box Program
Keywords: love box, lovebox, care packages, foster families

Branch: Donations
Keywords: donate, donation, contribute, support, give money
```

### CTA Assignment

**Primary CTA** (required)
- The main action you want users to take
- Displayed prominently (larger, green button)
- Should align with the conversation topic

**Secondary CTAs** (optional, max 2)
- Supporting or alternative actions
- Displayed as smaller buttons below the primary
- Use for "Learn More", "See Requirements", etc.

**CTA Limit**: Maximum 3 total CTAs per branch (1 primary + 2 secondary)

**Why Limit CTAs?**
- Too many choices overwhelm users
- Mobile screens have limited space
- Focus users on the most important action

### Priority System

Branches are checked in priority order (lowest number first). When multiple branches match, the highest priority wins.

**Priority Best Practices:**

1. **Specific Topics**: Priority 1-3
   - Example: "Love Box Program" (priority 1)

2. **General Topics**: Priority 4-7
   - Example: "Volunteer Opportunities" (priority 5)

3. **Catch-All Branches**: Priority 8-10
   - Example: "General Help" (priority 10)

**Example Priority Hierarchy:**
```
Priority 1: love_box_program (keywords: love box, lovebox)
Priority 2: dare_to_dream (keywords: dare to dream, mentorship)
Priority 5: volunteer_general (keywords: volunteer, help)
Priority 10: contact_us (keywords: contact, reach, speak)
```

If a conversation mentions "Love Box", priority 1 matches first and those CTAs are shown—even though "volunteer_general" might also match.

### Editing a Branch

1. Click the branch card
2. Click "Edit" button
3. Modify configuration
4. Click "Save Changes"

**Tip**: When changing keywords, test in staging to ensure branches still trigger correctly.

### Deleting a Branch

1. Click the branch card
2. Click "Delete" button
3. Confirm deletion

**No Dependencies**: Branches don't have dependencies—they're leaf nodes in the config. Safe to delete anytime.

### Branch Best Practices

1. **Test Keyword Matching**:
   - Have conversations that should trigger the branch
   - Verify CTAs appear correctly
   - Adjust keywords if branches don't trigger as expected

2. **Avoid Keyword Overlap**:
   - Don't create branches with identical keywords
   - Use priority to handle partial overlaps

3. **Start General, Then Specialize**:
   - Create broad branches first (e.g., "volunteer_general")
   - Add specific branches later (e.g., "love_box_program")
   - Use priority to favor specific over general

4. **Limit CTAs**:
   - 1-2 CTAs is usually sufficient
   - Primary CTA should be the obvious next step
   - Secondary CTAs provide alternatives

5. **Use Descriptive IDs**:
   - Good: `volunteer_opportunities_branch`
   - Bad: `branch_1`

---

## 6. Content Showcase Editor

### What is Content Showcase?

Content Showcase displays rich visual cards in chat conversations to highlight programs, events, campaigns, or initiatives. Think of it as an "ad system" for your content.

**Showcase Card Components:**
- Name and tagline
- Description
- Image (optional)
- Stats or metrics
- Testimonial (optional)
- Highlights (bullet points)
- Call-to-action button

**Example Showcase Card:**
```
╔════════════════════════════════════════╗
║ [Image: Love Box volunteers packing]  ║
║                                        ║
║ Love Box                               ║
║ Support foster families with love      ║
║                                        ║
║ Pack monthly care boxes for foster     ║
║ families. A meaningful way to make a   ║
║ direct impact in children's lives.     ║
║                                        ║
║ ⏱ 2-3 hours/month                      ║
║ 💬 "Best experience!" - Sarah M.       ║
║                                        ║
║ ✓ Flexible schedule                    ║
║ ✓ Monthly commitment                   ║
║ ✓ Family-friendly activity             ║
║                                        ║
║        [Apply for Love Box]            ║
╚════════════════════════════════════════╝
```

### Creating a Showcase Item

**Step-by-Step:**

1. **Navigate to Content Showcase**
   - Click "Content Showcase" in the sidebar

2. **Click "Create Showcase Item"**

3. **Fill in Basic Information:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Item ID** | Unique identifier | `love_box_showcase` |
   | **Type** | Category | Program, Event, Initiative, Campaign |
   | **Enabled** | Toggle to show/hide | ✓ |
   | **Name** | Title shown on card | `Love Box` |
   | **Tagline** | Brief subtitle | `Support foster families with love` |
   | **Description** | Full description | `Pack monthly care boxes...` |
   | **Image URL** | Card image (optional) | `https://cdn.myorg.org/lovebox.jpg` |

4. **Add Supporting Details:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Stats** | Quick metric or fact | `2-3 hours/month` |
   | **Testimonial** | User quote (optional) | `"Best experience!" - Sarah M.` |
   | **Highlights** | Bullet points (up to 5) | Flexible schedule, Monthly commitment |

5. **Configure Targeting:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Keywords** | Triggers for showing this card | love box, foster, care packages |

6. **Set Up Action:**

   You can configure one of three action types:

   | Action Type | Description | Configuration |
   |-------------|-------------|---------------|
   | **Link to CTA** | Use an existing CTA | Select CTA from dropdown |
   | **External URL** | Direct link to a webpage | Enter URL, choose "open in new tab" |
   | **Send Prompt** | Send a question to the AI | Enter prompt text |

7. **Click "Create Showcase Item"**

### Showcase Item Types

| Type | Best For | Examples |
|------|----------|----------|
| **Program** | Ongoing opportunities | Volunteer programs, membership |
| **Event** | Time-bound activities | Fundraisers, workshops, galas |
| **Initiative** | Organizational efforts | Campaigns, drives, projects |
| **Campaign** | Marketing/awareness | Annual appeals, awareness months |

**Type determines the visual presentation** (icons, colors) in some chat widget themes.

### Targeting with Keywords

Keywords determine when the showcase card appears in conversations.

**How It Works:**
1. User asks a question
2. AI generates a response
3. System scans AI response for keywords
4. If keywords match, showcase card is displayed
5. Only one showcase card shown per response (highest priority)

**Keyword Strategy:**

1. **Use 3-7 keywords per item**
   - More keywords = more opportunities to match
   - But keep them relevant to avoid wrong triggers

2. **Include variations**
   - "love box", "lovebox", "care packages", "foster families"

3. **Balance specificity and reach**
   - Specific: "love box program" (only triggers for this exact program)
   - General: "volunteer" (triggers for many conversations)

**Example:**
```
Showcase: Love Box Program
Keywords: love box, lovebox, care packages, foster families, monthly boxes

When shown:
User: "Tell me about the Love Box program"
AI: "The Love Box program helps support foster families by..."
[Love Box Showcase Card Appears]
```

### Images

**Image Guidelines:**

1. **Format**: JPG or PNG
2. **Size**: 1200x630px (2:1 aspect ratio) recommended
3. **File Size**: Under 500KB for fast loading
4. **Hosting**: Use a CDN or S3 bucket
5. **URL**: Must be publicly accessible (https://)

**Good Images:**
- High quality (not blurry)
- Relevant to the content
- Shows people engaged in the activity
- Good contrast and visibility

**Accessibility**: Add alt text in the image hosting platform for screen readers.

### Highlights

Highlights are bullet points that emphasize key features or benefits.

**Guidelines:**
- Use 2-5 highlights per card
- Keep each highlight short (2-6 words)
- Focus on benefits, not features
- Use parallel structure

**Good Highlights:**
- ✓ Flexible schedule
- ✓ No experience required
- ✓ Family-friendly activity
- ✓ Monthly commitment
- ✓ Makes a direct impact

**Bad Highlights:**
- ✗ "This program is flexible"
- ✗ "You don't need experience to join"
- ✗ "The program happens every month"

### Showcase Actions

#### Link to CTA
Use when you want the showcase card to trigger an existing CTA.

**Configuration:**
- Select CTA from dropdown
- Button will use CTA's label and action

**Example:**
```
Action Type: Link to CTA
CTA: volunteer_apply_cta
Result: [Apply to Volunteer] button triggers the volunteer application form
```

#### External URL
Use when you want to link directly to a webpage.

**Configuration:**
- Enter full URL (including https://)
- Choose whether to open in new tab (recommended: yes)
- Enter button label

**Example:**
```
Action Type: External URL
URL: https://www.myorg.org/love-box
Label: Learn More
Open in New Tab: ✓
```

#### Send Prompt
Use when you want clicking the button to ask the AI a follow-up question.

**Configuration:**
- Enter the prompt/question to send
- Enter button label

**Example:**
```
Action Type: Send Prompt
Prompt: "What are the requirements for the Love Box program?"
Label: View Requirements
```

### Editing a Showcase Item

1. Click the showcase card
2. Click "Edit" button
3. Modify fields
4. Click "Save Changes"

### Deleting a Showcase Item

1. Click the showcase card
2. Click "Delete" button
3. Confirm deletion

**No Dependencies**: Showcase items don't have dependencies. Safe to delete anytime.

### Disabling vs. Deleting

**Disable** (recommended for temporary removal):
- Uncheck "Enabled" checkbox
- Item stays in config but won't be shown
- Easy to re-enable later

**Delete** (permanent removal):
- Removes item from config entirely
- Can't be recovered (unless you have a backup)

### Showcase Best Practices

1. **Limit Active Showcases**:
   - Keep 5-10 active showcase items
   - Too many creates noise
   - Rotate seasonally or by campaign

2. **Use High-Quality Images**:
   - Invest in good photography
   - Show real people and activities
   - Ensure images load quickly

3. **Write Compelling Taglines**:
   - One sentence, benefit-focused
   - Answer "Why should I care?"

4. **Test Keyword Matching**:
   - Have conversations that should trigger the showcase
   - Verify cards appear at the right time
   - Adjust keywords if needed

5. **Update Regularly**:
   - Refresh content for current campaigns
   - Disable outdated events
   - Keep stats and testimonials current

6. **A/B Test**:
   - Try different images, taglines, highlights
   - Track which showcases get the most clicks
   - Optimize based on performance

---

## 7. Understanding Validation

The Config Builder validates your configuration in real-time to prevent errors before deployment.

### Validation Levels

| Level | Icon | Color | Meaning |
|-------|------|-------|---------|
| **Error** | ❌ | Red | Blocks deployment. Must be fixed. |
| **Warning** | ⚠️ | Yellow | Doesn't block deployment, but review recommended. |
| **Info** | ℹ️ | Blue | Informational, no action needed. |

### Where Validation Appears

1. **Inline Validation**:
   - Red borders on fields with errors
   - Error messages directly under fields
   - Appears as you type

2. **Validation Panel**:
   - Bottom of the screen
   - Shows all errors and warnings
   - Click an issue to navigate to its location

3. **Deploy Dialog**:
   - Pre-deployment check
   - Blocks deployment if errors exist
   - Lists all issues before confirming

### Common Validation Rules

#### Programs

| Rule | Type | Message |
|------|------|---------|
| Unique ID | Error | Program ID must be unique |
| Valid ID format | Error | Use lowercase letters, numbers, underscores only |
| Name required | Error | Program name is required |

#### Forms

| Rule | Type | Message |
|------|------|---------|
| Program reference exists | Error | Form references non-existent program |
| At least one field | Error | Form must have at least one field |
| Field IDs unique | Error | Field IDs must be unique within form |
| Required field labels | Error | All fields must have labels and prompts |
| Select field has options | Error | Select fields must have at least 2 options |
| Eligibility gate has failure message | Error | Eligibility gates must have failure messages |
| Missing trigger phrases | Warning | Consider adding trigger phrases for better UX |
| Long form (>10 fields) | Warning | Forms with many fields have higher abandonment |

#### CTAs

| Rule | Type | Message |
|------|------|---------|
| Action configuration complete | Error | CTA action requires additional configuration |
| Start Form: form exists | Error | Referenced form does not exist |
| External Link: valid URL | Error | URL must be valid and start with https:// |
| Send Query: query provided | Error | Query text is required |
| Show Info: prompt provided | Error | Prompt text is required |
| Duplicate labels | Warning | Multiple CTAs have the same label (confusing for users) |

#### Branches

| Rule | Type | Message |
|------|------|---------|
| At least one keyword | Error | Branch must have at least one detection keyword |
| Primary CTA exists | Error | Referenced CTA does not exist |
| Secondary CTAs exist | Error | Referenced CTA does not exist |
| Max 3 CTAs total | Warning | Branches should have max 3 CTAs (1 primary + 2 secondary) |
| User query keywords | Warning | Keywords like "I want" or "how do I" should be avoided |

#### Relationships

| Rule | Type | Message |
|------|------|---------|
| Orphaned CTAs | Warning | CTA is not used by any branch |
| Orphaned forms | Warning | Form has no trigger phrases and no CTAs referencing it |
| Missing programs | Error | Configuration has forms but no programs |

### How to Fix Validation Errors

**Step-by-Step:**

1. **Open Validation Panel**
   - Click the validation indicator at bottom of screen
   - Or errors will auto-expand when present

2. **Review Errors First**
   - Errors (red) block deployment
   - Warnings (yellow) are informational

3. **Click an Error**
   - System navigates to the editor with that entity
   - The problematic field is highlighted

4. **Fix the Issue**
   - Edit the field as needed
   - Save the entity

5. **Verify Fix**
   - Validation re-runs automatically
   - Error should disappear from panel

6. **Repeat for All Errors**

7. **Review Warnings (Optional)**
   - Warnings don't block deployment
   - But fixing them improves quality

**Example Error Resolution:**

```
Error: "Form 'volunteer_application' references non-existent program 'volunteers'"

Steps to fix:
1. Click the error in validation panel
2. Opens Form Editor for 'volunteer_application'
3. Change Program dropdown from 'volunteers' to 'volunteer_programs'
4. Save form
5. Error disappears
```

### Validation Best Practices

1. **Fix Errors Before Deploying**
   - Never deploy with errors
   - Errors indicate broken functionality

2. **Consider Warnings Seriously**
   - While not blocking, warnings indicate potential issues
   - Fix warnings when possible

3. **Test After Fixing**
   - After resolving validation issues, test the configuration
   - Ensure fixes didn't break other parts

4. **Understand Why Rules Exist**
   - Each rule protects against a real problem
   - If a rule seems wrong, ask before ignoring

---

## 8. Deploying Configurations

### Pre-Deployment Checklist

Before deploying, verify:

- [ ] All validation errors resolved (red errors)
- [ ] Critical warnings addressed (yellow warnings)
- [ ] Forms tested in draft mode (if available)
- [ ] CTAs link to correct destinations
- [ ] Branch keywords trigger appropriately
- [ ] Backup of current configuration exists

**Pro Tip**: Deploy to a staging tenant first if possible.

### Deployment Process

**Step-by-Step:**

1. **Click "Deploy" Button**
   - Located in the top-right header
   - Only enabled when no errors exist

2. **Review Deployment Summary**
   - Dialog shows what will be deployed:
     - Number of programs
     - Number of forms
     - Number of CTAs
     - Number of branches
     - Number of showcase items
   - Any warnings are listed

3. **Confirm Deployment**
   - Click "Deploy to S3"
   - Progress indicator appears

4. **Wait for Completion**
   - Takes 5-15 seconds typically
   - Don't close browser during deployment

5. **Verify Success**
   - Success message appears
   - Dialog auto-closes after 2 seconds

6. **Test in Picasso Widget**
   - Open your Picasso chat widget
   - May need to clear cache or hard refresh
   - Verify changes appear correctly

### What Happens During Deployment

1. **Validation Check**
   - Pre-deployment validation runs
   - Deployment blocked if errors found

2. **Configuration Merge**
   - Your edits (programs, forms, CTAs, branches) are merged
   - Read-only sections (branding, AWS config) are preserved
   - Version number is incremented
   - Generated timestamp is updated

3. **S3 Upload**
   - Merged configuration uploaded to S3
   - Overwrites existing configuration file
   - S3 path: `myrecruiter-picasso/configs/<tenant_id>-config.json`

4. **Cache Invalidation**
   - Picasso widget checks for new config on next load
   - Lambda caches are refreshed (5-minute TTL)

### Deployment Failures

**Common Failure Reasons:**

1. **S3 Permission Issues**
   - Error: "Access Denied" or "Forbidden"
   - Fix: Contact administrator to verify AWS credentials

2. **Network Timeout**
   - Error: "Request timed out"
   - Fix: Check internet connection, try again

3. **Validation Errors**
   - Error: "Configuration has validation errors"
   - Fix: Review validation panel, fix errors

4. **Invalid Configuration Structure**
   - Error: "Invalid config format"
   - Fix: Contact support (this shouldn't happen)

**If Deployment Fails:**

1. **Read the Error Message**
   - Error messages indicate the specific problem

2. **Fix the Issue**
   - Follow guidance in the error message

3. **Try Again**
   - Click "Deploy" again after fixing

4. **Contact Support (if needed)**
   - Provide:
     - Error message text
     - Tenant ID
     - Timestamp of failure

### Rollback Procedure

If you deploy changes that cause problems:

**Option 1: S3 Versioning (Recommended)**
1. Log into AWS Console
2. Navigate to S3 bucket: `myrecruiter-picasso`
3. Find your config file: `configs/<tenant_id>-config.json`
4. Click "Versions" tab
5. Find previous version (before your deployment)
6. Click "Restore"

**Option 2: Re-deploy Previous Configuration**
1. If you have a local backup of the previous config
2. Load it into the Config Builder
3. Deploy to overwrite the problematic version

**Option 3: Emergency Contact**
- Contact your administrator immediately
- They can restore from automated backups

### Post-Deployment Testing

**Critical Tests:**

1. **Forms Test**
   - Open Picasso widget
   - Trigger each form you edited
   - Complete the form to verify submission works

2. **CTAs Test**
   - Navigate conversations that should show CTAs
   - Click each CTA to verify it works
   - Check that links open correctly

3. **Branches Test**
   - Have conversations using branch keywords
   - Verify correct CTAs appear
   - Test priority ordering

4. **Showcase Test**
   - Trigger showcase items via keywords
   - Verify cards display correctly
   - Test showcase actions

**Testing Timeline:**
- Immediate: Forms, CTAs, basic functionality (5 minutes)
- Within 1 hour: Full conversation flows
- Within 24 hours: Monitor for user reports

### Deployment Best Practices

1. **Deploy During Low-Traffic Periods**
   - Evenings or weekends
   - Avoid peak usage times

2. **Deploy Small Changes Frequently**
   - Easier to identify problems
   - Easier to rollback
   - Less risky than large batch changes

3. **Test in Staging First**
   - If you have a staging tenant, use it
   - Catch issues before production

4. **Document Your Changes**
   - Keep a changelog of what you deployed
   - Helps troubleshoot issues later

5. **Monitor After Deployment**
   - Check for user reports
   - Review analytics for drop-offs
   - Watch for error logs

6. **Have a Rollback Plan**
   - Know how to rollback before deploying
   - Keep backups of working configurations

---

## 9. Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot load tenant configuration"

**Symptoms:**
- Error message when selecting tenant
- Empty editors
- Loading spinner doesn't stop

**Possible Causes:**
1. S3 permissions issue
2. Network connectivity problem
3. Invalid tenant ID
4. Configuration file corrupted

**Solutions:**
1. Verify you have correct AWS credentials
2. Check internet connection
3. Confirm tenant ID is correct
4. Contact administrator to check S3 file integrity

---

#### Issue: "Deploy button is disabled"

**Symptoms:**
- Cannot click Deploy button
- Button is grayed out

**Possible Causes:**
1. Validation errors exist
2. No changes made
3. Already deploying

**Solutions:**
1. Open validation panel (bottom of screen)
2. Fix all errors (red items)
3. If no errors but still disabled, refresh page
4. Wait for in-progress deployment to complete

---

#### Issue: "Form doesn't appear in Picasso widget"

**Symptoms:**
- Deployed form but it doesn't trigger
- Users can't start the form

**Possible Causes:**
1. Form is disabled (enabled = false)
2. No trigger phrases configured
3. No CTAs referencing the form
4. Form validation errors
5. Cache not cleared

**Solutions:**
1. Check form "Enabled" checkbox is checked
2. Add trigger phrases to the form
3. Create a CTA with action "Start Form" referencing this form
4. Fix any validation errors
5. Hard refresh Picasso widget (Ctrl+Shift+R)

---

#### Issue: "Validation error: Program reference not found"

**Symptoms:**
- Cannot save form
- Error: "Form references non-existent program"

**Possible Causes:**
1. Program was deleted
2. Program ID was changed
3. Wrong program selected

**Solutions:**
1. Create the missing program
2. Change form to reference an existing program
3. Check program ID spelling

---

#### Issue: "CTA doesn't show in conversation"

**Symptoms:**
- Branch configured but CTAs don't appear

**Possible Causes:**
1. Branch keywords don't match conversation
2. Branch disabled
3. CTA referenced doesn't exist
4. Priority issue (another branch takes precedence)

**Solutions:**
1. Test keywords by having conversations that should trigger them
2. Check branch is enabled
3. Verify CTA IDs are correct
4. Review branch priorities

---

#### Issue: "Deployment succeeded but changes don't appear"

**Symptoms:**
- Deploy shows success
- But Picasso widget shows old configuration

**Possible Causes:**
1. Browser cache
2. Lambda cache (5-minute TTL)
3. CloudFront cache
4. Widget embedded on different page

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Wait 5-10 minutes for Lambda cache to expire
3. Clear browser cache
4. Verify widget is loading from correct tenant
5. Check widget deployment timestamp

---

#### Issue: "Showcase card doesn't appear"

**Symptoms:**
- Created showcase item but it never shows

**Possible Causes:**
1. Showcase item disabled
2. Keywords don't match conversation
3. Image URL broken (card hidden)
4. Another showcase has higher priority

**Solutions:**
1. Check "Enabled" is checked
2. Test keywords in actual conversations
3. Verify image URL is accessible (open in browser)
4. Review showcase priority (first match wins)

---

#### Issue: "Cannot delete program/form/CTA"

**Symptoms:**
- Delete button doesn't work
- Dependency warning appears

**Possible Causes:**
1. Entity has dependencies
2. Other entities reference it

**Solutions:**
1. Read the dependency warning carefully
2. Delete or update dependent entities first
3. Then delete the target entity
4. Or choose to keep the entity if dependencies are critical

---

### Error Messages Explained

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| "Access Denied" | No S3 permissions | Contact administrator for AWS credentials |
| "Validation failed" | Configuration has errors | Open validation panel and fix errors |
| "Network error" | Internet connectivity issue | Check network, try again |
| "Configuration too large" | Config exceeds size limit | Reduce forms, CTAs, or showcase items |
| "Invalid JSON" | Configuration corrupted | Contact support, may need restore |
| "Missing required field" | Required field is empty | Fill in all required fields |
| "Duplicate ID" | ID already exists | Use a unique ID |
| "Reference not found" | Entity references non-existent entity | Fix or create the referenced entity |

### Getting Help

**Before Contacting Support:**

1. Check this troubleshooting section
2. Review validation panel for clues
3. Try a hard refresh (Ctrl+Shift+R)
4. Check browser console for errors (F12 → Console tab)

**When Contacting Support, Provide:**

- Tenant ID
- Description of the issue
- Steps to reproduce
- Error message (exact text)
- Screenshot (if applicable)
- Browser and version
- Timestamp of when issue occurred

**Support Channels:**
- Email: support@yourorg.com
- Slack: #picasso-config-builder
- Phone: (555) 123-4567 (emergencies only)

---

## 10. Best Practices

### General Configuration Practices

1. **Start Simple, Iterate**
   - Begin with basic configurations
   - Add complexity gradually
   - Test each addition before moving on

2. **Use Consistent Naming**
   - Follow a naming convention for IDs
   - Example: `<entity_type>_<descriptor>` like `form_volunteer_application`
   - Makes configurations easier to understand

3. **Document Your Choices**
   - Keep notes on why you configured things a certain way
   - Helps future you (or teammates) understand decisions

4. **Test, Test, Test**
   - Always test configurations before deploying
   - Have someone else test if possible
   - Test on different devices (desktop, mobile)

5. **Monitor After Deployment**
   - Check analytics for form completion rates
   - Look for user drop-offs
   - Gather feedback from users

6. **Regular Maintenance**
   - Review configurations quarterly
   - Remove outdated forms, CTAs, showcases
   - Update content to stay current

### Form Design Best Practices

1. **Question Order Matters**
   - Start with easy questions (name)
   - Save sensitive questions for later (phone, email)
   - End with open-ended questions (comments)

2. **Use Hints Liberally**
   - Help users understand what's expected
   - Reduce form abandonment
   - Clarify formats (phone: xxx-xxx-xxxx)

3. **Eligibility Gates Early**
   - Don't waste user time
   - If there are requirements, check early
   - Be clear about why they're ineligible

4. **Confirmation Messages Matter**
   - Thank users genuinely
   - Set expectations (when will they hear back?)
   - Provide next steps

5. **Test Real Scenarios**
   - Fill out your forms as if you were a user
   - Try to break them (invalid inputs, skipping fields)
   - Fix issues before deployment

### CTA Design Best Practices

1. **Action-Oriented Language**
   - Use verbs: Apply, Register, Learn, Donate
   - Be specific: "Apply for Love Box" not "Click Here"

2. **Visual Hierarchy**
   - One primary CTA per branch
   - Use secondary for alternatives
   - Don't overwhelm with choices

3. **Test Links**
   - Click every external link before deploying
   - Verify they go to the correct page
   - Check links work on mobile

4. **Match User Intent**
   - CTAs should align with conversation topic
   - Don't show donation CTAs in volunteer conversations
   - Use branches to target CTAs correctly

### Branch Configuration Best Practices

1. **Specific Before General**
   - Use priority to favor specific branches
   - Example: "Love Box" (priority 1) before "Volunteer" (priority 5)

2. **Test Keyword Matching**
   - Have real conversations
   - See if branches trigger correctly
   - Adjust keywords based on results

3. **Avoid Keyword Overlap**
   - Different branches should have distinct keywords
   - Use priority when overlap is necessary

4. **Limit CTAs**
   - 1-3 CTAs is optimal
   - More than 3 overwhelms users

### Showcase Best Practices

1. **Rotate Content**
   - Update showcases seasonally
   - Highlight current campaigns
   - Disable outdated content

2. **High-Quality Images**
   - Professional photography
   - Shows real people and activities
   - Fast-loading (under 500KB)

3. **Compelling Copy**
   - Short, benefit-focused
   - Answers "Why should I care?"
   - Use testimonials when possible

4. **Monitor Performance**
   - Track which showcases get clicks
   - A/B test different versions
   - Optimize based on data

### Deployment Best Practices

1. **Staging First**
   - Test in staging before production
   - Catch issues before users see them

2. **Small, Frequent Deploys**
   - Easier to troubleshoot
   - Less risky
   - Faster to rollback if needed

3. **Off-Peak Deployments**
   - Deploy when users are less active
   - Reduces impact of issues

4. **Have a Rollback Plan**
   - Know how to revert changes
   - Keep backups of working configs
   - Document rollback procedure

5. **Monitor After Deployment**
   - Watch for user reports
   - Check analytics
   - Review error logs

### Validation Best Practices

1. **Fix Errors Immediately**
   - Don't ignore validation errors
   - They indicate real problems
   - Fix before deploying

2. **Consider Warnings**
   - Warnings aren't blocking but important
   - They improve configuration quality
   - Fix when possible

3. **Understand Rules**
   - Know why each rule exists
   - Don't try to circumvent them
   - If a rule seems wrong, ask

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save current entity (in editor) |
| `Ctrl + D` | Deploy configuration |
| `Esc` | Close current dialog |
| `Ctrl + K` | Open command palette (future feature) |

---

## Appendix B: Configuration Limits

| Entity | Limit | Reason |
|--------|-------|--------|
| Programs | 50 | Performance |
| Forms per tenant | 100 | Performance |
| Fields per form | 20 | UX (forms too long) |
| CTAs per tenant | 200 | Performance |
| Branches per tenant | 100 | Performance |
| CTAs per branch | 3 | UX (choice overload) |
| Showcase items (active) | 20 | Performance |
| Keywords per branch | 20 | Performance |
| Trigger phrases per form | 20 | Performance |

---

## Appendix C: Configuration Checklist

Use this checklist before deploying a new tenant configuration:

### Programs
- [ ] All programs have unique IDs
- [ ] Program names are clear and descriptive
- [ ] Programs align with organization structure

### Forms
- [ ] All forms assigned to programs
- [ ] Each form has 3+ trigger phrases
- [ ] Required fields are truly required
- [ ] Eligibility gates have failure messages
- [ ] Post-submission messages are complete
- [ ] Fulfillment is configured (email, webhook, etc.)
- [ ] Forms tested end-to-end

### CTAs
- [ ] All CTAs have action-oriented labels
- [ ] External links are valid and tested
- [ ] Form CTAs reference existing forms
- [ ] CTA styles match their purpose

### Branches
- [ ] Each branch has 3+ keywords
- [ ] Keywords are topic-specific (not user intents)
- [ ] Primary CTA is configured
- [ ] Priorities are set correctly
- [ ] Branches tested in conversations

### Showcase
- [ ] Active showcase items ≤ 10
- [ ] All images are accessible and fast-loading
- [ ] Keywords target appropriate conversations
- [ ] Actions are configured correctly
- [ ] Showcase items tested

### Validation
- [ ] Zero validation errors
- [ ] Critical warnings addressed
- [ ] Relationships verified (programs, forms, CTAs)

### Deployment
- [ ] Tested in staging (if available)
- [ ] Backup of current config exists
- [ ] Deployment time is off-peak
- [ ] Rollback plan documented

### Post-Deployment
- [ ] Changes verified in Picasso widget
- [ ] Forms tested end-to-end
- [ ] CTAs clicked and verified
- [ ] Showcase cards trigger correctly
- [ ] Users notified of changes (if needed)

---

## Appendix D: Glossary

**Branch**: A configuration that detects keywords in AI responses and displays relevant CTAs.

**CTA (Call-to-Action)**: A button that appears in chat to guide users to take a specific action.

**Config Builder**: This web application for managing tenant configurations.

**Conversational Form**: A form that collects information through a question-by-question conversation.

**Deployment**: The process of uploading configuration changes to S3.

**Eligibility Gate**: A form field that determines if a user can continue (e.g., age requirement).

**Entity**: A configuration item (program, form, CTA, branch, showcase).

**Field**: A single question in a conversational form.

**Fulfillment**: How form data is sent after submission (email, webhook, database).

**Keyword**: A word or phrase that triggers a branch or showcase item.

**Picasso Widget**: The chat widget that consumes configurations.

**Primary CTA**: The main call-to-action button in a branch (displayed prominently).

**Priority**: The order branches are checked (lower number = higher priority).

**Program**: An organizational unit that forms can be assigned to.

**S3**: AWS storage service where configurations are stored.

**Secondary CTA**: Additional call-to-action buttons in a branch (supporting actions).

**Showcase**: Rich visual cards that highlight programs, events, or campaigns.

**Tenant**: An organization using the Picasso chat widget.

**Trigger Phrase**: A phrase that starts a conversational form when users type it.

**Validation**: Checking configuration for errors before deployment.

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-19 | Initial user guide created |

---

**Questions or Feedback?**

If you have questions about this user guide or the Config Builder, please contact:
- Support Email: support@yourorg.com
- Documentation Feedback: docs@yourorg.com

**Last Updated**: October 19, 2025
