import { z } from 'zod';

export const createTenantSchema = z.object({
  tenant_id: z
    .string()
    .min(1, 'Tenant ID is required')
    .max(50, 'Tenant ID must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, underscores, and hyphens allowed'),
  chat_title: z.string().optional(),
  subscription_tier: z.enum(['Free', 'Standard', 'Premium', 'Enterprise']).default('Free'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#10B981'),
  welcome_message: z.string().optional(),
  knowledge_base_id: z.string().optional(),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;
