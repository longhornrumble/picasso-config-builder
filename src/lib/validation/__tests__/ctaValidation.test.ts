/**
 * CTA Validation Tests
 * Comprehensive tests for CTA validation rules
 */

import { describe, it, expect } from 'vitest';
import { validateCTA, validateCTAs } from '../ctaValidation';
import type { CTADefinition, ConversationalForm } from '@/types/config';

describe('CTA Validation', () => {
  const mockForm: ConversationalForm = {
    enabled: true,
    form_id: 'test-form',
    program: 'test-program',
    title: 'Test Form',
    description: 'Test description',
    trigger_phrases: ['test'],
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        prompt: 'What is your name?',
        required: true,
      },
    ],
  };

  const allForms = { 'test-form': mockForm };

  describe('start_form action validation', () => {
    it('should require formId for start_form action', () => {
      const cta: CTADefinition = {
        label: 'Start Form',
        action: 'start_form',
        type: 'form_trigger',
        style: 'primary',
        // Missing formId
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Form ID is required');
      expect(result.errors[0].field).toBe('formId');
    });

    it('should error if referenced form does not exist', () => {
      const cta: CTADefinition = {
        label: 'Start Form',
        action: 'start_form',
        type: 'form_trigger',
        style: 'primary',
        formId: 'nonexistent-form',
      };

      const result = validateCTA(cta, 'test-cta', allForms);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('does not exist');
    });

    it('should validate successfully with valid form reference', () => {
      const cta: CTADefinition = {
        label: 'Start Application',
        action: 'start_form',
        type: 'form_trigger',
        style: 'primary',
        formId: 'test-form',
      };

      const result = validateCTA(cta, 'test-cta', allForms);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn if form does not have program assigned', () => {
      const formWithoutProgram: ConversationalForm = {
        ...mockForm,
        program: '',
      };

      const cta: CTADefinition = {
        label: 'Start Form',
        action: 'start_form',
        type: 'form_trigger',
        style: 'primary',
        formId: 'test-form',
      };

      const result = validateCTA(cta, 'test-cta', { 'test-form': formWithoutProgram });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('program');
    });
  });

  describe('external_link action validation', () => {
    it('should require url for external_link action', () => {
      const cta: CTADefinition = {
        label: 'Visit Website',
        action: 'external_link',
        type: 'external_link',
        style: 'primary',
        // Missing url
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('URL is required');
    });

    it('should error if URL is not HTTPS', () => {
      const cta: CTADefinition = {
        label: 'Visit Website',
        action: 'external_link',
        type: 'external_link',
        style: 'primary',
        url: 'http://example.com',
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('https');
    });

    it('should validate successfully with HTTPS URL', () => {
      const cta: CTADefinition = {
        label: 'Apply Online',
        action: 'external_link',
        type: 'external_link',
        style: 'primary',
        url: 'https://example.com/apply',
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('send_query action validation', () => {
    it('should require query for send_query action', () => {
      const cta: CTADefinition = {
        label: 'Ask Question',
        action: 'send_query',
        type: 'bedrock_query',
        style: 'primary',
        // Missing query
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Query is required');
    });

    it('should validate successfully with query', () => {
      const cta: CTADefinition = {
        label: 'Check Eligibility',
        action: 'send_query',
        type: 'bedrock_query',
        style: 'primary',
        query: 'What are the eligibility requirements?',
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('show_info action validation', () => {
    it('should require prompt for show_info action', () => {
      const cta: CTADefinition = {
        label: 'Learn More',
        action: 'show_info',
        type: 'show_info',
        style: 'secondary',
        // Missing prompt
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Prompt is required');
    });

    it('should warn about vague prompts', () => {
      const vaguePrompts = ['more', 'info', 'tell me more', 'what is this?', 'help'];

      vaguePrompts.forEach((prompt) => {
        const cta: CTADefinition = {
          label: 'Learn More',
          action: 'show_info',
          type: 'show_info',
          style: 'secondary',
          prompt,
        };

        const result = validateCTA(cta, 'test-cta', {});
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0].message).toContain('vague');
      });
    });

    it('should validate successfully with specific prompt', () => {
      const cta: CTADefinition = {
        label: 'Learn About Requirements',
        action: 'show_info',
        type: 'show_info',
        style: 'secondary',
        prompt: 'What are the specific eligibility requirements for this program?',
      };

      const result = validateCTA(cta, 'test-cta', {});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('quality validation', () => {
    it('should warn about generic button text', () => {
      const genericLabels = ['Click Here', 'Click', 'Submit', 'Go', 'Next'];

      genericLabels.forEach((label) => {
        const cta: CTADefinition = {
          label,
          action: 'external_link',
          url: 'https://example.com',
          type: 'external_link',
          style: 'primary',
        };

        const result = validateCTA(cta, 'test-cta', {});
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0].message).toContain('generic');
      });
    });

    it('should not warn about specific button text', () => {
      const cta: CTADefinition = {
        label: 'Apply for Housing Assistance',
        action: 'start_form',
        formId: 'test-form',
        type: 'form_trigger',
        style: 'primary',
      };

      const result = validateCTA(cta, 'test-cta', allForms);
      expect(result.valid).toBe(true);
      const genericWarnings = result.warnings.filter((w) => w.message.includes('generic'));
      expect(genericWarnings).toHaveLength(0);
    });
  });

  describe('bulk CTA validation', () => {
    it('should validate all CTAs', () => {
      const ctas: Record<string, CTADefinition> = {
        'cta-1': {
          label: 'Apply Now',
          action: 'start_form',
          formId: 'test-form',
          type: 'form_trigger',
          style: 'primary',
        },
        'cta-2': {
          label: 'Visit Website',
          action: 'external_link',
          url: 'https://example.com',
          type: 'external_link',
          style: 'secondary',
        },
        'cta-3': {
          label: 'Invalid CTA',
          action: 'start_form',
          // Missing formId
          type: 'form_trigger',
          style: 'primary',
        },
      };

      const result = validateCTAs(ctas, allForms);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should collect all errors from multiple CTAs', () => {
      const ctas: Record<string, CTADefinition> = {
        'cta-1': {
          label: 'Invalid Form CTA',
          action: 'start_form',
          type: 'form_trigger',
          style: 'primary',
        },
        'cta-2': {
          label: 'Invalid Link CTA',
          action: 'external_link',
          type: 'external_link',
          style: 'primary',
        },
      };

      const result = validateCTAs(ctas, {});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });
});
