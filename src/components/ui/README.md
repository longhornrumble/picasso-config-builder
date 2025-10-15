# UI Component Library

A comprehensive collection of reusable, accessible UI components for the Picasso Config Builder. Built with React, TypeScript, Radix UI primitives, and Tailwind CSS.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Components](#components)
  - [Button](#button)
  - [Input](#input)
  - [Select](#select)
  - [Card](#card)
  - [Badge](#badge)
  - [Alert](#alert)
  - [Modal](#modal)
  - [Tabs](#tabs)
  - [Tooltip](#tooltip)
  - [Spinner](#spinner)
- [Design System](#design-system)
- [Accessibility](#accessibility)
- [Performance](#performance)

## Installation

All components are already installed as part of the Picasso Config Builder project. Simply import them from the components directory:

```tsx
import { Button, Input, Card } from '@/components/ui';
```

## Usage

### Basic Example

```tsx
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

function MyForm() {
  const [name, setName] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <Button onClick={handleSubmit}>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Button

Versatile button component with multiple variants, sizes, and loading states.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'outline' \| 'ghost' \| 'link'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `leftIcon` | `ReactNode` | - | Icon before text |
| `rightIcon` | `ReactNode` | - | Icon after text |
| `disabled` | `boolean` | `false` | Disable the button |

#### Examples

```tsx
// Primary action
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Danger action
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// With loading state
<Button loading onClick={handleSubmit}>
  Submitting...
</Button>

// With icons
<Button leftIcon={<PlusIcon />} onClick={handleAdd}>
  Add Item
</Button>
```

#### Accessibility

- Full keyboard navigation support (Tab, Enter, Space)
- Focus visible styles with ring indicator
- ARIA attributes for loading and disabled states
- Screen reader friendly

---

### Input

Text input component with validation states, labels, and helper text.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text above input |
| `error` | `string` | - | Error message below input |
| `success` | `string` | - | Success message below input |
| `helperText` | `string` | - | Helper text below input |
| `state` | `'default' \| 'error' \| 'success' \| 'warning'` | `'default'` | Visual state |
| `leftElement` | `ReactNode` | - | Element on left side |
| `rightElement` | `ReactNode` | - | Element on right side |
| `required` | `boolean` | `false` | Show required indicator |

#### Examples

```tsx
// Basic input
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  required
/>

// With error
<Input
  label="Username"
  error="This username is already taken"
  value={username}
  onChange={handleChange}
/>

// With icon
<Input
  label="Search"
  leftElement={<SearchIcon />}
  placeholder="Search programs..."
/>
```

#### Accessibility

- Proper label association with `htmlFor`
- Required indicator for screen readers
- Error messages announced via `aria-describedby`
- Color-blind friendly error indicators (icons + colors)

---

### Select

Dropdown select component built with Radix UI primitives.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text above select |
| `options` | `SelectOption[]` | - | Array of options |
| `value` | `string` | - | Selected value |
| `onValueChange` | `(value: string) => void` | - | Change handler |
| `placeholder` | `string` | `'Select an option...'` | Placeholder text |
| `error` | `string` | - | Error message |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Show required indicator |

#### SelectOption Type

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

#### Examples

```tsx
const programs = [
  { value: 'love-box', label: 'Love Box' },
  { value: 'food-bank', label: 'Food Bank' },
];

<Select
  label="Program"
  options={programs}
  value={selectedProgram}
  onValueChange={setSelectedProgram}
  placeholder="Choose a program..."
/>
```

#### Accessibility

- Full keyboard navigation (Arrow keys, Enter, Escape)
- Searchable with type-ahead
- Proper ARIA roles and attributes
- Focus management

---

### Card

Container component for grouping related content.

#### Components

- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title heading
- `CardDescription` - Description text
- `CardContent` - Content section
- `CardFooter` - Footer section

#### Props

**Card Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | Visual variant |

**CardHeader/CardFooter Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bordered` | `boolean` | `false` | Add border separator |

**CardTitle Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Title size |

#### Examples

```tsx
<Card variant="outlined">
  <CardHeader bordered>
    <CardTitle>Form Settings</CardTitle>
    <CardDescription>Configure form behavior</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
  <CardFooter bordered>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

---

### Badge

Status indicators and labels for metadata.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'outline'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `icon` | `ReactNode` | - | Icon before text |
| `endIcon` | `ReactNode` | - | Icon after text |

#### Examples

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Draft</Badge>
<Badge variant="error">3 Errors</Badge>
<Badge variant="info" icon={<InfoIcon />}>
  Beta Feature
</Badge>
```

---

### Alert

Display important messages with different severity levels.

#### Components

- `Alert` - Main alert container
- `AlertTitle` - Alert title
- `AlertDescription` - Alert description

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Alert severity |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `onDismiss` | `() => void` | - | Dismiss callback |
| `hideIcon` | `boolean` | `false` | Hide default icon |
| `icon` | `ReactNode` | - | Custom icon |

#### Examples

```tsx
<Alert variant="success">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>
    Your changes have been saved.
  </AlertDescription>
</Alert>

<Alert variant="error" dismissible onDismiss={handleDismiss}>
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong.
  </AlertDescription>
</Alert>
```

#### Accessibility

- Proper `role="alert"` for announcements
- Color-blind friendly (icons + colors)
- Keyboard accessible dismiss button

---

### Modal

Accessible modal dialogs built with Radix UI.

#### Components

- `Modal` - Root component
- `ModalTrigger` - Trigger button
- `ModalContent` - Content container
- `ModalHeader` - Header section
- `ModalTitle` - Title heading
- `ModalDescription` - Description text
- `ModalFooter` - Footer section

#### Props

**Modal Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Open state change handler |

#### Examples

```tsx
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Confirm Delete</ModalTitle>
      <ModalDescription>
        This action cannot be undone.
      </ModalDescription>
    </ModalHeader>
    <ModalFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

#### Accessibility

- Focus trap within modal
- Escape key to close
- Focus returns to trigger on close
- Screen reader announcements
- Proper ARIA attributes

---

### Tabs

Organize content into switchable panels.

#### Components

- `Tabs` - Root component
- `TabsList` - Tab button container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Tab panel content

#### Props

**Tabs Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | - | Default selected tab |
| `value` | `string` | - | Controlled value |
| `onValueChange` | `(value: string) => void` | - | Change handler |

#### Examples

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Overview content
  </TabsContent>
  <TabsContent value="settings">
    Settings content
  </TabsContent>
</Tabs>
```

#### Accessibility

- Full keyboard navigation (Arrow keys, Home, End)
- Proper ARIA roles (`tablist`, `tab`, `tabpanel`)
- Focus management

---

### Tooltip

Contextual help on hover or focus.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ReactNode` | - | Tooltip content |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Tooltip position |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Tooltip alignment |
| `delayDuration` | `number` | `200` | Delay before showing (ms) |
| `disabled` | `boolean` | `false` | Disable tooltip |

#### Examples

```tsx
<TooltipProvider>
  <Tooltip content="Save your changes">
    <Button>Save</Button>
  </Tooltip>

  <Tooltip content="Delete permanently" side="right">
    <IconButton icon={<TrashIcon />} />
  </Tooltip>
</TooltipProvider>
```

**Note:** Wrap your app or component tree with `TooltipProvider` at the top level.

#### Accessibility

- Shows on hover and focus
- Keyboard accessible
- Screen reader compatible
- Proper ARIA attributes

---

### Spinner

Loading indicators for async operations.

#### Components

- `Spinner` - Simple spinner
- `LoadingOverlay` - Full overlay with spinner

#### Props

**Spinner Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Spinner size |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'white'` | `'default'` | Color variant |
| `label` | `string` | `'Loading...'` | Screen reader label |

**LoadingOverlay Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | - | Whether overlay is visible |
| `message` | `string` | - | Loading message |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Spinner size |
| `opacity` | `number` | `50` | Overlay opacity (0-100) |

#### Examples

```tsx
// Simple spinner
<Spinner size="lg" variant="primary" />

// Loading overlay
<div className="relative">
  <YourContent />
  <LoadingOverlay
    isLoading={isLoading}
    message="Saving changes..."
  />
</div>
```

#### Accessibility

- Proper `role="status"` or `role="progressbar"`
- ARIA labels for screen readers
- Doesn't block keyboard navigation

---

## Design System

### Colors

The component library follows the MyRecruiter brand guidelines:

- **Primary Green**: `#4CAF50`
- **Primary Hover**: `#45a049`

### Spacing

Consistent spacing scale based on Tailwind CSS:

- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)

### Typography

Font sizes follow a modular scale:

- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)

### Border Radius

- `rounded-sm`: 0.125rem (2px)
- `rounded-md`: 0.375rem (6px)
- `rounded-lg`: 0.5rem (8px)

## Accessibility

All components are built with accessibility as a priority:

### Keyboard Navigation

- Full keyboard support for all interactive elements
- Visible focus indicators (ring styles)
- Logical tab order

### ARIA Attributes

- Proper roles (`button`, `alert`, `dialog`, etc.)
- Labels for screen readers
- State announcements (loading, error, etc.)

### Color Contrast

- WCAG AA compliant color contrasts
- Multiple indicators for states (not just color)
- Support for dark mode

### Screen Readers

- Meaningful labels and descriptions
- Dynamic content announcements
- Hidden text for context

## Performance

### Bundle Size

Components are tree-shakeable and only import what you use:

- Average component size: ~2-5 KB (gzipped)
- Total library: ~30 KB (gzipped) if using all components
- Radix UI primitives: ~15 KB (shared across components)

### Optimization Tips

1. **Import only what you need:**
   ```tsx
   import { Button } from '@/components/ui/Button';
   // Instead of: import * from '@/components/ui';
   ```

2. **Use code splitting for large modals:**
   ```tsx
   const Modal = lazy(() => import('@/components/ui/Modal'));
   ```

3. **Memoize callbacks in forms:**
   ```tsx
   const handleChange = useCallback((e) => {
     setValue(e.target.value);
   }, []);
   ```

### Budget Guidelines

Stay within these targets for optimal performance:

- **Initial Load**: <300 KB (total JS bundle)
- **Component Load**: <50 KB per route
- **Time to Interactive**: <2 seconds

## Testing

All components are designed to be testable:

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

test('modal opens and closes', async () => {
  const { rerender } = render(
    <Modal open={false}>
      <ModalContent>Test</ModalContent>
    </Modal>
  );

  expect(screen.queryByText('Test')).not.toBeInTheDocument();

  rerender(
    <Modal open={true}>
      <ModalContent>Test</ModalContent>
    </Modal>
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## Contributing

When adding new components:

1. Follow existing patterns and conventions
2. Use TypeScript with full type safety
3. Include JSDoc comments
4. Add accessibility features
5. Write usage examples
6. Update this README

## Resources

- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
