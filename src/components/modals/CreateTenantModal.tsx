import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check, Loader2, Plus } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
  Select,
  Textarea,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { createTenantSchema, type CreateTenantFormData } from '@/lib/schemas';
import { configApiClient } from '@/lib/api/client';

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (tenantId: string) => void;
}

type ViewState = 'form' | 'loading' | 'success';

interface CreateTenantResponse {
  success: boolean;
  tenant_id: string;
  tenant_hash: string;
  embed_code: string;
  config: any;
}

/**
 * Generate a URL-safe slug from an organization name
 */
function generateSlug(orgName: string): string {
  return orgName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ open, onClose, onCreated }) => {
  const [viewState, setViewState] = useState<ViewState>('form');
  const [apiError, setApiError] = useState<string | null>(null);
  const [response, setResponse] = useState<CreateTenantResponse | null>(null);
  const [submittedOrgName, setSubmittedOrgName] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedSandbox, setCopiedSandbox] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      org_name: '',
      tenant_id: '',
      chat_title: '',
      chat_subtitle: '',
      subscription_tier: 'Standard',
      primary_color: '#10B981',
      welcome_message: '',
      knowledge_base_id: '',
    },
  });

  const primaryColor = watch('primary_color');

  const handleClose = () => {
    reset();
    setViewState('form');
    setApiError(null);
    setResponse(null);
    setSubmittedOrgName('');
    setCopied(false);
    setCopiedSandbox(false);
    onClose();
  };

  const onSubmit = async (data: CreateTenantFormData) => {
    setApiError(null);
    setViewState('loading');
    setSubmittedOrgName(data.org_name);

    try {
      const result = await configApiClient.createTenant({
        org_name: data.org_name,
        tenant_id: data.tenant_id,
        chat_title: data.chat_title || undefined,
        chat_subtitle: data.chat_subtitle || undefined,
        subscription_tier: data.subscription_tier,
        primary_color: data.primary_color,
        welcome_message: data.welcome_message || undefined,
        knowledge_base_id: data.knowledge_base_id || undefined,
      });

      setResponse(result);
      setViewState('success');
    } catch (error) {
      setViewState('form');
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred');
      }
    }
  };

  const handleCopyEmbedCode = async () => {
    if (response?.embed_code) {
      await navigator.clipboard.writeText(response.embed_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sandboxEntry = response
    ? `{ slug: '${generateSlug(submittedOrgName)}', orgName: '${submittedOrgName}', tenantId: '${response.tenant_hash}' }`
    : '';

  const handleCopySandboxEntry = async () => {
    await navigator.clipboard.writeText(sandboxEntry);
    setCopiedSandbox(true);
    setTimeout(() => setCopiedSandbox(false), 2000);
  };

  const handleLoadTenant = () => {
    if (response?.tenant_id) {
      onCreated?.(response.tenant_id);
      handleClose();
    }
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>
            {viewState === 'success' ? 'Demo Tenant Created' : 'Create Demo Tenant'}
          </ModalTitle>
          <ModalDescription>
            {viewState === 'success'
              ? 'Your tenant has been created. Copy the embed code to add to your website.'
              : 'Configure a demo tenant for the Picasso chat widget'}
          </ModalDescription>
        </ModalHeader>

        {viewState === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <Alert variant="error">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <Input
              label="Organization Name"
              placeholder="Habitat for Humanity"
              required
              helperText="Prospect's organization name (shown on demo page)"
              error={errors.org_name?.message}
              {...register('org_name')}
            />

            <Input
              label="Tenant ID"
              placeholder="my-company"
              required
              helperText="Unique identifier (alphanumeric, hyphens, underscores)"
              error={errors.tenant_id?.message}
              {...register('tenant_id')}
            />

            <Input
              label="Chat Title"
              placeholder="My Company Chat"
              helperText="Display name for the chat widget"
              error={errors.chat_title?.message}
              {...register('chat_title')}
            />

            <Input
              label="Chat Subtitle"
              placeholder="How can we help you today?"
              helperText="Subtitle shown below the title in the chat header"
              error={errors.chat_subtitle?.message}
              {...register('chat_subtitle')}
            />

            <Select
              label="Subscription Tier"
              required
              options={[
                { value: 'Standard', label: 'Standard' },
                { value: 'Premium', label: 'Premium' },
              ]}
              value={watch('subscription_tier')}
              onValueChange={(value) => setValue('subscription_tier', value as any)}
              error={errors.subscription_tier?.message}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...register('primary_color')}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setValue('primary_color', e.target.value)}
                  placeholder="#10B981"
                  className="flex-1"
                  error={errors.primary_color?.message}
                />
              </div>
              {errors.primary_color && (
                <p className="mt-1.5 text-sm text-red-600">{errors.primary_color.message}</p>
              )}
            </div>

            <Textarea
              label="Welcome Message"
              placeholder="Welcome to our chat! How can we help you today?"
              rows={3}
              error={errors.welcome_message?.message}
              {...register('welcome_message')}
            />

            <Input
              label="Knowledge Base ID"
              placeholder="KB12345"
              helperText="Optional: AWS Bedrock Knowledge Base ID"
              error={errors.knowledge_base_id?.message}
              {...register('knowledge_base_id')}
            />

            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Create Demo Tenant
              </Button>
            </ModalFooter>
          </form>
        )}

        {viewState === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-gray-600">Creating demo tenant...</p>
          </div>
        )}

        {viewState === 'success' && response && (
          <div className="space-y-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                Tenant Created
              </h4>
              <div className="space-y-2 text-sm" style={{ maxWidth: '100%' }}>
                {[
                  { label: 'Organization', value: submittedOrgName },
                  { label: 'Tenant ID', value: response.tenant_id, mono: true },
                  { label: 'Tenant Hash', value: response.tenant_hash, mono: true },
                  { label: 'Demo URL', value: `/sandbox/${generateSlug(submittedOrgName)}`, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{label}</span>
                    <div
                      className={`text-green-900 dark:text-green-100 font-semibold ${mono ? 'font-mono text-xs' : ''}`}
                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Embed Code
                </label>
                <Button type="button" size="sm" variant="outline" onClick={handleCopyEmbedCode}>
                  {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                </Button>
              </div>
              <div
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-3 font-mono text-xs"
                style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
              >
                {response.embed_code}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sandbox Demo Entry
                </label>
                <Button type="button" size="sm" variant="outline" onClick={handleCopySandboxEntry}>
                  {copiedSandbox ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                </Button>
              </div>
              <div
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-3 font-mono text-xs"
                style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
              >
                {sandboxEntry}
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Add this to sandbox-demos.ts to create the demo page
              </p>
            </div>

            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" onClick={handleLoadTenant}>
                Load This Tenant
              </Button>
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
