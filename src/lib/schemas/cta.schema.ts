/**
 * CTA Schema - Zod validation schemas for call-to-action definitions
 */

import { z } from 'zod';

// ============================================================================
// CTA DEFINITION SCHEMA
// ============================================================================

export const ctaDefinitionSchema = z.object({
  text: z.string().max(100, 'Legacy text field must be 100 characters or less').optional(),
  label: z.string().min(1, 'Label is required').max(100, 'Label must be 100 characters or less'),
  action: z.enum(['start_form', 'external_link', 'send_query', 'show_info'], {
    errorMap: () => ({ message: 'Invalid action type' }),
  }),
  formId: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional(),
  query: z.string().max(500, 'Query must be 500 characters or less').optional(),
  prompt: z.string().max(1000, 'Prompt must be 1000 characters or less').optional(),
  type: z.enum(['form_trigger', 'external_link', 'bedrock_query', 'info_request'], {
    errorMap: () => ({ message: 'Invalid CTA type' }),
  }),
  style: z.enum(['primary', 'secondary', 'info'], {
    errorMap: () => ({ message: 'Invalid style' }),
  }),
  target_branch: z
    .string()
    .min(1, 'Target branch ID cannot be empty')
    .max(100, 'Target branch ID must be 100 characters or less')
    .optional()
    .describe('Branch ID to route to when this CTA is clicked (for navigation CTAs)'),
  on_completion_branch: z
    .string()
    .min(1, 'Completion branch ID cannot be empty')
    .max(100, 'Completion branch ID must be 100 characters or less')
    .optional()
    .describe('Branch ID to show after form completes (for form CTAs)'),
}).superRefine((data, ctx) => {
  // Validate action-specific required fields (v1.3+)

  // start_form requires formId
  if (data.action === 'start_form') {
    if (!data.formId || data.formId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['formId'],
        message: 'Form ID is required when action is "start_form"',
      });
    }
  }

  // external_link requires url
  if (data.action === 'external_link') {
    if (!data.url || data.url.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'URL is required when action is "external_link"',
      });
    }
  }

  // send_query requires query
  if (data.action === 'send_query') {
    if (!data.query || data.query.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['query'],
        message: 'Query is required when action is "send_query"',
      });
    }
  }

  // show_info requires prompt (v1.3+)
  if (data.action === 'show_info') {
    if (!data.prompt || data.prompt.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prompt'],
        message: 'Prompt is required when action is "show_info" (v1.3+)',
      });
    }
  }

  // Validate type matches action
  const typeActionMap: Record<string, string> = {
    start_form: 'form_trigger',
    external_link: 'external_link',
    send_query: 'bedrock_query',
    show_info: 'info_request',
  };

  const expectedType = typeActionMap[data.action];
  if (expectedType && data.type !== expectedType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['type'],
      message: `Type "${data.type}" does not match action "${data.action}". Expected type: "${expectedType}"`,
    });
  }

  // Warn about unnecessary fields (not errors, just recommendations)
  if (data.action !== 'start_form' && data.formId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['formId'],
      message: 'Form ID is only used when action is "start_form"',
    });
  }

  if (data.action !== 'external_link' && data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['url'],
      message: 'URL is only used when action is "external_link"',
    });
  }

  if (data.action !== 'send_query' && data.query) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['query'],
      message: 'Query is only used when action is "send_query"',
    });
  }

  if (data.action !== 'show_info' && data.prompt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['prompt'],
      message: 'Prompt is only used when action is "show_info"',
    });
  }
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CTADefinition = z.infer<typeof ctaDefinitionSchema>;
