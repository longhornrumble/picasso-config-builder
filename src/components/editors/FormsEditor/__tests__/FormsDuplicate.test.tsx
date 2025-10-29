/**
 * Forms Duplicate Feature Test
 * Tests the copy/duplicate functionality for forms
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import type { ConversationalForm } from '@/types/config';

describe('Forms Duplicate Feature', () => {
  it('should duplicate a form with new ID and title', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create original form
    const originalForm: ConversationalForm = {
      form_id: 'test_duplicate_1',
      title: 'Test Form',
      description: 'A test form',
      program: 'test_program',
      enabled: true,
      trigger_phrases: ['test trigger'],
      fields: [
        {
          id: 'field_1',
          type: 'text',
          label: 'Name',
          prompt: 'What is your name?',
          required: true,
        },
      ],
    };

    act(() => {
      result.current.forms.createForm(originalForm);
    });

    // Get forms count before duplication
    const formsBeforeDuplicate = Object.keys(result.current.forms.forms).length;

    // Duplicate the form
    act(() => {
      result.current.forms.duplicateForm('test_duplicate_1');
    });

    // Get all forms after duplication
    const allForms = Object.values(result.current.forms.forms);
    expect(allForms.length).toBeGreaterThan(formsBeforeDuplicate);

    // Find the copied form (it will have "_copy_" in the ID)
    const copiedForm = allForms.find(
      (f) => f.form_id !== 'test_duplicate_1' && f.form_id.startsWith('test_duplicate_1_copy_')
    );

    // Verify copied form exists
    expect(copiedForm).toBeDefined();
    expect(copiedForm?.title).toBe('Test Form (Copy)');
    expect(copiedForm?.form_id).toContain('test_duplicate_1_copy_');
    expect(copiedForm?.form_id).not.toBe('test_duplicate_1');

    // Verify all fields are copied
    expect(copiedForm?.fields).toHaveLength(1);
    expect(copiedForm?.fields[0].label).toBe('Name');
    expect(copiedForm?.fields[0].prompt).toBe('What is your name?');
    expect(copiedForm?.fields[0].required).toBe(true);

    // Verify other properties are copied
    expect(copiedForm?.description).toBe('A test form');
    expect(copiedForm?.program).toBe('test_program');
    expect(copiedForm?.enabled).toBe(true);
    expect(copiedForm?.trigger_phrases).toEqual(['test trigger']);
  });

  it('should create independent copies that can be modified separately', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create original form with unique ID
    const originalForm: ConversationalForm = {
      form_id: 'independent_test_original',
      title: 'Original Form',
      description: 'Original description',
      program: 'test_program',
      enabled: true,
      trigger_phrases: [],
      fields: [
        {
          id: 'field_1',
          type: 'email',
          label: 'Email',
          prompt: 'What is your email?',
          required: true,
        },
      ],
    };

    act(() => {
      result.current.forms.createForm(originalForm);
    });

    // Duplicate the form
    act(() => {
      result.current.forms.duplicateForm('independent_test_original');
    });

    // Get the copied form ID
    const allFormIds = Object.keys(result.current.forms.forms);
    const copiedFormId = allFormIds.find(
      (id) => id.startsWith('independent_test_original_copy_')
    );
    expect(copiedFormId).toBeDefined();

    // Modify the copied form
    act(() => {
      result.current.forms.updateForm(copiedFormId!, {
        title: 'Modified Copy',
        description: 'Modified description',
      });
    });

    // Verify original form is unchanged
    expect(result.current.forms.forms['independent_test_original'].title).toBe('Original Form');
    expect(result.current.forms.forms['independent_test_original'].description).toBe(
      'Original description'
    );

    // Verify copied form is modified
    expect(result.current.forms.forms[copiedFormId!].title).toBe('Modified Copy');
    expect(result.current.forms.forms[copiedFormId!].description).toBe('Modified description');
  });

  it('should copy complex forms with multiple fields and post-submission actions', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create complex form with unique ID
    const complexForm: ConversationalForm = {
      form_id: 'complex_test_form',
      title: 'Complex Form',
      description: 'A complex form with many features',
      program: 'advanced_program',
      enabled: true,
      trigger_phrases: ['start', 'begin', 'register'],
      fields: [
        {
          id: 'field_1',
          type: 'text',
          label: 'First Name',
          prompt: 'What is your first name?',
          required: true,
        },
        {
          id: 'field_2',
          type: 'email',
          label: 'Email',
          prompt: 'What is your email address?',
          required: true,
          validation: {
            pattern: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
            message: 'Please enter a valid email address',
          },
        },
        {
          id: 'field_3',
          type: 'phone',
          label: 'Phone',
          prompt: 'What is your phone number?',
          required: false,
        },
      ],
      post_submission: {
        message: 'Thank you for submitting!',
        actions: [
          {
            action: 'redirect',
            url: 'https://example.com/thanks',
          },
        ],
      },
    };

    act(() => {
      result.current.forms.createForm(complexForm);
    });

    // Duplicate the complex form
    act(() => {
      result.current.forms.duplicateForm('complex_test_form');
    });

    // Get the copied form
    const allFormIds = Object.keys(result.current.forms.forms);
    const copiedFormId = allFormIds.find((id) => id.startsWith('complex_test_form_copy_'));
    expect(copiedFormId).toBeDefined();

    const copiedForm = result.current.forms.forms[copiedFormId!];

    // Verify all fields are copied
    expect(copiedForm.fields).toHaveLength(3);
    expect(copiedForm.fields[0].type).toBe('text');
    expect(copiedForm.fields[1].type).toBe('email');
    expect(copiedForm.fields[1].validation).toBeDefined();
    expect(copiedForm.fields[2].type).toBe('phone');

    // Verify trigger phrases are copied
    expect(copiedForm.trigger_phrases).toEqual(['start', 'begin', 'register']);

    // Verify post-submission actions are copied
    expect(copiedForm.post_submission?.message).toBe('Thank you for submitting!');
    expect(copiedForm.post_submission?.actions).toHaveLength(1);
    expect(copiedForm.post_submission?.actions[0].action).toBe('redirect');
  });

  it('should handle duplication of non-existent form gracefully', () => {
    const { result } = renderHook(() => useConfigStore());

    // Get forms count before attempting duplication
    const formsCountBefore = Object.keys(result.current.forms.forms).length;

    // Attempt to duplicate non-existent form
    act(() => {
      result.current.forms.duplicateForm('non_existent_unique_form_id');
    });

    // Verify no new forms were created
    const formsCountAfter = Object.keys(result.current.forms.forms).length;
    expect(formsCountAfter).toBe(formsCountBefore);
  });

  it('should allow copying a copied form (copy of copy)', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create original form with unique ID
    const originalForm: ConversationalForm = {
      form_id: 'copy_of_copy_test',
      title: 'Original',
      description: '',
      program: '',
      enabled: true,
      trigger_phrases: [],
      fields: [],
    };

    act(() => {
      result.current.forms.createForm(originalForm);
    });

    // First duplication
    act(() => {
      result.current.forms.duplicateForm('copy_of_copy_test');
    });

    // Get first copy ID
    const allFormIdsAfterFirst = Object.keys(result.current.forms.forms);
    const firstCopyId = allFormIdsAfterFirst.find((id) =>
      id.startsWith('copy_of_copy_test_copy_')
    );
    expect(firstCopyId).toBeDefined();

    // Second duplication (copy of copy)
    act(() => {
      result.current.forms.duplicateForm(firstCopyId!);
    });

    // Verify we now have 3 forms total for this specific test pattern
    const allFormIdsAfterSecond = Object.keys(result.current.forms.forms);
    const testForms = allFormIdsAfterSecond.filter(
      (id) => id === 'copy_of_copy_test' || id.startsWith('copy_of_copy_test_copy_')
    );
    expect(testForms.length).toBe(3); // original + first copy + second copy

    // Verify the second copy has "(Copy)" in its title
    const allForms = Object.values(result.current.forms.forms);
    const secondCopy = allForms.find(
      (f) =>
        f.form_id !== 'copy_of_copy_test' &&
        f.form_id !== firstCopyId &&
        f.form_id.includes('copy_of_copy_test_copy_')
    );
    expect(secondCopy?.title).toBe('Original (Copy) (Copy)');
  });
});
