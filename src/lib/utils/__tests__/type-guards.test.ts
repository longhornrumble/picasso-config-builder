/**
 * Type Guards Tests
 * Comprehensive tests for runtime type checking utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isFormCTA,
  isExternalLinkCTA,
  isSendQueryCTA,
  isShowInfoCTA,
  isSelectField,
  isEligibilityGateField,
  isRequiredField,
  isValidationError,
  isValidationWarning,
  isEndConversationAction,
  isContinueConversationAction,
  isStartFormAction,
  isExternalLinkAction,
  isDefined,
  isNonEmptyString,
  isNonEmptyArray,
  hasProperty,
  isValidBranch,
  isValidForm,
  isValidCTA,
  isValidHexColor,
  isValidURL,
  isValidEmail,
  isValidID,
} from '../type-guards';
import type {
  CTADefinition,
  FormField,
  ValidationIssue,
  PostSubmissionAction,
  ConversationBranch,
  ConversationalForm,
} from '@/types/config';

describe('Type Guards', () => {
  describe('CTA type guards', () => {
    describe('isFormCTA', () => {
      it('should identify form CTAs', () => {
        const cta: CTADefinition = {
          label: 'Apply',
          action: 'start_form',
          formId: 'test-form',
          type: 'form_trigger',
          style: 'primary',
        };

        expect(isFormCTA(cta)).toBe(true);
      });

      it('should reject CTAs without formId', () => {
        const cta: CTADefinition = {
          label: 'Apply',
          action: 'start_form',
          type: 'form_trigger',
          style: 'primary',
        };

        expect(isFormCTA(cta)).toBe(false);
      });

      it('should reject non-form CTAs', () => {
        const cta: CTADefinition = {
          label: 'Link',
          action: 'external_link',
          url: 'https://example.com',
          type: 'external_link',
          style: 'primary',
        };

        expect(isFormCTA(cta)).toBe(false);
      });
    });

    describe('isExternalLinkCTA', () => {
      it('should identify external link CTAs', () => {
        const cta: CTADefinition = {
          label: 'Visit',
          action: 'external_link',
          url: 'https://example.com',
          type: 'external_link',
          style: 'primary',
        };

        expect(isExternalLinkCTA(cta)).toBe(true);
      });

      it('should reject CTAs without url', () => {
        const cta: CTADefinition = {
          label: 'Visit',
          action: 'external_link',
          type: 'external_link',
          style: 'primary',
        };

        expect(isExternalLinkCTA(cta)).toBe(false);
      });
    });

    describe('isSendQueryCTA', () => {
      it('should identify send query CTAs', () => {
        const cta: CTADefinition = {
          label: 'Ask',
          action: 'send_query',
          query: 'What are the requirements?',
          type: 'bedrock_query',
          style: 'primary',
        };

        expect(isSendQueryCTA(cta)).toBe(true);
      });

      it('should reject CTAs without query', () => {
        const cta: CTADefinition = {
          label: 'Ask',
          action: 'send_query',
          type: 'bedrock_query',
          style: 'primary',
        };

        expect(isSendQueryCTA(cta)).toBe(false);
      });
    });

    describe('isShowInfoCTA', () => {
      it('should identify show info CTAs', () => {
        const cta: CTADefinition = {
          label: 'Learn More',
          action: 'show_info',
          prompt: 'Tell me about eligibility',
          type: 'show_info',
          style: 'secondary',
        };

        expect(isShowInfoCTA(cta)).toBe(true);
      });

      it('should reject CTAs without prompt', () => {
        const cta: CTADefinition = {
          label: 'Learn More',
          action: 'show_info',
          type: 'show_info',
          style: 'secondary',
        };

        expect(isShowInfoCTA(cta)).toBe(false);
      });
    });
  });

  describe('form field type guards', () => {
    describe('isSelectField', () => {
      it('should identify select fields', () => {
        const field: FormField = {
          id: 'category',
          type: 'select',
          label: 'Category',
          prompt: 'Select category',
          required: true,
          options: [
            { value: 'A', label: 'Option A' },
            { value: 'B', label: 'Option B' },
          ],
        };

        expect(isSelectField(field)).toBe(true);
      });

      it('should reject fields without options', () => {
        const field: FormField = {
          id: 'category',
          type: 'select',
          label: 'Category',
          prompt: 'Select category',
          required: true,
          options: [],
        };

        expect(isSelectField(field)).toBe(false);
      });

      it('should reject non-select fields', () => {
        const field: FormField = {
          id: 'name',
          type: 'text',
          label: 'Name',
          prompt: 'What is your name?',
          required: true,
        };

        expect(isSelectField(field)).toBe(false);
      });
    });

    describe('isEligibilityGateField', () => {
      it('should identify eligibility gate fields', () => {
        const field: FormField = {
          id: 'age',
          type: 'number',
          label: 'Age',
          prompt: 'How old are you?',
          required: true,
          eligibility_gate: true,
          failure_message: 'You do not meet the age requirement',
        };

        expect(isEligibilityGateField(field)).toBe(true);
      });

      it('should reject fields without failure_message', () => {
        const field: FormField = {
          id: 'age',
          type: 'number',
          label: 'Age',
          prompt: 'How old are you?',
          required: true,
          eligibility_gate: true,
        };

        expect(isEligibilityGateField(field)).toBe(false);
      });

      it('should reject non-eligibility fields', () => {
        const field: FormField = {
          id: 'name',
          type: 'text',
          label: 'Name',
          prompt: 'What is your name?',
          required: true,
        };

        expect(isEligibilityGateField(field)).toBe(false);
      });
    });

    describe('isRequiredField', () => {
      it('should identify required fields', () => {
        const field: FormField = {
          id: 'email',
          type: 'email',
          label: 'Email',
          prompt: 'Email?',
          required: true,
        };

        expect(isRequiredField(field)).toBe(true);
      });

      it('should reject optional fields', () => {
        const field: FormField = {
          id: 'nickname',
          type: 'text',
          label: 'Nickname',
          prompt: 'Nickname?',
          required: false,
        };

        expect(isRequiredField(field)).toBe(false);
      });
    });
  });

  describe('validation type guards', () => {
    describe('isValidationError', () => {
      it('should identify validation errors', () => {
        const issue: ValidationIssue = {
          severity: 'error',
          message: 'Field is required',
          field: 'name',
        };

        expect(isValidationError(issue)).toBe(true);
      });

      it('should reject warnings', () => {
        const issue: ValidationIssue = {
          severity: 'warning',
          message: 'Consider adding this field',
        };

        expect(isValidationError(issue)).toBe(false);
      });
    });

    describe('isValidationWarning', () => {
      it('should identify validation warnings', () => {
        const issue: ValidationIssue = {
          severity: 'warning',
          message: 'Consider improving this',
        };

        expect(isValidationWarning(issue)).toBe(true);
      });

      it('should reject errors', () => {
        const issue: ValidationIssue = {
          severity: 'error',
          message: 'This is required',
        };

        expect(isValidationWarning(issue)).toBe(false);
      });
    });
  });

  describe('post-submission action type guards', () => {
    describe('isEndConversationAction', () => {
      it('should identify end conversation actions', () => {
        const action: PostSubmissionAction = {
          action: 'end_conversation',
        };

        expect(isEndConversationAction(action)).toBe(true);
      });
    });

    describe('isContinueConversationAction', () => {
      it('should identify continue conversation actions', () => {
        const action: PostSubmissionAction = {
          action: 'continue_conversation',
        };

        expect(isContinueConversationAction(action)).toBe(true);
      });
    });

    describe('isStartFormAction', () => {
      it('should identify start form actions', () => {
        const action: PostSubmissionAction = {
          action: 'start_form',
          formId: 'next-form',
        };

        expect(isStartFormAction(action)).toBe(true);
      });
    });

    describe('isExternalLinkAction', () => {
      it('should identify external link actions', () => {
        const action: PostSubmissionAction = {
          action: 'external_link',
          url: 'https://example.com',
        };

        expect(isExternalLinkAction(action)).toBe(true);
      });
    });
  });

  describe('entity existence guards', () => {
    describe('isDefined', () => {
      it('should accept defined values', () => {
        expect(isDefined('value')).toBe(true);
        expect(isDefined(0)).toBe(true);
        expect(isDefined(false)).toBe(true);
        expect(isDefined('')).toBe(true);
      });

      it('should reject null and undefined', () => {
        expect(isDefined(null)).toBe(false);
        expect(isDefined(undefined)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('should accept non-empty strings', () => {
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString(' ')).toBe(true);
      });

      it('should reject empty strings', () => {
        expect(isNonEmptyString('')).toBe(false);
      });

      it('should reject non-strings', () => {
        expect(isNonEmptyString(123)).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
      });
    });

    describe('isNonEmptyArray', () => {
      it('should accept non-empty arrays', () => {
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
        expect(isNonEmptyArray(['a'])).toBe(true);
      });

      it('should reject empty arrays', () => {
        expect(isNonEmptyArray([])).toBe(false);
      });

      it('should reject non-arrays', () => {
        expect(isNonEmptyArray('array')).toBe(false);
        expect(isNonEmptyArray(null)).toBe(false);
      });
    });

    describe('hasProperty', () => {
      it('should detect object properties', () => {
        const obj = { name: 'test', value: 123 };
        expect(hasProperty(obj, 'name')).toBe(true);
        expect(hasProperty(obj, 'value')).toBe(true);
      });

      it('should reject missing properties', () => {
        const obj = { name: 'test' };
        expect(hasProperty(obj, 'missing')).toBe(false);
      });

      it('should reject non-objects', () => {
        expect(hasProperty(null, 'prop')).toBe(false);
        expect(hasProperty('string', 'prop')).toBe(false);
      });
    });
  });

  describe('config entity type guards', () => {
    describe('isValidBranch', () => {
      it('should validate valid branches', () => {
        const branch: ConversationBranch = {
          detection_keywords: ['housing', 'rental'],
          available_ctas: {
            primary: 'apply-cta',
            secondary: [],
          },
        };

        expect(isValidBranch(branch)).toBe(true);
      });

      it('should reject branches without keywords', () => {
        const branch = {
          detection_keywords: [],
          available_ctas: {
            primary: 'cta',
            secondary: [],
          },
        };

        expect(isValidBranch(branch)).toBe(false);
      });

      it('should reject invalid structures', () => {
        expect(isValidBranch(null)).toBe(false);
        expect(isValidBranch('branch')).toBe(false);
        expect(isValidBranch({})).toBe(false);
      });
    });

    describe('isValidForm', () => {
      it('should validate valid forms', () => {
        const form: ConversationalForm = {
          enabled: true,
          form_id: 'test-form',
          program: 'test-program',
          title: 'Test Form',
          description: 'Test',
          trigger_phrases: ['apply'],
          fields: [{ id: 'name', type: 'text', label: 'Name', prompt: 'Name?', required: true }],
        };

        expect(isValidForm(form)).toBe(true);
      });

      it('should reject forms without required fields', () => {
        const form = {
          enabled: true,
          form_id: '',
          program: 'test-program',
          title: 'Test Form',
          fields: [],
        };

        expect(isValidForm(form)).toBe(false);
      });
    });

    describe('isValidCTA', () => {
      it('should validate valid CTAs', () => {
        const cta: CTADefinition = {
          label: 'Apply',
          action: 'start_form',
          formId: 'test-form',
          type: 'form_trigger',
          style: 'primary',
        };

        expect(isValidCTA(cta)).toBe(true);
      });

      it('should reject CTAs with invalid action', () => {
        const cta = {
          label: 'Invalid',
          action: 'invalid_action',
          type: 'unknown',
          style: 'primary',
        };

        expect(isValidCTA(cta)).toBe(false);
      });
    });
  });

  describe('utility guards', () => {
    describe('isValidHexColor', () => {
      it('should validate hex colors', () => {
        expect(isValidHexColor('#000000')).toBe(true);
        expect(isValidHexColor('#FFFFFF')).toBe(true);
        expect(isValidHexColor('#abc123')).toBe(true);
      });

      it('should reject invalid hex colors', () => {
        expect(isValidHexColor('#FFF')).toBe(false);
        expect(isValidHexColor('000000')).toBe(false);
        expect(isValidHexColor('#GGGGGG')).toBe(false);
        expect(isValidHexColor('red')).toBe(false);
      });
    });

    describe('isValidURL', () => {
      it('should validate URLs', () => {
        expect(isValidURL('https://example.com')).toBe(true);
        expect(isValidURL('http://localhost:3000')).toBe(true);
        expect(isValidURL('ftp://files.example.com')).toBe(true);
      });

      it('should reject invalid URLs', () => {
        expect(isValidURL('not a url')).toBe(false);
        expect(isValidURL('example.com')).toBe(false);
        expect(isValidURL('')).toBe(false);
      });
    });

    describe('isValidEmail', () => {
      it('should validate email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('')).toBe(false);
      });
    });

    describe('isValidID', () => {
      it('should validate ID formats', () => {
        expect(isValidID('test_id')).toBe(true);
        expect(isValidID('program123')).toBe(true);
        expect(isValidID('form_application_2024')).toBe(true);
      });

      it('should reject invalid IDs', () => {
        expect(isValidID('Test-ID')).toBe(false); // uppercase
        expect(isValidID('test-id')).toBe(false); // hyphen
        expect(isValidID('123test')).toBe(false); // starts with number
        expect(isValidID('')).toBe(false);
      });
    });
  });
});
