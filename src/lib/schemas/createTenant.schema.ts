import { z } from 'zod';

export const createTenantSchema = z.object({
  org_name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be 100 characters or less'),
  tenant_id: z
    .string()
    .min(1, 'Tenant ID is required')
    .max(50, 'Tenant ID must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed'),
  chat_title: z.string().optional(),
  chat_subtitle: z.string().optional(),
  subscription_tier: z.enum(['Standard', 'Premium']).default('Standard'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#10B981'),
  welcome_message: z.string().optional(),
  knowledge_base_id: z.string().optional(),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;
