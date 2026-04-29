/**
 * Regression test for the key-prop reset pattern (Phase B3 lint cleanup).
 *
 * Before: EntityForm reset its internal state via a useEffect on `[entity, open, ...]`.
 * After: the parent (EntityEditor) passes `key={`entity-${id}-${open}`}` so each
 * open creates a fresh component instance, and the reset effect was deleted.
 *
 * This test verifies the new contract: when the parent's key changes, the form's
 * state initializers re-run from scratch.
 */

import { describe, it, expect, vi } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityForm } from '../EntityForm';
import { TooltipProvider } from '@/components/ui';
import type { FormFieldsProps } from '@/lib/crud/types';

interface TestEntity {
  id: string;
  name: string;
}

const TestFormFields: React.FC<FormFieldsProps<TestEntity>> = ({ value, onChange }) => (
  <input
    data-testid="name-input"
    value={value.name || ''}
    onChange={(e) => onChange({ ...value, name: e.target.value })}
  />
);

/** Validation that rejects empty name — used to exercise lazy-init errors seeding. */
const requiredNameValidation = (data: TestEntity) =>
  data.name ? {} : { name: 'Name is required' };

const Harness: React.FC<{ validate?: (d: TestEntity) => Record<string, string> }> = ({
  validate = () => ({}),
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TestEntity | null>(null);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const getId = (e: TestEntity) => e.id;

  return (
    <>
      <button data-testid="open-create" onClick={() => { setEditing(null); setOpen(true); }}>
        open create
      </button>
      <button data-testid="open-edit" onClick={() => { setEditing({ id: 'e1', name: 'preset' }); setOpen(true); }}>
        open edit
      </button>
      <button data-testid="close" onClick={() => setOpen(false)}>
        close
      </button>
      <button
        data-testid="add-existing-id"
        onClick={() => setExistingIds((prev) => [...prev, 'dup'])}
      >
        add existing id
      </button>
      <EntityForm
        key={`entity-${editing ? getId(editing) : 'new'}-${open}`}
        open={open}
        entity={editing}
        entityName="Test"
        FormFields={TestFormFields}
        validation={validate as unknown as Parameters<typeof EntityForm>[0]['validation']}
        existingIds={existingIds}
        onSubmit={vi.fn()}
        onCancel={() => setOpen(false)}
        initialValue={{ name: '' }}
        getId={getId}
      />
    </>
  );
};

describe('EntityForm — key-prop reset contract', () => {
  it('reopens with empty fields after the user closes a modified create form', () => {
    render(<TooltipProvider><Harness /></TooltipProvider>);

    fireEvent.click(screen.getByTestId('open-create'));
    let input = screen.getByTestId('name-input') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: 'half-typed' } });
    expect(input.value).toBe('half-typed');

    fireEvent.click(screen.getByTestId('close'));
    fireEvent.click(screen.getByTestId('open-create'));

    input = screen.getByTestId('name-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('switches between create and edit with the right initial values each time', () => {
    render(<TooltipProvider><Harness /></TooltipProvider>);

    fireEvent.click(screen.getByTestId('open-edit'));
    let input = screen.getByTestId('name-input') as HTMLInputElement;
    expect(input.value).toBe('preset');

    fireEvent.click(screen.getByTestId('close'));
    fireEvent.click(screen.getByTestId('open-create'));

    input = screen.getByTestId('name-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('lazy-initializes errors from validation on mount so the submit button reflects immediate validity', () => {
    // The lazy-init: useState(() => validation(initial, ctx)).
    // An entity with an empty name should start with a seeded error, not an empty errors map.
    // The old useEffect approach would have produced {} on first render then set errors on the
    // next tick — the lazy initializer ensures they are present from the very first paint.
    render(
      <TooltipProvider>
        <Harness validate={requiredNameValidation} />
      </TooltipProvider>
    );

    // Open create form — initial name is '' so validation should fire immediately
    fireEvent.click(screen.getByTestId('open-create'));

    // The form's submit button is disabled when there are validation errors.
    // It must be disabled from the first render, not only after the first state flush.
    const submitBtn = screen.getByRole('button', { name: /create test/i });
    expect(submitBtn).toBeDisabled();
  });

  it('does NOT reset in-progress edits when an unrelated prop (existingIds) updates while the modal is open', () => {
    // Key does not change when existingIds changes — instance should survive prop update.
    render(<TooltipProvider><Harness /></TooltipProvider>);

    fireEvent.click(screen.getByTestId('open-create'));
    const input = screen.getByTestId('name-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'in-progress' } });
    expect(input.value).toBe('in-progress');

    // Simulate parent re-rendering with a new existingIds array (e.g., another entity was added)
    fireEvent.click(screen.getByTestId('add-existing-id'));

    // formData must survive — no reset should have occurred
    expect((screen.getByTestId('name-input') as HTMLInputElement).value).toBe('in-progress');
  });
});
