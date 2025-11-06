# Flow Diagram Dashboard Types

This directory contains TypeScript type definitions for the Flow Diagram Dashboard feature.

## Overview

The Flow Diagram Dashboard visualizes tenant configurations as hierarchical tree structures with real-time validation feedback. It displays programs, forms, CTAs, branches, action chips, and showcase items in an expandable tree format.

## Files

- **`types.ts`**: Complete type definitions for the dashboard
- **`__tests__/types.test.ts`**: Comprehensive type tests

## Core Types

### EntityType

Union type representing all entity types in the dashboard:

```typescript
type EntityType = 'program' | 'form' | 'cta' | 'branch' | 'actionChip' | 'showcase';
```

### ValidationStatus

Represents the validation state of an entity:

```typescript
type ValidationStatus = 'error' | 'warning' | 'success' | 'none';
```

### TreeNode

The primary data structure representing an entity in the tree:

```typescript
interface TreeNode {
  id: string;                    // Entity ID
  type: EntityType;              // Entity type
  name: string;                  // Display name
  data: Program | Form | ...;    // Original entity data
  children: TreeNode[];          // Nested entities
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
  metadata?: Record<string, unknown>;
}
```

## Component Props

### EntityNodeProps

Props for rendering a single tree node:

```typescript
interface EntityNodeProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onNavigate: (type: EntityType, id: string) => void;
}
```

### EntityListProps

Props for rendering a list of tree nodes:

```typescript
interface EntityListProps {
  entities: TreeNode[];
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onNavigate: (type: EntityType, id: string) => void;
}
```

## Utility Types

### FlowDiagramSection

Configuration for dashboard sections:

```typescript
interface FlowDiagramSection {
  title: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  nodes: TreeNode[];
  initiallyExpanded: boolean;
}
```

### EntityTypeConfig

Display and routing configuration for entity types:

```typescript
interface EntityTypeConfig {
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  color: string;  // Tailwind CSS classes
  route: string;  // Navigation route
}
```

## Type Guards

Type guards are provided for narrowing TreeNode types:

```typescript
import { isProgram, isForm, isCTA, isBranch, isActionChip, isShowcase } from './types';

if (isProgram(node)) {
  // node.data is typed as Program
  console.log(node.data.program_name);
}

if (isForm(node)) {
  // node.data is typed as ConversationalForm
  console.log(node.data.fields.length);
}
```

## Usage Examples

### Creating a TreeNode

```typescript
import type { TreeNode } from './types';

const programNode: TreeNode = {
  id: 'prog-1',
  type: 'program',
  name: 'Test Program',
  data: {
    program_id: 'prog-1',
    program_name: 'Test Program',
    description: 'A test program',
  },
  children: [],
  validationStatus: 'success',
  errorCount: 0,
  warningCount: 0,
  metadata: {
    usageCount: 5,
    lastModified: Date.now(),
  },
};
```

### Using Type Guards

```typescript
import { isForm, isCTA } from './types';

function processNode(node: TreeNode) {
  if (isForm(node)) {
    // Access form-specific properties
    return node.data.fields.map(f => f.label);
  }

  if (isCTA(node)) {
    // Access CTA-specific properties
    return node.data.action;
  }
}
```

### Building EntityTypeConfig

```typescript
import { FileText } from 'lucide-react';
import type { EntityTypeConfig } from './types';

const formConfig: EntityTypeConfig = {
  label: 'Form',
  icon: FileText,
  color: 'bg-blue-50 border-blue-200 text-blue-800',
  route: '/forms',
};
```

### Creating Component Props

```typescript
import type { EntityNodeProps } from './types';

function MyEntityNode(props: EntityNodeProps) {
  const { node, depth, isExpanded, onToggleExpand, onNavigate } = props;

  return (
    <div style={{ paddingLeft: `${depth * 20}px` }}>
      <button onClick={() => onToggleExpand(node.id)}>
        {isExpanded ? '▼' : '▶'}
      </button>
      <span onClick={() => onNavigate(node.type, node.id)}>
        {node.name}
      </span>
    </div>
  );
}
```

## Advanced Types

### ReadonlyTreeNode

Immutable version of TreeNode for read-only tree operations:

```typescript
import type { ReadonlyTreeNode } from './types';

function traverseTree(node: ReadonlyTreeNode) {
  // node and its children are readonly
  node.children.forEach(child => traverseTree(child));
}
```

### PartialTreeNode

For building trees incrementally without validation data:

```typescript
import type { PartialTreeNode } from './types';

const partial: PartialTreeNode = {
  id: 'test-1',
  type: 'program',
  name: 'Test',
  data: { program_id: 'test-1', program_name: 'Test' },
  children: [],
  // validationStatus, errorCount, warningCount are optional
};
```

## Testing

Run the type tests:

```bash
npm test -- src/components/dashboard/__tests__/types.test.ts
```

All types are thoroughly tested with:
- Type guard validation
- Interface compatibility checks
- Edge case handling
- Type narrowing verification

## Type Safety

This module follows strict TypeScript best practices:

- ✅ No `any` types (except in minimal cases with documentation)
- ✅ Comprehensive JSDoc comments
- ✅ Type guards for runtime type checking
- ✅ Proper use of union types and discriminated unions
- ✅ Utility types for common patterns
- ✅ Re-exported config types for convenience

## Integration

These types integrate seamlessly with:

- **`src/types/config.ts`**: Core entity definitions
- **`src/types/validation.ts`**: Validation types
- **`src/store/`**: Zustand store slices

## Future Enhancements

Planned additions:
- Filtering and sorting types
- Search functionality types
- Compact/expanded view mode types
- Export/import types
