/**
 * Form Validation Tests
 * Comprehensive tests for form validation rules
 */

import { describe, it, expect } from 'vitest';
import { validateForm, validateForms } from '../formValidation';
import type { ConversationalForm, Program, FormField } from '@/types/config';

describe('Form Validation', () => {
  const mockProgram: Program = {
    program_id: 'test-program',
    program_name: 'Test Program',
  };

  const allPrograms = { 'test-program': mockProgram };

  const mockField: FormField = {
    id: 'name',
    type: 'text',
    label: 'Name',
    prompt: 'What is your name?',
    required: true,
  };

  describe('program reference validation', () => {
    it('should require program reference', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: '', // Missing program
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [mockField],
      };

      const result = validateForm(form, 'test-form', {});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Program'))).toBe(true);
    });

    it('should error if program does not exist', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'nonexistent-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [mockField],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
    });

    it('should validate successfully with valid program', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['apply'],
        fields: [mockField],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('field validation', () => {
    it('should require at least one field', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [], // No fields
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('field'))).toBe(true);
    });

    it('should detect duplicate field IDs', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          { id: 'name', type: 'text', label: 'Name', prompt: 'Name?', required: true },
          { id: 'name', type: 'email', label: 'Email', prompt: 'Email?', required: true },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(false);
      // Current message starts with "Duplicate field ID" — match case-insensitively.
      expect(result.errors.some((e) => e.message.toLowerCase().includes('duplicate'))).toBe(true);
    });

    it('should require options for select fields', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          {
            id: 'category',
            type: 'select',
            label: 'Category',
            prompt: 'Select category',
            required: true,
            options: [], // Empty options
          },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('options'))).toBe(true);
    });

    it('should require failure_message for eligibility gates', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          {
            id: 'age',
            type: 'number',
            label: 'Age',
            prompt: 'How old are you?',
            required: true,
            eligibility_gate: true,
            // Missing failure_message
          },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('failure message'))).toBe(true);
    });

    it('should validate select field with options', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          {
            id: 'category',
            type: 'select',
            label: 'Category',
            prompt: 'Select category',
            required: true,
            options: [
              { value: 'A', label: 'Option A' },
              { value: 'B', label: 'Option B' },
            ],
          },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn if no required fields', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          { id: 'name', type: 'text', label: 'Name', prompt: 'Name?', required: false },
          { id: 'email', type: 'email', label: 'Email', prompt: 'Email?', required: false },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('required'))).toBe(true);
    });
  });

  describe('trigger phrase validation', () => {
    // Note: trigger phrase validation was removed when forms moved to explicit
    // CTA routing. `validateTriggerPhrases` in formValidation.ts is now a no-op.
    // Empty or populated trigger_phrases should both validate cleanly.
    it('should not warn about trigger phrases either way (feature removed)', () => {
      const emptyForm: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: [],
        fields: [mockField],
      };
      const populatedForm: ConversationalForm = {
        ...emptyForm,
        trigger_phrases: ['apply', 'application'],
      };

      const emptyResult = validateForm(emptyForm, 'test-form', allPrograms);
      const populatedResult = validateForm(populatedForm, 'test-form', allPrograms);

      expect(emptyResult.valid).toBe(true);
      expect(populatedResult.valid).toBe(true);
      expect(emptyResult.warnings.filter((w) => w.message.toLowerCase().includes('trigger'))).toHaveLength(0);
      expect(populatedResult.warnings.filter((w) => w.message.toLowerCase().includes('trigger'))).toHaveLength(0);
    });
  });

  describe('quality validation', () => {
    it('should warn if form has too many fields (>10)', () => {
      const fields: FormField[] = Array.from({ length: 12 }, (_, i) => ({
        id: `field-${i}`,
        type: 'text' as const,
        label: `Field ${i}`,
        prompt: `Field ${i}?`,
        required: false,
      }));

      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields,
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('too many'))).toBe(true);
    });

    // Note: email/phone format-validation suggestions were removed. The
    // comment in formValidation.ts explains: "Email and phone field types
    // inherently provide format validation — No additional warnings needed."
    it('should not warn about email fields (inherent format validation)', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          {
            id: 'email',
            type: 'email',
            label: 'Email',
            prompt: 'What is your email?',
            required: true,
          },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(true);
      expect(result.warnings.filter((w) => w.message.toLowerCase().includes('email'))).toHaveLength(0);
    });

    it('should not warn about phone fields (inherent format validation)', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: ['test'],
        fields: [
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone',
            prompt: 'What is your phone number?',
            required: true,
          },
        ],
      };

      const result = validateForm(form, 'test-form', allPrograms);
      expect(result.valid).toBe(true);
      expect(result.warnings.filter((w) => w.message.toLowerCase().includes('phone'))).toHaveLength(0);
    });
  });

  describe('bulk form validation', () => {
    it('should validate all forms', () => {
      const forms: Record<string, ConversationalForm> = {
        'form-1': {
          enabled: true,
          form_id: 'form-1',
          program: 'test-program',
          title: 'Form 1',
          description: 'Test',
          trigger_phrases: ['apply'],
          fields: [mockField],
        },
        'form-2': {
          enabled: true,
          form_id: 'form-2',
          program: '', // Invalid
          title: 'Form 2',
          description: 'Test',
          trigger_phrases: ['help'],
          fields: [mockField],
        },
      };

      const result = validateForms(forms, allPrograms);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should collect all errors from multiple forms', () => {
      const forms: Record<string, ConversationalForm> = {
        'form-1': {
          enabled: true,
          form_id: 'form-1',
          program: '',
          title: 'Form 1',
          description: 'Test',
          trigger_phrases: [],
          fields: [],
        },
        'form-2': {
          enabled: true,
          form_id: 'form-2',
          program: 'nonexistent',
          title: 'Form 2',
          description: 'Test',
          trigger_phrases: [],
          fields: [],
        },
      };

      const result = validateForms(forms, allPrograms);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
