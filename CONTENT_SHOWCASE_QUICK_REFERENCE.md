# Content Showcase Quick Reference

## For Developers

### Import the Editor
```typescript
import { ContentShowcaseEditor } from '@/components/editors/ShowcaseEditor';
```

### Access Store
```typescript
import { useConfigStore } from '@/store';

// Get all showcase items
const items = useConfigStore((state) => state.contentShowcase.content_showcase);

// Get specific item
const item = useConfigStore((state) =>
  state.contentShowcase.getShowcaseItem('item_id')
);

// Create item
const createItem = useConfigStore((state) =>
  state.contentShowcase.createShowcaseItem
);

// Update item
const updateItem = useConfigStore((state) =>
  state.contentShowcase.updateShowcaseItem
);

// Delete item
const deleteItem = useConfigStore((state) =>
  state.contentShowcase.deleteShowcaseItem
);
```

### Type Definitions
```typescript
import type { ShowcaseItem, ShowcaseItemType } from '@/types/config';

const item: ShowcaseItem = {
  id: 'my_program',
  type: 'program',
  enabled: true,
  name: 'My Program',
  tagline: 'Short tagline',
  description: 'Longer description...',
  keywords: ['keyword1', 'keyword2'],
  // Optional fields
  image_url: 'https://...',
  stats: '2-3 hours/month',
  testimonial: 'Great program!',
  highlights: ['Point 1', 'Point 2'],
  cta_id: 'apply_btn',
};
```

### Validation
```typescript
import { validateShowcaseItem } from '@/lib/validation/showcaseValidators';

const errors = validateShowcaseItem(item, {
  isEditMode: false,
  existingIds: ['existing_id_1'],
  existingEntities: {},
  availableCtaIds: ['cta_1', 'cta_2'],
});
```

## For Users

### Creating a Showcase Item

1. **Navigate**: Go to Cards page
2. **Open Form**: Click "Add Showcase Item" button
3. **Required Fields**:
   - ID: Unique identifier (e.g., `volunteer_program`)
   - Type: Select from Program, Event, Initiative, Campaign
   - Name: Display name (e.g., "Community Volunteer Program")
   - Tagline: Short catchy phrase
   - Description: Full description
   - Keywords: Add at least 1 keyword (press Enter or +)
4. **Optional Fields**:
   - Image URL: Link to image
   - Stats: Time commitment or other stat
   - Testimonial: Quote from participant
   - Highlights: Bullet points (press Enter or +)
   - Linked CTA: Connect to existing CTA button
5. **Toggle**: Enable/disable the item
6. **Save**: Click Save button

### Editing a Showcase Item

1. Find the item card in the list
2. Click Edit button
3. Modify fields (ID cannot be changed)
4. Click Save

### Deleting a Showcase Item

1. Find the item card
2. Click Delete button
3. Confirm deletion in modal

### Keyboard Shortcuts

- **Tab**: Move between fields
- **Enter**: Add keyword/highlight when focused on input
- **Escape**: Close modal

## Field Descriptions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| ID | Yes | String | Unique identifier (letters, numbers, -, _) |
| Type | Yes | Select | program, event, initiative, campaign |
| Enabled | Yes | Boolean | Toggle to enable/disable item |
| Name | Yes | String | Display name shown to users |
| Tagline | Yes | String | Short, catchy phrase |
| Description | Yes | Text | Full description of the item |
| Image URL | No | URL | Link to promotional image |
| Stats | No | String | e.g., "2-3 hours/month" |
| Testimonial | No | Text | Quote or review |
| Highlights | No | Array | Bullet points of key features |
| Keywords | Yes | Array | Trigger words (minimum 1) |
| Linked CTA | No | Select | Connect to existing CTA |

## Type Icons

- 📚 **Program**: Long-term programs
- 📅 **Event**: One-time or recurring events
- 🎯 **Initiative**: Targeted campaigns or initiatives
- 📢 **Campaign**: Marketing campaigns

## Best Practices

### Naming
- Use clear, descriptive IDs: `volunteer_tutoring_program`
- Keep names under 50 characters
- Make taglines catchy but brief (5-10 words)

### Keywords
- Include variations: "volunteer", "volunteering", "help"
- Use common search terms
- Add 3-5 keywords per item
- Think about user intent

### Highlights
- Keep to 3-5 points
- Start with action words
- Be specific: "Free training provided" not "Training"

### Descriptions
- First sentence is most important (shown in preview)
- Include who, what, when, where, why
- Keep under 200 words for scannability

### Testimonials
- Include name or initials: "- Sarah M."
- Keep quotes short and impactful
- Verify permissions before using

### Images
- Use HTTPS URLs only
- Recommended size: 800x600px
- Ensure you have rights to use
- Test URL loads correctly

### CTA Linking
- Link to relevant forms or actions
- Test the CTA works before linking
- Use clear CTA labels: "Apply Now" not "Click Here"

## Common Use Cases

### Program Showcase
```
Type: program
Name: Youth Mentorship Program
Tagline: Shape a young person's future
Keywords: mentor, youth, tutor, guide
Highlights:
- Weekly 1-hour sessions
- Full training provided
- Flexible scheduling
Stats: 1-2 hours/week
CTA: apply_mentor_form
```

### Event Showcase
```
Type: event
Name: Annual Community Cleanup
Tagline: Keep our neighborhoods beautiful
Keywords: cleanup, volunteer, environment, event
Highlights:
- Supplies provided
- All ages welcome
- Free lunch included
Stats: Saturday, May 15th
CTA: register_event_btn
```

### Initiative Showcase
```
Type: initiative
Name: Food Bank Drive
Tagline: Fighting hunger together
Keywords: food, donate, hunger, charity
Highlights:
- Drop-off locations available
- Tax-deductible donations
- Every dollar helps
Stats: Running through December
CTA: donate_food_btn
```

### Campaign Showcase
```
Type: campaign
Name: Summer Reading Challenge
Tagline: Read your way to prizes
Keywords: reading, books, summer, kids
Highlights:
- Win prizes for reading
- Track progress online
- Free to join
Stats: June 1 - August 31
CTA: join_challenge_btn
```

## Troubleshooting

### "At least one keyword required"
→ Add a keyword by typing and pressing Enter

### "Must be a valid URL"
→ Image URL must start with http:// or https://

### "A showcase item with this ID already exists"
→ Choose a different ID

### CTA dropdown is empty
→ Create CTAs first in the CTAs editor

### Changes not saving
→ Check for validation errors (red text)

### Card not showing
→ Check if item is enabled (toggle should be on)

## Related Documentation

- [Full Implementation Summary](./CONTENT_SHOWCASE_IMPLEMENTATION.md)
- [Test Plan](./CONTENT_SHOWCASE_TEST_PLAN.md)
- [Sprint Plan](./Picasso/docs/SPRINT_PLAN.md)
- [Tenant Config Schema](./Picasso/docs/TENANT_CONFIG_SCHEMA.md)

## Support

For issues or questions:
1. Check this quick reference
2. Review implementation docs
3. Check browser console for errors
4. Verify TypeScript compilation
5. Contact development team
