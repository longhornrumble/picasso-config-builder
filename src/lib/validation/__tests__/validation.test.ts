/**
 * Validation Engine Tests
 * Basic tests to verify validation engine functionality
 */

import { describe, it, expect } from 'vitest';
import {
  validateCTA,
  validateForm,
  validateBranch,
  validateConfig,
  getValidationSummary,
} from '../index';
import type { CTADefinition, ConversationalForm, ConversationBranch, Program } from '@/types/config';

describe('Validation Engine', () => {
  describe('CTA Validation', () => {
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
    });

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

    it('should warn about generic button text', () => {
      const cta: CTADefinition = {
        label: 'Click Here',
        action: 'external_link',
        url: 'https://example.com',
        type: 'external_link',
        style: 'primary',
      };

      const result = validateCTA(cta, 'test-cta', {});

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('generic');
    });
  });

  describe('Form Validation', () => {
    const testProgram: Program = {
      program_id: 'test-program',
      program_name: 'Test Program',
    };

    it('should require program reference', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: '', // Missing program
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

      const result = validateForm(form, 'test-form', { 'test-program': testProgram });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Program'))).toBe(true);
    });

    it('should validate program exists', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'nonexistent-program',
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

      const result = validateForm(form, 'test-form', { 'test-program': testProgram });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
    });

    // Note: trigger phrase warnings were removed when forms moved to explicit
    // CTA routing. A form with empty trigger_phrases should validate cleanly
    // with no warnings about trigger phrases.
    it('should not warn about empty trigger_phrases (feature removed)', () => {
      const form: ConversationalForm = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test description',
        trigger_phrases: [],
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

      const result = validateForm(form, 'test-form', { 'test-program': testProgram });

      expect(result.valid).toBe(true);
      expect(result.warnings.filter((w) => w.message.toLowerCase().includes('trigger'))).toHaveLength(0);
    });
  });

  describe('Branch Validation', () => {
    const testCTA: CTADefinition = {
      label: 'Test CTA',
      action: 'send_query',
      query: 'test query',
      type: 'bedrock_query',
      style: 'primary',
    };

    // Note: `detection_keywords` and `question words` rules were removed when
    // V4 routing moved CTA selection to the LLM-based action selector. A
    // branch with empty keywords is now valid; question-word content is no
    // longer inspected. The primary-CTA check remains.
    it('should allow branches without keywords (feature removed)', () => {
      const branch: ConversationBranch = {
        detection_keywords: [],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', { 'test-cta': testCTA });
      expect(result.valid).toBe(true);
    });

    it('should require primary CTA', () => {
      const branch: ConversationBranch = {
        detection_keywords: ['test'],
        available_ctas: {
          primary: '', // No primary CTA
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', { 'test-cta': testCTA });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('primary CTA'))).toBe(true);
    });
  });

  describe('Config Validation', () => {
    it('should validate entire config', () => {
      const programs = {
        'test-program': {
          program_id: 'test-program',
          program_name: 'Test Program',
        },
      };

      const forms = {
        'test-form': {
          enabled: true,
          form_id: 'test-form',
          program: 'test-program',
          title: 'Test Form',
          description: 'Test',
          trigger_phrases: ['test'],
          fields: [
            {
              id: 'name',
              type: 'text' as const,
              label: 'Name',
              prompt: 'What is your name?',
              required: true,
            },
          ],
        },
      };

      const ctas = {
        'test-cta': {
          label: 'Test CTA',
          action: 'start_form' as const,
          formId: 'test-form',
          type: 'form_trigger' as const,
          style: 'primary' as const,
        },
      };

      const branches = {
        'test-branch': {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
      };

      const result = validateConfig(programs, forms, ctas, branches);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalErrors).toBe(0);
    });

    it('should provide readable summary', () => {
      const result = validateConfig({}, {}, {}, {});

      const summary = getValidationSummary(result);
      expect(summary).toContain('valid');
    });
  });
});
