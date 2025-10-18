/**
 * Branch Validation Tests
 * Comprehensive tests for branch validation rules
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
    it('should require at least one keyword', () => {
      const branch: ConversationBranch = {
        detection_keywords: [], // No keywords
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', allCTAs, {});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('keyword'))).toBe(true);
    });

    it('should warn about question words in keywords', () => {
      const questionKeywords = [
        'how do I apply',
        'what is this program',
        'when can I apply',
        'where do I go',
        'why should I apply',
      ];

      questionKeywords.forEach((keyword) => {
        const branch: ConversationBranch = {
          detection_keywords: [keyword],
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        };

        const result = validateBranch(branch, 'test-branch', allCTAs, {});
        expect(result.valid).toBe(true);
        expect(result.warnings.some((w) => w.message.includes('question words'))).toBe(true);
      });
    });

    it('should warn about keyword overlap with other branches', () => {
      const branch1: ConversationBranch = {
        detection_keywords: ['housing', 'rental', 'assistance', 'affordable'],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const branch2: ConversationBranch = {
        detection_keywords: ['housing', 'rental', 'application'],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const allBranches = {
        'branch-1': branch1,
        'branch-2': branch2,
      };

      const result = validateBranch(branch2, 'branch-2', allCTAs, allBranches);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('overlap'))).toBe(true);
    });

    it('should not warn about minor keyword overlap', () => {
      const branch1: ConversationBranch = {
        detection_keywords: ['housing', 'rental', 'assistance', 'affordable'],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const branch2: ConversationBranch = {
        detection_keywords: ['medical', 'healthcare', 'clinic', 'doctor'],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const allBranches = {
        'branch-1': branch1,
        'branch-2': branch2,
      };

      const result = validateBranch(branch2, 'branch-2', allCTAs, allBranches);
      expect(result.valid).toBe(true);
      const overlapWarnings = result.warnings.filter((w) => w.message.includes('overlap'));
      expect(overlapWarnings).toHaveLength(0);
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

      const result = validateBranch(branch, 'test-branch', allCTAs, {});
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

      const result = validateBranch(branch, 'test-branch', allCTAs, {});
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

      const result = validateBranch(branch, 'test-branch', allCTAs, {});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('secondary'))).toBe(true);
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
        { 'test-cta': mockCTA, 'secondary-cta': secondaryCTA },
        {}
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn if more than 3 total CTAs', () => {
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

      const result = validateBranch(branch, 'test-branch', ctas, {});
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('too many'))).toBe(true);
    });
  });

  describe('quality validation', () => {
    it('should provide priority suggestion', () => {
      const branch: ConversationBranch = {
        detection_keywords: ['housing'],
        available_ctas: {
          primary: 'test-cta',
          secondary: [],
        },
      };

      const result = validateBranch(branch, 'test-branch', allCTAs, {});
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('priority'))).toBe(true);
    });
  });

  describe('bulk branch validation', () => {
    it('should validate all branches', () => {
      const branches: Record<string, ConversationBranch> = {
        'branch-1': {
          detection_keywords: ['housing'],
          available_ctas: {
            primary: 'test-cta',
            secondary: [],
          },
        },
        'branch-2': {
          detection_keywords: [], // Invalid
          available_ctas: {
            primary: 'test-cta',
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
          detection_keywords: [],
          available_ctas: {
            primary: '',
            secondary: [],
          },
        },
        'branch-2': {
          detection_keywords: ['test'],
          available_ctas: {
            primary: 'nonexistent-cta',
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
