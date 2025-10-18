/**
 * Integration Tests - Complete Form Creation Workflow
 *
 * Tests the end-to-end workflow of creating a form:
 * 1. Create program
 * 2. Create form with 5 fields (all types)
 * 3. Assign form to program
 * 4. Add trigger phrases
 * 5. Create CTA referencing form
 * 6. Create branch with CTA assignment
 * 7. Run validation
 * 8. Verify complete workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import {
  createTestProgram,
  createTestFormField,
  resetIdCounter,
  extractValidationErrors,
  resetConfigStore,
} from './testUtils';
import type { FormField } from '@/types/config';

describe('Form Creation Workflow Integration Tests', () => {
  beforeEach(() => {
    resetIdCounter();
    resetConfigStore(useConfigStore);
  });

  it('should complete full form creation workflow successfully', () => {
    const { result } = renderHook(() => useConfigStore());

    // Step 1: Create program
    let programId: string;
    act(() => {
      const program = createTestProgram({
        program_id: 'test-program-1',
        program_name: 'Volunteer Program',
        description: 'Community volunteer opportunities',
      });
      result.current.programs.createProgram(program);
      programId = program.program_id;
    });

    // Verify program created
    expect(result.current.programs.programs[programId]).toBeDefined();
    expect(result.current.programs.programs[programId].program_name).toBe('Volunteer Program');

    // Step 2: Create form with 5 fields (all types)
    let formId: string;
    act(() => {
      result.current.forms.createForm({
        enabled: true,
        form_id: 'volunteer-form',
        program: programId,
        title: 'Volunteer Application',
        description: 'Apply to become a volunteer',
        trigger_phrases: [],
        fields: [],
      });
      formId = 'volunteer-form';
    });

    // Verify form created
    expect(result.current.forms.forms[formId]).toBeDefined();
    expect(result.current.forms.forms[formId].program).toBe(programId);

    // Step 3: Add fields of different types
    const fieldTypes: Array<{ type: FormField['type']; id: string; label: string }> = [
      { type: 'text', id: 'full_name', label: 'Full Name' },
      { type: 'email', id: 'email', label: 'Email Address' },
      { type: 'phone', id: 'phone', label: 'Phone Number' },
      {
        type: 'select',
        id: 'availability',
        label: 'Availability',
      },
      { type: 'textarea', id: 'motivation', label: 'Why do you want to volunteer?' },
    ];

    fieldTypes.forEach((fieldSpec, index) => {
      act(() => {
        const field = createTestFormField({
          id: fieldSpec.id,
          type: fieldSpec.type,
          label: fieldSpec.label,
          prompt: `Please provide your ${fieldSpec.label.toLowerCase()}`,
          required: index < 3, // First 3 required
          ...(fieldSpec.type === 'select'
            ? {
                options: [
                  { value: 'weekdays', label: 'Weekdays' },
                  { value: 'weekends', label: 'Weekends' },
                  { value: 'flexible', label: 'Flexible' },
                ],
              }
            : {}),
        });
        result.current.forms.addField(formId, field);
      });
    });

    // Verify all fields added
    expect(result.current.forms.forms[formId].fields).toHaveLength(5);
    expect(result.current.forms.forms[formId].fields[0].type).toBe('text');
    expect(result.current.forms.forms[formId].fields[1].type).toBe('email');
    expect(result.current.forms.forms[formId].fields[2].type).toBe('phone');
    expect(result.current.forms.forms[formId].fields[3].type).toBe('select');
    expect(result.current.forms.forms[formId].fields[4].type).toBe('textarea');

    // Verify select field has options
    expect(result.current.forms.forms[formId].fields[3].options).toHaveLength(3);

    // Step 4: Add trigger phrases
    act(() => {
      result.current.forms.updateForm(formId, {
        trigger_phrases: ['volunteer', 'volunteer application', 'apply to volunteer', 'sign up'],
      });
    });

    // Verify trigger phrases added
    expect(result.current.forms.forms[formId].trigger_phrases).toHaveLength(4);
    expect(result.current.forms.forms[formId].trigger_phrases).toContain('volunteer');

    // Step 5: Create CTA referencing the form
    let ctaId: string;
    act(() => {
      ctaId = 'volunteer-cta';
      result.current.ctas.createCTA(
        {
          label: 'Apply Now',
          action: 'start_form',
          formId: formId,
          type: 'form_trigger',
          style: 'primary',
        },
        ctaId
      );
    });

    // Verify CTA created
    expect(result.current.ctas.ctas[ctaId]).toBeDefined();
    expect(result.current.ctas.ctas[ctaId].formId).toBe(formId);
    expect(result.current.ctas.ctas[ctaId].action).toBe('start_form');

    // Step 6: Create branch with CTA assignment
    let branchId: string;
    act(() => {
      branchId = 'volunteer-branch';
      result.current.branches.createBranch(
        {
          detection_keywords: ['volunteer', 'volunteering', 'help out'],
          available_ctas: {
            primary: ctaId,
            secondary: [],
          },
        },
        branchId
      );
    });

    // Verify branch created
    expect(result.current.branches.branches[branchId]).toBeDefined();
    expect(result.current.branches.branches[branchId].available_ctas.primary).toBe(ctaId);
    expect(result.current.branches.branches[branchId].detection_keywords).toHaveLength(3);

    // Step 7: Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Verify validation passes
    expect(result.current.validation.isValid).toBe(true);
    const allErrors = extractValidationErrors(result.current.validation);
    expect(allErrors).toHaveLength(0);

    // Step 8: Verify complete integration
    const allPrograms = result.current.programs.getAllPrograms();
    const allForms = result.current.forms.getAllForms();
    const allCTAs = result.current.ctas.getAllCTAs();
    const allBranches = result.current.branches.getAllBranches();

    expect(allPrograms).toHaveLength(1);
    expect(allForms).toHaveLength(1);
    expect(allCTAs).toHaveLength(1);
    expect(allBranches).toHaveLength(1);

    // Verify relationships
    expect(allForms[0].program).toBe(allPrograms[0].program_id);
    expect(allCTAs[0].cta.formId).toBe(allForms[0].form_id);
    expect(allBranches[0].branch.available_ctas.primary).toBe(allCTAs[0].id);
  });

  it('should handle form field reordering', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form
    let programId: string;
    let formId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      result.current.forms.createForm({
        enabled: true,
        form_id: 'test-form',
        program: programId,
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['test'],
        fields: [],
      });
      formId = 'test-form';
    });

    // Add 3 fields
    act(() => {
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field1', label: 'Field 1' })
      );
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field2', label: 'Field 2' })
      );
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field3', label: 'Field 3' })
      );
    });

    // Verify initial order
    expect(result.current.forms.forms[formId].fields[0].label).toBe('Field 1');
    expect(result.current.forms.forms[formId].fields[1].label).toBe('Field 2');
    expect(result.current.forms.forms[formId].fields[2].label).toBe('Field 3');

    // Reorder: move field at index 0 to index 2
    act(() => {
      result.current.forms.reorderFields(formId, 0, 2);
    });

    // Verify new order
    expect(result.current.forms.forms[formId].fields[0].label).toBe('Field 2');
    expect(result.current.forms.forms[formId].fields[1].label).toBe('Field 3');
    expect(result.current.forms.forms[formId].fields[2].label).toBe('Field 1');
  });

  it('should handle form field deletion', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form with fields
    let programId: string;
    let formId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      result.current.forms.createForm({
        enabled: true,
        form_id: 'test-form',
        program: programId,
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['test'],
        fields: [],
      });
      formId = 'test-form';

      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field1', label: 'Field 1' })
      );
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field2', label: 'Field 2' })
      );
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field3', label: 'Field 3' })
      );
    });

    // Verify 3 fields
    expect(result.current.forms.forms[formId].fields).toHaveLength(3);

    // Delete middle field
    act(() => {
      result.current.forms.deleteField(formId, 1);
    });

    // Verify deletion
    expect(result.current.forms.forms[formId].fields).toHaveLength(2);
    expect(result.current.forms.forms[formId].fields[0].label).toBe('Field 1');
    expect(result.current.forms.forms[formId].fields[1].label).toBe('Field 3');
  });

  it('should handle form field updates', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form with field
    let programId: string;
    let formId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      result.current.forms.createForm({
        enabled: true,
        form_id: 'test-form',
        program: programId,
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['test'],
        fields: [],
      });
      formId = 'test-form';

      result.current.forms.addField(
        formId,
        createTestFormField({
          id: 'field1',
          label: 'Old Label',
          required: false,
        })
      );
    });

    // Verify initial state
    expect(result.current.forms.forms[formId].fields[0].label).toBe('Old Label');
    expect(result.current.forms.forms[formId].fields[0].required).toBe(false);

    // Update field
    act(() => {
      result.current.forms.updateField(formId, 0, {
        label: 'New Label',
        required: true,
        hint: 'This is a helpful hint',
      });
    });

    // Verify updates
    expect(result.current.forms.forms[formId].fields[0].label).toBe('New Label');
    expect(result.current.forms.forms[formId].fields[0].required).toBe(true);
    expect(result.current.forms.forms[formId].fields[0].hint).toBe('This is a helpful hint');
  });

  it('should validate form requires program reference', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create form without program
    act(() => {
      result.current.forms.createForm({
        enabled: true,
        form_id: 'orphan-form',
        program: '', // Missing program
        title: 'Orphan Form',
        description: 'Form with no program',
        trigger_phrases: ['test'],
        fields: [
          createTestFormField({
            id: 'field1',
            label: 'Test Field',
          }),
        ],
      });
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Verify validation fails
    expect(result.current.validation.isValid).toBe(false);
    const errors = extractValidationErrors(result.current.validation);
    expect(errors.some((e) => e.includes('Program'))).toBe(true);
  });

  it('should warn when form has no trigger phrases', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create program and form
    let programId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      result.current.forms.createForm({
        enabled: true,
        form_id: 'test-form',
        program: programId,
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: [], // No trigger phrases
        fields: [createTestFormField({ id: 'field1' })],
      });
    });

    // Run validation
    act(() => {
      result.current.validation.validateAll();
    });

    // Should pass validation but have warnings
    expect(result.current.validation.isValid).toBe(true);
    const formResult = result.current.validation.formResults['test-form'];
    expect(formResult?.warnings.length).toBeGreaterThan(0);
    expect(formResult?.warnings.some((w) => w.message.includes('trigger phrases'))).toBe(true);
  });

  it('should duplicate form with all fields and relationships', () => {
    const { result } = renderHook(() => useConfigStore();

    // Create program and form
    let programId: string;
    let formId: string;
    act(() => {
      const program = createTestProgram({ program_id: 'test-program' });
      result.current.programs.createProgram(program);
      programId = program.program_id;

      result.current.forms.createForm({
        enabled: true,
        form_id: 'original-form',
        program: programId,
        title: 'Original Form',
        description: 'Original description',
        trigger_phrases: ['original', 'test'],
        fields: [],
      });
      formId = 'original-form';

      // Add fields
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field1', label: 'Field 1' })
      );
      result.current.forms.addField(
        formId,
        createTestFormField({ id: 'field2', label: 'Field 2' })
      );
    });

    // Duplicate form
    act(() => {
      result.current.forms.duplicateForm(formId);
    });

    // Verify duplicate created
    const allForms = result.current.forms.getAllForms();
    expect(allForms).toHaveLength(2);

    const duplicateForm = allForms.find((f) => f.form_id !== formId);
    expect(duplicateForm).toBeDefined();
    expect(duplicateForm!.title).toContain('Copy');
    expect(duplicateForm!.program).toBe(programId);
    expect(duplicateForm!.fields).toHaveLength(2);
    expect(duplicateForm!.trigger_phrases).toEqual(['original', 'test']);
  });
});
