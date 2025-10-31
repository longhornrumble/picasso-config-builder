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
  available_ctas: branchAvailableCTAsSchema,
}).superRefine((data, ctx) => {
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
