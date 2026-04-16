/**
 * Branch Validation Tests
 * Comprehensive tests for branch validation rules
 *
 * Note: This suite was aligned with the current branchValidation.ts after the
 * V4 routing changes removed several rules (keyword-required, question-word
 * warnings, cross-branch overlap detection, and priority suggestions). The
 * current validator only checks CTA references and the max-CTAs-per-response
 * cap. Tests for removed rules have been updated to assert the new behavior
 * rather than resurrect deleted logic.
 */

import { describe, it, expect } from 'vitest';
import { validateBranch, validateBranches } from '../branchValidation';
import type { ConversationBranch, CTADefinition } from '@/types/config';

describe('Branch Validation', () => {
  const mockCTA: CTADefinition = {
    label: 'Test CTA',
    action: 'send_query',
    query: 'test query',
    type: 'bedrock_query',
    style: 'primary',
  };

  const allCTAs = { 'test-cta': mockCTA };

  describe('keyword validation', () => {
    it('should allow branches without keywords (V4 routing no longer requires them)', () => {
      const branch: ConversationBranch = {
        detection_keywords: [],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', allCTAs);
      expect(result.valid).toBe(true);
      expect(result.errors.some((e) => e.message.toLowerCase().includes('keyword'))).toBe(false);
    });
  });

  describe('CTA reference validation', () => {
    it('should require primary CTA', () => {
      const branch: ConversationBranch = {
        detection_keywords: ['test'],
        available_ctas: {
          primary: '', // No primary CTA
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', allCTAs);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('primary CTA'))).toBe(true);
    });

    it('should error if primary CTA does not exist', () => {
      const branch: ConversationBranch = {
        detection_keywords: ['test'],
        available_ctas: {
          primary: 'nonexistent-cta',
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', allCTAs);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('does not exist'))).toBe(true);
    });

    it('should error if secondary CTA does not exist', () => {
      const branch: ConversationBranch = {
        detection_keywords: ['test'],
        available_ctas: {
          primary: 'test-cta',
          secondary: ['nonexistent-cta'],
        },
      };

      const result = validateBranch(branch, 'test-branch', allCTAs);
      expect(result.valid).toBe(false);
      // Current message is "Secondary CTA <n> \"<id>\" does not exist" — match case-insensitively.
      expect(result.errors.some((e) => e.message.toLowerCase().includes('secondary'))).toBe(true);
    });

    it('should validate successfully with valid CTAs', () => {
      const secondaryCTA: CTADefinition = {
        label: 'Secondary CTA',
        action: 'send_query',
        query: 'secondary query',
        type: 'bedrock_query',
        style: 'secondary',
      };

      const branch: ConversationBranch = {
        detection_keywords: ['housing', 'assistance'],
        available_ctas: {
          primary: 'test-cta',
          secondary: ['secondary-cta'],
        },
      };

      const result = validateBranch(
        branch,
        'test-branch',
        { 'test-cta': mockCTA, 'secondary-cta': secondaryCTA }
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn if total CTAs exceed the per-response cap', () => {
      const branch: ConversationBranch = {
        detection_keywords: ['test'],
        available_ctas: {
          primary: 'test-cta',
          secondary: ['cta-1', 'cta-2', 'cta-3'], // 4 total CTAs
        },
      };

      const ctas = {
        'test-cta': mockCTA,
        'cta-1': mockCTA,
        'cta-2': mockCTA,
        'cta-3': mockCTA,
      };

      // Pass an explicit cap of 3 so 4 total triggers the warning. The current
      // signature takes maxCtasPerResponse (number) rather than allBranches.
      const result = validateBranch(branch, 'test-branch', ctas, 3);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.toLowerCase().includes('too many'))).toBe(true);
    });
  });

  describe('bulk branch validation', () => {
    it('should validate all branches and surface errors from any invalid one', () => {
      const branches: Record<string, ConversationBranch> = {
        'branch-1': {
          detection_keywords: ['housing'],
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
        'branch-2': {
          detection_keywords: ['help'],
          available_ctas: {
            primary: '', // Invalid — missing primary CTA
            secondary: [],
          },
        },
      };

      const result = validateBranches(branches, allCTAs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should collect all errors from multiple branches', () => {
      const branches: Record<string, ConversationBranch> = {
        'branch-1': {
          detection_keywords: ['a'],
          available_ctas: {
            primary: '', // missing primary
            secondary: [],
          },
        },
        'branch-2': {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'nonexistent-cta', // missing reference
            secondary: [],
          },
        },
      };

      const result = validateBranches(branches, allCTAs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
