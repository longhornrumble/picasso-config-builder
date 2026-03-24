/**
 * Topic Definition Schema - Zod validation schemas for V4.1 topic definitions
 *
 * Topic definitions drive the V4.1 classifier taxonomy. The classifier reads
 * each description and matches the user's message to a topic. The topic's tags
 * then drive CTA pool selection via selectCTAsFromPool().
 */

import { z } from 'zod';

// ============================================================================
// TOPIC DEFINITION SCHEMA
// ============================================================================

export const topicDefinitionSchema = z.object({
  name: z
    .string()
    .min(1, 'Topic name is required')
    .max(50, 'Topic name must be 50 characters or less')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Topic name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores'
    ),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters — include enough detail for the classifier to distinguish this topic')
    .max(500, 'Description must be 500 characters or less'),
  tags: z
    .array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must be 30 characters or less'))
    .optional(),
  role: z
    .enum(['give', 'receive', 'learn', 'connect'], {
      errorMap: () => ({ message: 'Role must be one of: give, receive, learn, connect' }),
    })
    .optional(),
  depth_override: z
    .literal('action')
    .optional()
    .describe('Set to "action" to bypass the depth gate for "I\'m ready NOW" topics'),
});

// ============================================================================
// TOPIC FORM VALIDATION SCHEMA
// ============================================================================

/**
 * Extended schema for CRUD form validation. Adds a `topicName` field that
 * serves as the entity ID within the ordered list. Mirrors the pattern used
 * by ctaFormValidationSchema where ctaId is the dictionary key.
 */
export const topicFormValidationSchema = topicDefinitionSchema.extend({
  topicName: z
    .string()
    .min(1, 'Topic name is required')
    .max(50, 'Topic name must be 50 characters or less')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Topic name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores'
    ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TopicDefinition = z.infer<typeof topicDefinitionSchema>;
export type TopicFormValues = z.infer<typeof topicFormValidationSchema>;
