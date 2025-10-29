/**
 * Forms Duplicate Feature Test
 * Tests the copy/duplicate functionality for forms with user-provided form IDs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigStore } from '@/store';
import type { ConversationalForm } from '@/types/config';

describe('Forms Duplicate Feature', () => {
  let promptMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock window.prompt to return a default value
    promptMock = vi.spyOn(window, 'prompt');
  });

  afterEach(() => {
    // Restore the original prompt
    promptMock.mockRestore();
  });

  it('should duplicate a form with user-provided ID', () => {
    const { result } = renderHook(() => useConfigStore());

    // Mock prompt to return user's desired form ID
    promptMock.mockReturnValue('dare_to_dream');

    // Create original form
    const originalForm: ConversationalForm = {
      form_id: 'love_box',
      title: 'Love Box Form',
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
      result.current.forms.duplicateForm('love_box');
    });

    // Verify prompt was called with correct message
    expect(promptMock).toHaveBeenCalledWith(
      'Enter a new Form ID for the copy of "Love Box Form":',
      'love_box_copy'
    );

    // Get all forms after duplication
    const allForms = Object.values(result.current.forms.forms);
    expect(allForms.length).toBeGreaterThan(formsBeforeDuplicate);

    // Find the copied form (it will have the user-provided ID)
    const copiedForm = allForms.find((f) => f.form_id === 'dare_to_dream');

    // Verify copied form exists with correct ID
    expect(copiedForm).toBeDefined();
    expect(copiedForm?.title).toBe('Love Box Form (Copy)');
    expect(copiedForm?.form_id).toBe('dare_to_dream');

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

    // Mock prompt
    promptMock.mockReturnValue('independent_copy');

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

    const copiedFormId = 'independent_copy';

    // Modify the copied form
    act(() => {
      result.current.forms.updateForm(copiedFormId, {
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
    expect(result.current.forms.forms[copiedFormId].title).toBe('Modified Copy');
    expect(result.current.forms.forms[copiedFormId].description).toBe('Modified description');
  });

  it('should copy complex forms with multiple fields and post-submission actions', () => {
    const { result } = renderHook(() => useConfigStore());

    // Mock prompt
    promptMock.mockReturnValue('complex_copy');

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

    const copiedFormId = 'complex_copy';
    const copiedForm = result.current.forms.forms[copiedFormId];

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

  it('should handle duplication cancellation gracefully', () => {
    const { result } = renderHook(() => useConfigStore());

    // Mock prompt to return null (user cancelled)
    promptMock.mockReturnValue(null);

    // Create form
    const form: ConversationalForm = {
      form_id: 'test_form',
      title: 'Test Form',
      description: '',
      program: 'test',
      enabled: true,
      trigger_phrases: [],
      fields: [],
    };

    act(() => {
      result.current.forms.createForm(form);
    });

    const formsCountBefore = Object.keys(result.current.forms.forms).length;

    // Attempt to duplicate but user cancels
    act(() => {
      result.current.forms.duplicateForm('test_form');
    });

    // Verify no new forms were created
    const formsCountAfter = Object.keys(result.current.forms.forms).length;
    expect(formsCountAfter).toBe(formsCountBefore);
  });

  it('should prevent duplicate form IDs', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create two forms
    act(() => {
      result.current.forms.createForm({
        form_id: 'existing_form',
        title: 'Existing Form',
        description: '',
        program: 'test',
        enabled: true,
        trigger_phrases: [],
        fields: [],
      });

      result.current.forms.createForm({
        form_id: 'form_to_copy',
        title: 'Form to Copy',
        description: '',
        program: 'test',
        enabled: true,
        trigger_phrases: [],
        fields: [],
      });
    });

    // Mock prompt to return existing form ID
    promptMock.mockReturnValue('existing_form');

    const formsCountBefore = Object.keys(result.current.forms.forms).length;

    // Attempt to duplicate with existing ID
    act(() => {
      result.current.forms.duplicateForm('form_to_copy');
    });

    // Verify no new forms were created
    const formsCountAfter = Object.keys(result.current.forms.forms).length;
    expect(formsCountAfter).toBe(formsCountBefore);
  });

  it('should regenerate all field IDs to avoid conflicts', () => {
    const { result } = renderHook(() => useConfigStore());

    // Mock prompt
    promptMock.mockReturnValue('field_id_copy');

    // Create form with explicit field id values
    const formWithFieldIds: ConversationalForm = {
      form_id: 'field_id_test',
      title: 'Field ID Test Form',
      description: 'Testing field ID regeneration',
      program: 'test',
      enabled: true,
      trigger_phrases: [],
      fields: [
        {
          id: 'name_field',
          type: 'text',
          label: 'Name',
          prompt: 'What is your name?',
          required: true,
        },
        {
          id: 'email_field',
          type: 'email',
          label: 'Email',
          prompt: 'What is your email?',
          required: true,
        },
        {
          id: 'phone_field',
          type: 'phone',
          label: 'Phone',
          prompt: 'What is your phone?',
          required: false,
        },
      ],
    };

    act(() => {
      result.current.forms.createForm(formWithFieldIds);
    });

    // Duplicate the form
    act(() => {
      result.current.forms.duplicateForm('field_id_test');
    });

    const originalForm = result.current.forms.forms['field_id_test'];
    const copiedForm = result.current.forms.forms['field_id_copy'];

    // Verify all field IDs are different from original
    expect(copiedForm.fields).toHaveLength(3);
    copiedForm.fields.forEach((copiedField, index) => {
      const originalField = originalForm.fields[index];

      // Field IDs should be different
      expect(copiedField.id).not.toBe(originalField.id);
      expect(copiedField.id).toContain('_copy_');

      // But other properties should be the same
      expect(copiedField.label).toBe(originalField.label);
      expect(copiedField.type).toBe(originalField.type);
      expect(copiedField.prompt).toBe(originalField.prompt);
      expect(copiedField.required).toBe(originalField.required);
    });
  });

  it('should validate form ID format', () => {
    const { result } = renderHook(() => useConfigStore());

    // Create form
    act(() => {
      result.current.forms.createForm({
        form_id: 'test_form',
        title: 'Test Form',
        description: '',
        program: 'test',
        enabled: true,
        trigger_phrases: [],
        fields: [],
      });
    });

    // Mock prompt to return invalid form ID (uppercase)
    promptMock.mockReturnValue('Invalid_Form_ID');

    const formsCountBefore = Object.keys(result.current.forms.forms).length;

    // Attempt to duplicate with invalid ID
    act(() => {
      result.current.forms.duplicateForm('test_form');
    });

    // Verify no new forms were created
    const formsCountAfter = Object.keys(result.current.forms.forms).length;
    expect(formsCountAfter).toBe(formsCountBefore);
  });
});
