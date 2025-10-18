/**
 * Relationship Validation Tests
 * Tests for cross-entity relationship validation
 */

import { describe, it, expect } from 'vitest';
import { validateRelationships } from '../relationshipValidation';
import type {
  Program,
  ConversationalForm,
  CTADefinition,
  ConversationBranch,
} from '@/types/config';

describe('Relationship Validation', () => {
  const mockProgram: Program = {
    program_id: 'test-program',
    program_name: 'Test Program',
  };

  const mockForm: ConversationalForm = {
    enabled: true,
    form_id: 'test-form',
    program: 'test-program',
    title: 'Test Form',
    description: 'Test',
    trigger_phrases: ['apply'],
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        prompt: 'Name?',
        required: true,
      },
    ],
  };

  const mockCTA: CTADefinition = {
    label: 'Apply Now',
    action: 'start_form',
    formId: 'test-form',
    type: 'form_trigger',
    style: 'primary',
  };

  const mockBranch: ConversationBranch = {
    detection_keywords: ['housing'],
    available_ctas: {
      primary: 'test-cta',
      secondary: [],
    },
  };

  describe('form → program relationships', () => {
    it('should error if form has no program', () => {
      const forms = {
        'form-1': {
          ...mockForm,
          program: '',
        },
      };

      const result = validateRelationships({ 'test-program': mockProgram }, forms, {}, {});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Program'))).toBe(true);
    });

    it('should error if form references nonexistent program', () => {
      const forms = {
        'form-1': {
          ...mockForm,
          program: 'nonexistent-program',
        },
      };

      const result = validateRelationships({ 'test-program': mockProgram }, forms, {}, {});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
    });

    it('should validate valid form → program relationship', () => {
      const forms = { 'test-form': mockForm };
      const programs = { 'test-program': mockProgram };

      const result = validateRelationships(programs, forms, {}, {});
      expect(result.valid).toBe(true);
    });
  });

  describe('CTA → form relationships', () => {
    it('should error if CTA has no formId', () => {
      const ctas = {
        'cta-1': {
          ...mockCTA,
          formId: undefined,
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        ctas,
        {}
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Form ID'))).toBe(true);
    });

    it('should error if CTA references nonexistent form', () => {
      const ctas = {
        'cta-1': {
          ...mockCTA,
          formId: 'nonexistent-form',
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        ctas,
        {}
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
    });

    it('should validate valid CTA → form relationship', () => {
      const ctas = { 'test-cta': mockCTA };
      const forms = { 'test-form': mockForm };

      const result = validateRelationships({ 'test-program': mockProgram }, forms, ctas, {});
      expect(result.valid).toBe(true);
    });

    it('should only validate start_form CTAs', () => {
      const queryCTA: CTADefinition = {
        label: 'Query',
        action: 'send_query',
        query: 'test',
        type: 'bedrock_query',
        style: 'secondary',
      };

      const ctas = { 'cta-1': queryCTA };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        ctas,
        {}
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('branch → CTA relationships', () => {
    it('should error if branch has no primary CTA', () => {
      const branches = {
        'branch-1': {
          ...mockBranch,
          available_ctas: {
            primary: '',
            secondary: [],
          },
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        branches
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('primary CTA'))).toBe(true);
    });

    it('should error if branch references nonexistent primary CTA', () => {
      const branches = {
        'branch-1': {
          ...mockBranch,
          available_ctas: {
            primary: 'nonexistent-cta',
            secondary: [],
          },
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        branches
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
    });

    it('should error if branch references nonexistent secondary CTA', () => {
      const branches = {
        'branch-1': {
          ...mockBranch,
          available_ctas: {
            primary: 'test-cta',
            secondary: ['nonexistent-cta'],
          },
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        branches
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('secondary'))).toBe(true);
    });

    it('should validate valid branch → CTA relationship', () => {
      const branches = { 'test-branch': mockBranch };
      const ctas = { 'test-cta': mockCTA };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        ctas,
        branches
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('circular dependency detection', () => {
    it('should warn about trigger phrases matching confirmation messages', () => {
      const formWithCircular: ConversationalForm = {
        ...mockForm,
        trigger_phrases: ['apply for housing'],
        post_submission: {
          confirmation_message: 'Thank you for applying for housing assistance!',
          actions: [],
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': formWithCircular },
        {},
        {}
      );

      expect(result.warnings.some((w) => w.message.includes('circular'))).toBe(true);
    });

    it('should not warn about unrelated trigger phrases and confirmations', () => {
      const formWithoutCircular: ConversationalForm = {
        ...mockForm,
        trigger_phrases: ['apply'],
        post_submission: {
          confirmation_message: 'Thank you for your submission!',
          actions: [],
        },
      };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': formWithoutCircular },
        {},
        {}
      );

      const circularWarnings = result.warnings.filter((w) => w.message.includes('circular'));
      expect(circularWarnings).toHaveLength(0);
    });
  });

  describe('orphaned entity detection', () => {
    it('should warn about orphaned programs', () => {
      const programs = {
        'test-program': mockProgram,
        'unused-program': {
          program_id: 'unused-program',
          program_name: 'Unused Program',
        },
      };

      const forms = { 'test-form': mockForm };

      const result = validateRelationships(programs, forms, {}, {});
      expect(result.warnings.some((w) => w.message.includes('orphaned'))).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('unused-program'))).toBe(true);
    });

    it('should warn about orphaned CTAs', () => {
      const ctas = {
        'test-cta': mockCTA,
        'unused-cta': {
          label: 'Unused',
          action: 'send_query' as const,
          query: 'test',
          type: 'bedrock_query' as const,
          style: 'secondary' as const,
        },
      };

      const branches = { 'test-branch': mockBranch };

      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        ctas,
        branches
      );
      expect(result.warnings.some((w) => w.message.includes('orphaned'))).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('unused-cta'))).toBe(true);
    });

    it('should not warn about used entities', () => {
      const result = validateRelationships(
        { 'test-program': mockProgram },
        { 'test-form': mockForm },
        { 'test-cta': mockCTA },
        { 'test-branch': mockBranch }
      );

      const orphanedWarnings = result.warnings.filter((w) => w.message.includes('orphaned'));
      expect(orphanedWarnings).toHaveLength(0);
    });
  });

  describe('complete relationship validation', () => {
    it('should validate entire entity graph', () => {
      const programs = { 'test-program': mockProgram };
      const forms = { 'test-form': mockForm };
      const ctas = { 'test-cta': mockCTA };
      const branches = { 'test-branch': mockBranch };

      const result = validateRelationships(programs, forms, ctas, branches);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all relationship errors', () => {
      const programs = { 'test-program': mockProgram };
      const forms = {
        'form-1': { ...mockForm, program: 'nonexistent' },
        'form-2': { ...mockForm, form_id: 'form-2', program: '' },
      };
      const ctas = {
        'cta-1': { ...mockCTA, formId: 'nonexistent-form' },
      };
      const branches = {
        'branch-1': {
          ...mockBranch,
          available_ctas: { primary: 'nonexistent-cta', secondary: [] },
        },
      };

      const result = validateRelationships(programs, forms, ctas, branches);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
