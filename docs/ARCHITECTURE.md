# PICASSO CONFIG BUILDER - SYSTEM ARCHITECTURE

**Version**: 1.0
**Date**: 2025-10-15
**Author**: System Architect Agent
**Status**: Approved for Implementation

Based on the PRD, config schema, existing Picasso patterns, and project constraints, here is the comprehensive architecture for the Web Config Builder.

---

## Executive Summary

The Picasso Config Builder is a **single-page React application** for managing multi-tenant conversational form configurations. It replaces manual JSON editing with a validated, user-friendly interface that operations teams can use to deploy forms-enabled tenants in under 10 minutes.

**Key Architectural Principles:**
- **Type-safe everything**: TypeScript + Zod for runtime validation
- **Single source of truth**: Zustand store with S3 persistence
- **Validation-first**: Real-time + pre-deployment validation
- **Minimal dependencies**: Leverage existing patterns from Picasso
- **Performance**: Load time <2s, optimistic updates

---

## 1. STATE MANAGEMENT ARCHITECTURE (ZUSTAND)

### 1.1 Store Structure

**Single Store with Domain Slices** (preferred over multiple stores for MVP simplicity)

```typescript
// src/store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ConfigBuilderState {
  // Tenant selection
  tenant: TenantSlice;

  // Config sections (domain slices)
  programs: ProgramsSlice;
  forms: FormsSlice;
  ctas: CTAsSlice;
  branches: BranchesSlice;
  cardInventory: CardInventorySlice;

  // UI state
  ui: UISlice;

  // Validation state
  validation: ValidationSlice;

  // Config lifecycle
  config: ConfigSlice;
}
```

### 1.2 Domain Slice Example: Forms

```typescript
interface FormsSlice {
  // State
  forms: Record<string, ConversationalForm>;
  activeFormId: string | null;

  // Actions
  createForm: (form: ConversationalForm) => void;
  updateForm: (formId: string, updates: Partial<ConversationalForm>) => void;
  deleteForm: (formId: string) => void;
  duplicateForm: (formId: string) => void;

  // Field management
  addField: (formId: string, field: FormField) => void;
  updateField: (formId: string, fieldIndex: number, updates: Partial<FormField>) => void;
  deleteField: (formId: string, fieldIndex: number) => void;
  reorderFields: (formId: string, fromIndex: number, toIndex: number) => void;

  // Selectors (computed values)
  getForm: (formId: string) => ConversationalForm | undefined;
  getFormsByProgram: (programId: string) => ConversationalForm[];
  getFormDependencies: (formId: string) => Dependencies;
}
```

### 1.3 Config Slice (Lifecycle Management)

```typescript
interface ConfigSlice {
  // Loaded config state
  tenantId: string | null;
  baseConfig: TenantConfig | null;  // Original from S3
  isDirty: boolean;                 // Has unsaved changes
  lastSaved: number | null;         // Timestamp

  // Actions
  loadConfig: (tenantId: string) => Promise<void>;
  saveConfig: () => Promise<void>;
  deployConfig: () => Promise<void>;
  resetConfig: () => void;

  // Merge strategy
  getMergedConfig: () => TenantConfig;  // Combines base + edited sections

  // History (optional for MVP)
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}
```

[Content continues with all sections from the system-architect output...]

---

**END OF ARCHITECTURE DOCUMENT**

This architecture provides a solid foundation for the 2-week MVP while remaining extensible for Phase 2 (templates) and Phase 3 (visual builder). All design decisions prioritize type safety, validation, and developer experience to ensure the Config Builder becomes a reliable, scalable tool for the operations team.
