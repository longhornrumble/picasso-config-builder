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

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ open, onClose, onCreated }) => {
  const [viewState, setViewState] = useState<ViewState>('form');
  const [apiError, setApiError] = useState<string | null>(null);
  const [response, setResponse] = useState<CreateTenantResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
      tenant_id: '',
      chat_title: '',
      subscription_tier: 'Free',
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
    setCopied(false);
    onClose();
  };

  const onSubmit = async (data: CreateTenantFormData) => {
    setApiError(null);
    setViewState('loading');

    try {
      const result = await configApiClient.createTenant({
        tenant_id: data.tenant_id,
        chat_title: data.chat_title || undefined,
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
            {viewState === 'success' ? 'Tenant Created Successfully' : 'Create New Tenant'}
          </ModalTitle>
          <ModalDescription>
            {viewState === 'success'
              ? 'Your tenant has been created. Copy the embed code to add to your website.'
              : 'Configure a new tenant for the Picasso chat widget'}
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
              label="Tenant ID"
              placeholder="my-company"
              required
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

            <Select
              label="Subscription Tier"
              required
              options={[
                { value: 'Free', label: 'Free' },
                { value: 'Standard', label: 'Standard' },
                { value: 'Premium', label: 'Premium' },
                { value: 'Enterprise', label: 'Enterprise' },
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
                Create Tenant
              </Button>
            </ModalFooter>
          </form>
        )}

        {viewState === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-gray-600">Creating tenant...</p>
          </div>
        )}

        {viewState === 'success' && response && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Tenant Created
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tenant ID:</span>
                  <span className="font-mono font-semibold text-green-900 dark:text-green-100">
                    {response.tenant_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tenant Hash:</span>
                  <span className="font-mono font-semibold text-green-900 dark:text-green-100">
                    {response.tenant_hash}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Embed Code
              </label>
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-3 text-xs overflow-x-auto">
                  <code>{response.embed_code}</code>
                </pre>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={handleCopyEmbedCode}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Add this code to your website to embed the Picasso chat widget
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
