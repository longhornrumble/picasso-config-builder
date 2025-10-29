/**
 * Form Schema - Zod validation schemas for conversational forms
 */

import { z } from 'zod';

// ============================================================================
// FORM FIELD SCHEMAS
// ============================================================================

export const formFieldOptionSchema = z.object({
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
});

export const formFieldSchema = z.object({
  id: z
    .string()
    .min(1, 'Field ID is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Field ID must start with a letter and contain only lowercase letters, numbers, and underscores'),
  type: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'number', 'date'], {
    errorMap: () => ({ message: 'Invalid field type' }),
  }),
  label: z.string().min(1, 'Field label is required').max(100, 'Field label must be 100 characters or less'),
  prompt: z.string().min(1, 'Field prompt is required').max(500, 'Field prompt must be 500 characters or less'),
  hint: z.string().max(200, 'Hint must be 200 characters or less').optional(),
  required: z.boolean(),
  options: z.array(formFieldOptionSchema).min(1, 'Select fields must have at least one option').optional(),
  eligibility_gate: z.boolean().optional(),
  failure_message: z.string().max(500, 'Failure message must be 500 characters or less').optional(),
}).superRefine((data, ctx) => {
  // Validate that select fields have options
  if (data.type === 'select' && (!data.options || data.options.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options'],
      message: 'Select fields must have at least one option',
    });
  }

  // Validate that eligibility gates are only used with select fields
  if (data.eligibility_gate && data.type !== 'select') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eligibility_gate'],
      message: 'Eligibility gates are only available for select (dropdown) fields',
    });
  }

  // Validate that eligibility gates have failure messages
  if (data.eligibility_gate && !data.failure_message) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['failure_message'],
      message: 'Eligibility gate fields must have a failure message',
    });
  }

  // Validate that only select fields have options
  if (data.type !== 'select' && data.options && data.options.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options'],
      message: 'Only select fields can have options',
    });
  }
});

// ============================================================================
// POST-SUBMISSION SCHEMAS
// ============================================================================

export const postSubmissionActionSchema = z.object({
  id: z.string().min(1, 'Action ID is required'),
  label: z.string().min(1, 'Action label is required').max(50, 'Action label must be 50 characters or less'),
  action: z.enum(['end_conversation', 'continue_conversation', 'start_form', 'external_link']),
  formId: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional(),
  prompt: z.string().max(200, 'Prompt must be 200 characters or less').optional(),
}).superRefine((data, ctx) => {
  // Validate action-specific required fields
  if (data.action === 'start_form' && !data.formId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['formId'],
      message: 'Form ID is required when action is "start_form"',
    });
  }

  if (data.action === 'external_link' && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['url'],
      message: 'URL is required when action is "external_link"',
    });
  }
});

export const fulfillmentSchema = z.object({
  method: z.enum(['email', 'webhook', 'dynamodb', 'sheets']),
  recipients: z.array(z.string().email('Must be a valid email address')).optional(),
  cc: z.array(z.string().email('Must be a valid email address')).optional(),
  webhook_url: z.string().url('Must be a valid URL').optional(),
  subject_template: z.string().max(200, 'Subject template must be 200 characters or less').optional(),
  notification_enabled: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Validate method-specific required fields
  if (data.method === 'email' && (!data.recipients || data.recipients.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['recipients'],
      message: 'At least one recipient is required when method is "email"',
    });
  }

  if (data.method === 'webhook' && !data.webhook_url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['webhook_url'],
      message: 'Webhook URL is required when method is "webhook"',
    });
  }
});

export const postSubmissionConfigSchema = z.object({
  confirmation_message: z
    .string()
    .min(1, 'Confirmation message is required')
    .max(1000, 'Confirmation message must be 1000 characters or less'),
  next_steps: z.array(z.string().max(500, 'Each next step must be 500 characters or less')).optional(),
  actions: z.array(postSubmissionActionSchema).max(3, 'Maximum 3 post-submission actions allowed').optional(),
  fulfillment: fulfillmentSchema.optional(),
});

// ============================================================================
// CONVERSATIONAL FORM SCHEMA
// ============================================================================

export const conversationalFormSchema = z.object({
  enabled: z.boolean(),
  form_id: z
    .string()
    .min(1, 'Form ID is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Form ID must start with a letter and contain only lowercase letters, numbers, and underscores')
    .max(50, 'Form ID must be 50 characters or less'),
  program: z.string().min(1, 'Program is required (v1.3+)'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  introduction: z.string().max(1000, 'Introduction must be 1000 characters or less').optional(),
  cta_text: z.string().max(50, 'CTA text must be 50 characters or less').optional(),
  trigger_phrases: z
    .array(z.string().min(1, 'Trigger phrase cannot be empty').max(100, 'Trigger phrase must be 100 characters or less'))
    .min(1, 'At least one trigger phrase is required'),
  fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
  post_submission: postSubmissionConfigSchema.optional(),
  on_completion_branch: z
    .string()
    .min(1, 'Completion branch ID cannot be empty')
    .max(100, 'Completion branch ID must be 100 characters or less')
    .optional()
    .describe('Branch ID to show after successful form submission'),
}).superRefine((data, ctx) => {
  // Validate that field IDs are unique within the form
  const fieldIds = new Set<string>();
  data.fields.forEach((field, index) => {
    if (fieldIds.has(field.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fields', index, 'id'],
        message: `Duplicate field ID: ${field.id}`,
      });
    }
    fieldIds.add(field.id);
  });
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FormFieldOption = z.infer<typeof formFieldOptionSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type PostSubmissionAction = z.infer<typeof postSubmissionActionSchema>;
export type Fulfillment = z.infer<typeof fulfillmentSchema>;
export type PostSubmissionConfig = z.infer<typeof postSubmissionConfigSchema>;
export type ConversationalForm = z.infer<typeof conversationalFormSchema>;
