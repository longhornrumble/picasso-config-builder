# Visual Flow Diagram Implementation Plan

## Overview
Create a Dashboard page at `/dashboard` with a custom CSS/HTML tree visualization showing all config entities (Programs, Forms, CTAs, Branches, Action Chips, Content Showcase) with hierarchical relationships. Each node will be clickable to navigate to its editor, expandable/collapsible, and show validation status indicators.

## Requirements Summary

### User Requirements
- **Entities to visualize**: All entities including Action Chips and Content Showcase
- **Visualization type**: Tree/hierarchy view
- **Node information**: Configurable/expandable
- **UI location**: Dashboard/overview page
- **Route**: `/dashboard`
- **Technology**: Custom CSS/HTML tree (no new dependencies)
- **Initial state**: One level expanded
- **Must-have features**:
  - Click to navigate to editor
  - Expand/collapse functionality
  - Validation status indicators

## Implementation Steps

### Phase 1: Core Infrastructure (2-3 hours)

#### 1. Create Dashboard Page Component
**File**: `src/pages/DashboardPage.tsx`

**Responsibilities**:
- Import FlowDiagram component
- Add page header with title and description
- Include config statistics summary
- Responsive layout with proper padding

**Key Features**:
- Show tenant name in header
- Display entity count summary
- Main content area for flow diagram
- Loading and error states

#### 2. Add Route to App
**File**: `src/App.tsx`

**Changes**:
- Add `<Route path="dashboard" element={<DashboardPage />} />`
- Position route appropriately in route hierarchy

#### 3. Update Navigation
**File**: `src/components/layout/Sidebar.tsx`

**Changes**:
- Add "Dashboard" navigation item
- Use Workflow icon from lucide-react
- Position as second item (after Home)
- Ensure active state highlighting works

#### 4. Export New Page
**File**: `src/pages/index.ts`

**Changes**:
- Export DashboardPage for clean imports

### Phase 2: Tree Visualization Components (3-4 hours)

#### 5. Create FlowDiagram Component
**File**: `src/components/dashboard/FlowDiagram.tsx`

**Responsibilities**:
- Retrieve all entities from Zustand store
- Build tree structure using existing dependency tracking
- Render three main sections:
  1. Programs Hierarchy
  2. Action Chips
  3. Content Showcase
- Manage expand/collapse state
- Use CSS Grid for layout

**Data Flow**:
```typescript
// Retrieve entities from store
const programs = useConfigStore((state) => state.programs.getAll());
const forms = useConfigStore((state) => state.forms.getAll());
const ctas = useConfigStore((state) => state.ctas.getAll());
const branches = useConfigStore((state) => state.branches.getAll());
const actionChips = useConfigStore((state) => state.actionChips?.getAll());
const showcase = useConfigStore((state) => state.contentShowcase.getAll());

// Build tree structure
const tree = buildTreeStructure(programs, forms, ctas, branches);
```

**Tree Building Logic**:
- Group forms by program
- Group CTAs by form
- Group branches by CTA
- Create separate sections for Action Chips and Showcase
- Track parent-child relationships

**Initial State**:
- Programs section: Expanded (show all programs)
- Each program: Collapsed (hide forms)
- Action Chips section: Expanded (show all chips)
- Content Showcase section: Expanded (show all items)

#### 6. Create EntityNode Component
**File**: `src/components/dashboard/EntityNode.tsx`

**Props**:
```typescript
interface EntityNodeProps {
  entityType: 'program' | 'form' | 'cta' | 'branch' | 'actionChip' | 'showcase';
  entityId: string;
  entityName: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  validationStatus: 'error' | 'warning' | 'success' | 'none';
  errorCount?: number;
  warningCount?: number;
}
```

**Visual Design**:
- Render as Card component (from shadcn/ui)
- Color-coded border/badge by entity type
- Indentation based on depth (depth * 24px)
- Icon and name displayed prominently
- Validation status indicator (icon + badge)
- Expand/collapse chevron (if has children)
- Hover effect for interactivity
- Click to navigate

**Color Scheme**:
- Programs: `bg-blue-50 border-blue-200 text-blue-900`
- Forms: `bg-green-50 border-green-200 text-green-900`
- CTAs: `bg-purple-50 border-purple-200 text-purple-900`
- Branches: `bg-orange-50 border-orange-200 text-orange-900`
- Action Chips: `bg-cyan-50 border-cyan-200 text-cyan-900`
- Content Showcase: `bg-pink-50 border-pink-200 text-pink-900`

**Validation Indicators**:
- Error: Red AlertCircle icon + badge with count
- Warning: Yellow AlertTriangle icon + badge with count
- Success: Green CheckCircle icon
- None: Gray Circle icon

**Expandable Detail View** (Collapsed by default):
- Click badge or info icon to expand
- Show additional metadata:
  - Program: description, type
  - Form: field count, program reference
  - CTA: action type, target
  - Branch: CTA count, priority
  - Action Chip: route, target branch
  - Showcase: category, CTA references

#### 7. Create EntityList Component
**File**: `src/components/dashboard/EntityList.tsx`

**Props**:
```typescript
interface EntityListProps {
  entities: TreeNode[];
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}
```

**Responsibilities**:
- Render list of EntityNode components
- Handle recursive rendering for nested entities
- Apply proper spacing and indentation
- Support empty state

**Recursive Structure**:
```typescript
{entities.map(node => (
  <div key={node.id}>
    <EntityNode {...nodeProps} />
    {node.children && node.children.length > 0 && expandedIds.has(node.id) && (
      <EntityList
        entities={node.children}
        depth={depth + 1}
        expandedIds={expandedIds}
        onToggleExpand={onToggleExpand}
      />
    )}
  </div>
))}
```

#### 8. Create Types File
**File**: `src/components/dashboard/types.ts`

**Type Definitions**:
```typescript
export type EntityType = 'program' | 'form' | 'cta' | 'branch' | 'actionChip' | 'showcase';

export type ValidationStatus = 'error' | 'warning' | 'success' | 'none';

export interface TreeNode {
  id: string;
  type: EntityType;
  name: string;
  data: any; // Original entity data
  children: TreeNode[];
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}

export interface EntityNodeProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onNavigate: (type: EntityType, id: string) => void;
}

export interface FlowDiagramSection {
  title: string;
  icon: React.ComponentType;
  nodes: TreeNode[];
}
```

### Phase 3: Interactivity (2-3 hours)

#### 9. Navigation Logic

**Implementation**:
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleNavigate = (type: EntityType, id: string) => {
  const routes = {
    program: `/programs?selected=${id}`,
    form: `/forms?selected=${id}`,
    cta: `/ctas?selected=${id}`,
    branch: `/branches?selected=${id}`,
    actionChip: `/action-chips?selected=${id}`,
    showcase: `/cards?selected=${id}`,
  };

  navigate(routes[type]);
};
```

**Note**: May need to update editor pages to support `?selected={id}` query parameter for auto-selection.

#### 10. Expand/Collapse State Management

**Implementation**:
```typescript
const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
  // Initialize with top-level entities expanded
  const initialExpanded = new Set<string>();
  programs.forEach(p => initialExpanded.add(p.program_id));
  // Action chips and showcase sections are just lists, no expansion needed
  return initialExpanded;
});

const toggleExpand = (id: string) => {
  setExpandedIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};
```

**Optional**: Persist state in sessionStorage
```typescript
// Save on change
useEffect(() => {
  sessionStorage.setItem('dashboard-expanded', JSON.stringify([...expandedIds]));
}, [expandedIds]);

// Load on mount
const loadExpandedState = () => {
  const saved = sessionStorage.getItem('dashboard-expanded');
  return saved ? new Set(JSON.parse(saved)) : getDefaultExpanded();
};
```

#### 11. Validation Integration

**Data Source**:
```typescript
import { useConfigStore } from '@/store';

const validationErrors = useConfigStore((state) => state.validation.errors);
const validationWarnings = useConfigStore((state) => state.validation.warnings);
```

**Status Calculation**:
```typescript
const getValidationStatus = (entityType: string, entityId: string): ValidationStatus => {
  const errors = validationErrors.filter(e =>
    e.entityType === entityType && e.entityId === entityId
  );
  const warnings = validationWarnings.filter(w =>
    w.entityType === entityType && w.entityId === entityId
  );

  if (errors.length > 0) return 'error';
  if (warnings.length > 0) return 'warning';
  return 'success';
};
```

**Visual Indicators**:
- Import icons from lucide-react: `AlertCircle`, `AlertTriangle`, `CheckCircle`, `Circle`
- Display icon with appropriate color
- Show count badge for errors/warnings
- Tooltip on hover with first error/warning message

### Phase 4: Visual Polish (1-2 hours)

#### 12. Color Coding by Entity Type

**Badge Component**:
```typescript
const EntityTypeBadge = ({ type }: { type: EntityType }) => {
  const config = {
    program: { label: 'Program', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    form: { label: 'Form', color: 'bg-green-100 text-green-800 border-green-300' },
    cta: { label: 'CTA', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    branch: { label: 'Branch', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    actionChip: { label: 'Action Chip', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    showcase: { label: 'Showcase', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  };

  const { label, color } = config[type];

  return (
    <Badge className={`${color} border text-xs`}>
      {label}
    </Badge>
  );
};
```

**Icons by Entity Type**:
- Program: `Briefcase`
- Form: `FileText`
- CTA: `MousePointerClick`
- Branch: `GitBranch`
- Action Chip: `Zap`
- Showcase: `Layout`

#### 13. Responsive Design

**Layout**:
- Desktop: Full tree visible, comfortable spacing
- Tablet: Compact spacing, scrollable
- Mobile: Stack sections vertically, horizontal scroll for deep nesting

**Breakpoints** (Tailwind):
```tsx
<div className="
  w-full
  px-4 md:px-6 lg:px-8
  py-4 md:py-6
  overflow-x-auto
">
  {/* Tree content */}
</div>
```

**Mobile Optimizations**:
- Reduce node padding on mobile
- Stack entity info vertically
- Larger touch targets for expand/collapse
- Sticky section headers

#### 14. Loading and Empty States

**Loading State**:
```tsx
{isLoading ? (
  <div className="flex items-center justify-center h-64">
    <Spinner size="lg" />
    <p className="ml-3 text-muted-foreground">Loading configuration...</p>
  </div>
) : (
  <FlowDiagram />
)}
```

**Empty State**:
```tsx
{programs.length === 0 && forms.length === 0 ? (
  <div className="text-center py-12">
    <Layout className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-semibold">No configuration loaded</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Load a tenant configuration to view the flow diagram
    </p>
  </div>
) : (
  <FlowDiagram />
)}
```

**Error Boundary**:
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <DashboardPage />
</ErrorBoundary>
```

### Phase 5: Testing & Documentation (1-2 hours)

#### 15. Manual Testing Checklist

**Functional Tests**:
- [ ] Dashboard accessible at `/dashboard`
- [ ] Tree displays all entity types
- [ ] Click on Program node → navigates to `/programs?selected={id}`
- [ ] Click on Form node → navigates to `/forms?selected={id}`
- [ ] Click on CTA node → navigates to `/ctas?selected={id}`
- [ ] Click on Branch node → navigates to `/branches?selected={id}`
- [ ] Click on Action Chip node → navigates to `/action-chips?selected={id}`
- [ ] Click on Showcase node → navigates to `/cards?selected={id}`
- [ ] Expand/collapse works for all parent nodes
- [ ] Initial state: Programs visible, forms collapsed
- [ ] Validation errors show red indicator
- [ ] Validation warnings show yellow indicator
- [ ] Valid entities show green indicator
- [ ] Error/warning counts display correctly
- [ ] Color coding matches entity type

**Visual Tests**:
- [ ] Layout looks good on desktop (1920x1080)
- [ ] Layout looks good on tablet (768x1024)
- [ ] Layout looks good on mobile (375x667)
- [ ] Indentation increases for nested entities
- [ ] Hover effects work properly
- [ ] Icons display correctly
- [ ] Badges are legible

**Integration Tests**:
- [ ] Test with TEST001 config (has all entity types)
- [ ] Test with TEST002 config (different structure)
- [ ] Test with empty config (no entities)
- [ ] Test with config that has validation errors
- [ ] Navigation back from editor pages works

**Performance Tests**:
- [ ] Large config (50+ entities) renders smoothly
- [ ] Expand/collapse is responsive
- [ ] No memory leaks with repeated navigation

#### 16. Update Documentation

**CLAUDE.md Updates**:
- Add Dashboard page to Project Structure section
- Add dashboard components to component list
- Update Key Features to mention flow visualization
- Add to Common Development Tasks

**USER_GUIDE.md Updates** (if exists):
- Add Dashboard section
- Explain how to navigate using flow diagram
- Document expand/collapse functionality
- Explain validation indicators

**Component README**:
Create `src/components/dashboard/README.md`:
- Purpose and overview
- Component hierarchy
- Props documentation
- Usage examples
- Customization options

## Tree Structure Visualization

### Visual Layout Example

```
Dashboard (/dashboard)
┌─────────────────────────────────────────────────────────────┐
│ Configuration Flow Diagram                                   │
│ tenant-name-here • 3 Programs • 5 Forms • 8 CTAs            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 Programs Hierarchy                                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ▼ 💼 Employee Referral Program             [✓] Program       │
│   │                                                           │
│   ├─▶ 📄 Referral Form                     [✓] Form          │
│   │   │                                                       │
│   │   ├─▶ 🖱️ Submit Referral CTA          [✓] CTA           │
│   │   │   │                                                   │
│   │   │   └─▶ 🌿 Confirmation Branch      [⚠ 1] Branch      │
│   │   │                                                       │
│   │   └─▶ 🖱️ Learn More CTA               [✓] CTA           │
│   │                                                           │
│   └─▶ 📄 Referral Status Check            [✓] Form          │
│                                                               │
│ ▶ 💼 Tuition Reimbursement                 [✓] Program       │
│                                                               │
│ ▶ 💼 Relocation Assistance                 [🔴 2] Program    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚡ Action Chips                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ⚡ Apply Now                               [✓] Action Chip   │
│    └─▶ Routes to: Application Branch                         │
│                                                               │
│ ⚡ Schedule Interview                      [✓] Action Chip   │
│    └─▶ Routes to: Scheduling Branch                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎨 Content Showcase                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🎨 Welcome Card                            [✓] Showcase      │
│    └─▶ References: Submit Referral CTA                       │
│                                                               │
│ 🎨 Benefits Overview                       [✓] Showcase      │
│    └─▶ References: Learn More CTA                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Structure

```typescript
interface TreeStructure {
  programs: ProgramNode[];
  actionChips: ActionChipNode[];
  showcase: ShowcaseNode[];
}

interface ProgramNode {
  id: string;
  type: 'program';
  name: string;
  data: Program;
  children: FormNode[];
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}

interface FormNode {
  id: string;
  type: 'form';
  name: string;
  data: Form;
  parent: ProgramNode;
  children: CTANode[];
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}

interface CTANode {
  id: string;
  type: 'cta';
  name: string;
  data: CTA;
  parent: FormNode;
  children: BranchNode[];
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}

interface BranchNode {
  id: string;
  type: 'branch';
  name: string;
  data: Branch;
  parent: CTANode;
  children: []; // Leaf node
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}

interface ActionChipNode {
  id: string;
  type: 'actionChip';
  name: string;
  data: ActionChip;
  targetBranch?: BranchNode;
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}

interface ShowcaseNode {
  id: string;
  type: 'showcase';
  name: string;
  data: ShowcaseItem;
  referencedCTAs: CTANode[];
  validationStatus: ValidationStatus;
  errorCount: number;
  warningCount: number;
}
```

## Files to Create

### New Files (8-10 files)

1. **`src/pages/DashboardPage.tsx`**
   - Main dashboard page component
   - ~100-150 lines

2. **`src/components/dashboard/FlowDiagram.tsx`**
   - Main diagram container
   - Tree building logic
   - ~200-300 lines

3. **`src/components/dashboard/EntityNode.tsx`**
   - Individual node component
   - Click handlers, expand/collapse
   - ~150-200 lines

4. **`src/components/dashboard/EntityList.tsx`**
   - Recursive list renderer
   - ~80-100 lines

5. **`src/components/dashboard/types.ts`**
   - Type definitions
   - ~80-100 lines

6. **`src/components/dashboard/index.ts`**
   - Barrel exports
   - ~10 lines

7. **`src/components/dashboard/utils.ts`**
   - Tree building utilities
   - Validation status helpers
   - ~150-200 lines

8. **`src/components/dashboard/README.md`**
   - Component documentation
   - ~100 lines

9. **`src/components/dashboard/__tests__/FlowDiagram.test.tsx`** (optional)
   - Unit tests
   - ~200+ lines

10. **`src/components/dashboard/__tests__/EntityNode.test.tsx`** (optional)
    - Unit tests
    - ~150+ lines

## Files to Modify

### Existing Files (4 files)

1. **`src/App.tsx`**
   - Add route for dashboard
   - +1 import, +1 route
   - ~5 lines added

2. **`src/components/layout/Sidebar.tsx`**
   - Add dashboard navigation item
   - +1 import, +1 NavLink
   - ~10 lines added

3. **`src/pages/index.ts`**
   - Export DashboardPage
   - +1 line

4. **`CLAUDE.md`**
   - Document dashboard feature
   - Add to Project Structure
   - Add to Key Features
   - ~30 lines added

## Technical Approach

### State Dependencies

**Zustand Store Selectors**:
```typescript
// Retrieve entities
const programs = useConfigStore(state => state.programs.getAllPrograms());
const forms = useConfigStore(state => state.forms.getAllForms());
const ctas = useConfigStore(state => state.ctas.getAllCTAs());
const branches = useConfigStore(state => state.branches.getAllBranches());
const actionChips = useConfigStore(state => state.actionChips?.getAllActionChips() || []);
const showcase = useConfigStore(state => state.contentShowcase.getAllItems());

// Validation state
const validationErrors = useConfigStore(state => state.validation.errors);
const validationWarnings = useConfigStore(state => state.validation.warnings);
```

**Dependency Tracking**:
```typescript
import { buildDependencyGraph } from '@/lib/validation/dependencyTracking';

// Build relationships
const dependencyGraph = buildDependencyGraph({
  programs,
  forms,
  ctas,
  branches,
  actionChips,
  showcase
});
```

### Styling Approach

**Tailwind Utilities**:
- Layout: `flex`, `grid`, `space-y-*`
- Colors: Use existing color palette
- Spacing: Consistent padding/margin
- Borders: `border`, `border-l-4` for hierarchy
- Shadows: `shadow-sm`, `shadow-md` on hover
- Transitions: `transition-all duration-200`

**Component Library**:
- Use existing Card component from shadcn/ui
- Use Badge component for labels
- Use Button for expand/collapse icons
- Use Tooltip for additional info

### Performance Considerations

**Optimization Strategies**:
1. **Memoization**: Use `React.memo` for EntityNode
2. **Virtual Scrolling**: Consider if tree exceeds 100+ nodes
3. **Lazy Loading**: Defer rendering of collapsed subtrees
4. **Debouncing**: Debounce expand/collapse state updates
5. **Selective Re-renders**: Use `useMemo` for tree structure

**Code Example**:
```typescript
const EntityNode = React.memo(({ node, ...props }: EntityNodeProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.node.validationStatus === nextProps.node.validationStatus
  );
});
```

## Success Criteria

### Functional Requirements

✅ **Core Features**:
- [ ] Dashboard accessible at `/dashboard`
- [ ] Tree shows all entity types hierarchically
- [ ] One level expanded by default
- [ ] Click any node navigates to its editor
- [ ] Expand/collapse works for all parent nodes
- [ ] Validation status visible on all nodes

✅ **Visual Requirements**:
- [ ] Color-coded by entity type
- [ ] Validation indicators (error/warning/success)
- [ ] Clear hierarchy with indentation
- [ ] Responsive on mobile and desktop
- [ ] Consistent with existing UI design

✅ **Performance Requirements**:
- [ ] Renders smoothly with 50+ entities
- [ ] Expand/collapse feels instant (<100ms)
- [ ] No memory leaks
- [ ] No layout shifts

✅ **Quality Requirements**:
- [ ] No console errors or warnings
- [ ] TypeScript types are complete
- [ ] Code follows project conventions
- [ ] Components are documented

## Estimated Timeline

### Total: 8-12 hours

**Phase 1: Core Infrastructure** - 2-3 hours
- Dashboard page setup
- Routing and navigation
- Basic page layout

**Phase 2: Tree Visualization** - 3-4 hours
- FlowDiagram component
- EntityNode component
- EntityList component
- Tree building logic

**Phase 3: Interactivity** - 2-3 hours
- Navigation handlers
- Expand/collapse state
- Validation integration

**Phase 4: Visual Polish** - 1-2 hours
- Color coding
- Responsive design
- Loading/empty states

**Phase 5: Testing & Docs** - 1-2 hours
- Manual testing
- Documentation updates
- Bug fixes

### Breakdown by File

| File | Estimated Time |
|------|----------------|
| DashboardPage.tsx | 30-45 min |
| FlowDiagram.tsx | 1-2 hours |
| EntityNode.tsx | 1-1.5 hours |
| EntityList.tsx | 30-45 min |
| types.ts | 20-30 min |
| utils.ts | 1-1.5 hours |
| App.tsx + Sidebar.tsx | 20-30 min |
| Testing | 1-2 hours |
| Documentation | 30-60 min |

## Future Enhancements (Post-MVP)

### Nice-to-Have Features

1. **Search/Filter** (2-3 hours)
   - Search bar to filter entities by name
   - Filter by entity type
   - Filter by validation status
   - Highlight matching nodes

2. **Export Functionality** (3-4 hours)
   - Export diagram as PNG
   - Export diagram as SVG
   - Export as structured JSON
   - Print-friendly view

3. **Mini-Map** (2-3 hours)
   - Small overview in corner
   - Show current viewport
   - Click to navigate

4. **Zoom Controls** (1-2 hours)
   - Zoom in/out buttons
   - Fit to screen
   - Reset zoom

5. **Drag-to-Reorder** (4-6 hours)
   - Use @dnd-kit library (already installed)
   - Drag programs to reorder
   - Visual feedback during drag
   - Save new order to config

6. **Entity Quick-Edit** (3-4 hours)
   - Tooltip with edit form
   - Inline editing of name/description
   - Save without navigating away

7. **Advanced Validation Display** (2-3 hours)
   - Tooltip showing all errors/warnings
   - Click to jump to validation panel
   - Fix suggestions inline

8. **Bookmarks/Favorites** (1-2 hours)
   - Star important entities
   - Quick filter to show only starred
   - Persist in localStorage

9. **Collapse All/Expand All** (30 min)
   - Buttons to control all nodes
   - Useful for large configs

10. **Entity Statistics** (1-2 hours)
    - Show field count for forms
    - Show CTA count for branches
    - Show dependency count

## Risk Mitigation

### Potential Risks

1. **Performance with Large Configs**
   - **Risk**: Slow rendering with 100+ entities
   - **Mitigation**: Virtual scrolling, lazy loading, memoization

2. **Complex Dependency Tracking**
   - **Risk**: Circular references or complex relationships
   - **Mitigation**: Leverage existing dependencyTracking.ts, add cycle detection

3. **Navigation Integration**
   - **Risk**: Editor pages don't support `?selected={id}` param
   - **Mitigation**: Update editor pages or use different navigation approach

4. **Mobile UX**
   - **Risk**: Tree too complex on small screens
   - **Mitigation**: Simplified mobile view, horizontal scroll, section stacking

5. **Validation Data Availability**
   - **Risk**: Validation state not available for all entities
   - **Mitigation**: Fallback to 'none' status, trigger validation on dashboard load

## Testing Strategy

### Unit Tests

**Components to Test**:
- EntityNode: Rendering, click handlers, expand/collapse
- EntityList: Recursive rendering, empty state
- FlowDiagram: Tree building, section rendering
- Utils: Tree building logic, validation status calculation

**Test Cases**:
```typescript
describe('EntityNode', () => {
  it('renders entity name and type badge', () => {});
  it('shows validation error indicator when has errors', () => {});
  it('calls onNavigate when clicked', () => {});
  it('toggles expand when chevron clicked', () => {});
  it('renders children when expanded', () => {});
});

describe('FlowDiagram', () => {
  it('renders programs section', () => {});
  it('renders action chips section', () => {});
  it('renders showcase section', () => {});
  it('builds correct tree structure', () => {});
  it('shows empty state when no entities', () => {});
});
```

### Integration Tests

**Scenarios**:
1. Load dashboard with TEST001 config
2. Click on program → verify navigation to /programs
3. Expand program → verify forms appear
4. Collapse program → verify forms hidden
5. Load config with validation errors → verify indicators appear

### Manual Testing

**Test Configs**:
- TEST001: Complete config with all entity types
- TEST002: Alternative structure
- Empty config: No entities loaded
- Large config: 50+ entities (create test config)
- Invalid config: Contains validation errors

## Dependencies

### No New Dependencies Required ✅

All functionality can be built using existing dependencies:
- React 18.2.0
- React Router DOM 6.20.0
- Zustand (state management)
- Tailwind CSS (styling)
- Lucide React (icons)
- Radix UI (headless components)
- @dnd-kit (future drag-and-drop)

### Optional Future Dependencies

If adding future enhancements:
- `react-flow` - For advanced graph visualization (~450KB)
- `d3` - For custom visualizations (~300KB)
- `html2canvas` - For PNG export (~100KB)
- `react-to-print` - For print functionality (~20KB)

## Rollout Plan

### Phase 1: Development (Week 1)
1. Create core components
2. Implement basic tree visualization
3. Add navigation handlers
4. Test with TEST001/TEST002

### Phase 2: Refinement (Week 1-2)
1. Add validation integration
2. Polish visual design
3. Improve responsive layout
4. Fix bugs from testing

### Phase 3: Documentation (Week 2)
1. Update CLAUDE.md
2. Write component README
3. Create user guide section
4. Add inline code comments

### Phase 4: Deployment (Week 2)
1. Final testing
2. Code review
3. Merge to main branch
4. Deploy to staging
5. User acceptance testing
6. Deploy to production

## Conclusion

This implementation plan provides a comprehensive roadmap for building a visual flow diagram feature for the Picasso Config Builder. The dashboard will give users a clear, interactive view of their entire configuration with the ability to quickly navigate to any entity's editor and identify validation issues at a glance.

**Key Advantages**:
- ✅ No new dependencies required
- ✅ Leverages existing components and patterns
- ✅ Uses existing dependency tracking infrastructure
- ✅ Consistent with current UI design
- ✅ Extensible for future enhancements

**Deliverables**:
- Functional dashboard at `/dashboard`
- 8-10 new files
- 4 files modified
- Complete documentation
- Tested with sample configs

---

**Document Version**: 1.0
**Created**: 2025-11-06
**Author**: Development Team
**Status**: Ready for Implementation
