/**
 * ValidationItem — inline Fix-it rendering contract
 *
 * The program picker must appear exactly when the issue is fixable from the
 * panel: a form-program error on a real form with no program, while programs
 * exist to pick from. Applying the fix itself is store behavior covered by
 * the forms-slice tests (updateForm → validateAll).
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ValidationItem } from '../ValidationItem';
import { useConfigStore } from '@/store';
import type { ValidationError } from '@/lib/validation/types';

const programError: ValidationError = {
  level: 'error',
  message: '❌ Program reference is required',
  field: 'program',
  entityType: 'form',
  entityId: 'orphan_form',
};

function renderItem(entityId: string, issue: ValidationError = programError) {
  return render(
    <MemoryRouter>
      <ValidationItem issue={issue} entityId={entityId} entityType="form" />
    </MemoryRouter>
  );
}

describe('ValidationItem inline program fix', () => {
  beforeEach(() => {
    useConfigStore.setState((state) => {
      state.programs.programs = {
        p1: { program_id: 'p1', program_name: 'Program One' },
      };
      state.forms.forms = {
        orphan_form: {
          enabled: true,
          form_id: 'orphan_form',
          program: '',
          title: 'Orphan',
          description: '',
          trigger_phrases: [],
          fields: [],
        },
      };
    });
  });

  it('renders the program picker for a form-program error', () => {
    renderItem('orphan_form');
    expect(screen.getByText('Assign a program…')).toBeInTheDocument();
  });

  it('renders the picker for relationship-prefixed entity ids (form-*)', () => {
    renderItem('form-orphan_form', { ...programError, entityId: 'form-orphan_form' });
    expect(screen.getByText('Assign a program…')).toBeInTheDocument();
  });

  it('does not render the picker for non-program issues', () => {
    renderItem('orphan_form', {
      ...programError,
      field: 'fields[0].subfields',
      message: 'Composite field must have subfields defined',
    });
    expect(screen.queryByText('Assign a program…')).not.toBeInTheDocument();
  });

  it('does not render the picker when the form already has a program', () => {
    useConfigStore.setState((state) => {
      state.forms.forms.orphan_form.program = 'p1';
    });
    renderItem('orphan_form');
    expect(screen.queryByText('Assign a program…')).not.toBeInTheDocument();
  });

  it('does not render the picker when there are no programs to assign', () => {
    useConfigStore.setState((state) => {
      state.programs.programs = {};
    });
    renderItem('orphan_form');
    expect(screen.queryByText('Assign a program…')).not.toBeInTheDocument();
  });
});
