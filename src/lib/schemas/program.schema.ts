/**
 * Program Schema - Zod validation schemas for programs
 */

import { z } from 'zod';

// ============================================================================
// PROGRAM SCHEMA
// ============================================================================

export const programSchema = z.object({
  program_id: z
    .string()
    .min(1, 'Program ID is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Program ID must start with a letter and contain only lowercase letters, numbers, and underscores')
    .max(50, 'Program ID must be 50 characters or less'),
  program_name: z.string().min(1, 'Program name is required').max(100, 'Program name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Program = z.infer<typeof programSchema>;
