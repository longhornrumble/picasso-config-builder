/**
 * Branch Schema - Zod validation schemas for conversation branches
 */

import { z } from 'zod';

// ============================================================================
// CONVERSATION BRANCH SCHEMA
// ============================================================================

export const branchAvailableCTAsSchema = z.object({
  primary: z.string().min(1, 'Primary CTA ID is required'),
  secondary: z
    .array(z.string().min(1, 'CTA ID cannot be empty'))
    .max(2, 'Maximum 2 secondary CTAs allowed')
    .default([]),
});

export const conversationBranchSchema = z.object({
  detection_keywords: z
    .array(
      z
        .string()
        .min(1, 'Keyword cannot be empty')
        .max(50, 'Keyword must be 50 characters or less')
        .toLowerCase()
        .regex(/^[a-z0-9\s\-_]+$/, 'Keywords should only contain lowercase letters, numbers, spaces, hyphens, and underscores')
    )
    .min(1, 'At least one detection keyword is required')
    .max(20, 'Maximum 20 keywords per branch'),
  available_ctas: branchAvailableCTAsSchema,
}).superRefine((data, ctx) => {
  // Validate that keywords are unique
  const keywordSet = new Set<string>();
  data.detection_keywords.forEach((keyword, index) => {
    const normalized = keyword.toLowerCase().trim();
    if (keywordSet.has(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['detection_keywords', index],
        message: `Duplicate keyword: "${keyword}"`,
      });
    }
    keywordSet.add(normalized);
  });

  // Validate that keywords are not too generic or question-like
  const genericKeywords = ['what', 'how', 'why', 'when', 'where', 'who', 'can', 'do', 'is', 'are'];
  const questionKeywords = data.detection_keywords.filter(kw => {
    const words = kw.toLowerCase().trim().split(/\s+/);
    return words.length > 3 || genericKeywords.includes(words[0]);
  });

  if (questionKeywords.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['detection_keywords'],
      message: 'Keywords should be topic-based, not full questions. Consider using nouns/verbs instead of question patterns.',
    });
  }

  // Validate that primary CTA is not also in secondary list
  if (data.available_ctas.secondary.includes(data.available_ctas.primary)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['available_ctas', 'secondary'],
      message: 'Primary CTA cannot also be in the secondary CTA list',
    });
  }

  // Validate total CTA count
  const totalCTAs = 1 + data.available_ctas.secondary.length;
  if (totalCTAs > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['available_ctas'],
      message: `Total CTAs (${totalCTAs}) exceeds recommended maximum of 3`,
    });
  }
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BranchAvailableCTAs = z.infer<typeof branchAvailableCTAsSchema>;
export type ConversationBranch = z.infer<typeof conversationBranchSchema>;
