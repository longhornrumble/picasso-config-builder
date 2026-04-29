/**
 * PostSubmissionConfig Component
 * Configure what happens after a form is submitted
 * - Confirmation message
 * - Next steps
 * - Post-submission actions (buttons)
 * - Fulfillment settings (email, webhook, etc.)
 */

import React, { useState } from 'react';
import { Input, Textarea, Button, Badge, Select } from '@/components/ui';
import { Plus, X, Trash2, Webhook } from 'lucide-react';
import type { PostSubmissionConfig as PostSubmissionConfigType, PostSubmissionAction, Fulfillment } from '@/types/config';

export interface PostSubmissionConfigProps {
  value?: PostSubmissionConfigType;
  onChange: (value?: PostSubmissionConfigType) => void;
  errors?: Record<string, string | undefined>;
  touched?: boolean;
  onBlur?: () => void;
}

export const PostSubmissionConfig: React.FC<PostSubmissionConfigProps> = ({
  value,
  onChange,
  errors,
  touched,
  onBlur,
}) => {
  const [newNextStep, setNewNextStep] = useState('');
  const [showFulfillment, setShowFulfillment] = useState(!!value?.fulfillment);

  // Initialize with default if not set
  const config = value || {
    confirmation_message: '',
    next_steps: [],
    actions: [],
  };

  const handleChange = (updates: Partial<PostSubmissionConfigType>) => {
    onChange({ ...config, ...updates });
  };

  // Next Steps Management
  const handleAddNextStep = () => {
    const step = newNextStep.trim();
    if (step) {
      handleChange({
        next_steps: [...(config.next_steps || []), step],
      });
      setNewNextStep('');
    }
  };

  const handleRemoveNextStep = (index: number) => {
    handleChange({
      next_steps: (config.next_steps || []).filter((_, i) => i !== index),
    });
  };

  // Action Management
  const handleAddAction = () => {
    const newAction: PostSubmissionAction = {
      id: `action_${Date.now()}`,
      label: '',
      action: 'continue_conversation',
    };
    handleChange({
      actions: [...(config.actions || []), newAction],
    });
  };

  const handleUpdateAction = (index: number, updates: Partial<PostSubmissionAction>) => {
    const updatedActions = [...(config.actions || [])];
    updatedActions[index] = { ...updatedActions[index], ...updates };
    handleChange({ actions: updatedActions });
  };

  const handleRemoveAction = (index: number) => {
    handleChange({
      actions: (config.actions || []).filter((_, i) => i !== index),
    });
  };

  // Fulfillment Management
  const handleFulfillmentChange = (updates: Partial<Fulfillment>) => {
    const currentFulfillment = config.fulfillment || { method: 'webhook' as const };
    handleChange({
      fulfillment: { ...currentFulfillment, ...updates },
    });
  };

  const actionTypeOptions = [
    { value: 'continue_conversation', label: 'Continue Conversation' },
    { value: 'end_conversation', label: 'End Conversation' },
    { value: 'start_form', label: 'Start Another Form' },
    { value: 'external_link', label: 'External Link' },
  ];


  return (
    <div className="space-y-6 border-t pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Post-Submission Configuration
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          (Optional)
        </p>
      </div>

      {/* Confirmation Message */}
      <div className="w-full">
        <label
          htmlFor="confirmation-message"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirmation Message
        </label>
        <Textarea
          id="confirmation-message"
          placeholder="Thank you for submitting the form! We'll be in touch soon."
          value={config.confirmation_message || ''}
          onChange={(e) => handleChange({ confirmation_message: e.target.value })}
          onBlur={onBlur}
          rows={3}
        />
        {touched && errors?.confirmation_message && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.confirmation_message}
          </p>
        )}
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Message shown to user after successful form submission
        </p>
      </div>

      {/* Next Steps */}
      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Next Steps
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            id="next-step-input"
            value={newNextStep}
            onChange={(e) => setNewNextStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNextStep();
              }
            }}
            placeholder="Add next step instruction..."
          />
          <Button
            type="button"
            onClick={handleAddNextStep}
            disabled={!newNextStep.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {(config.next_steps || []).length > 0 && (
          <div className="space-y-2 mb-2">
            {(config.next_steps || []).map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{step}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveNextStep(idx)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Optional steps or instructions shown after submission
        </p>
      </div>

      {/* Post-Submission Actions */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Post-Submission Actions
          </label>
          <Button
            type="button"
            onClick={handleAddAction}
            disabled={(config.actions || []).length >= 3}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </div>
        {(config.actions || []).length > 0 && (
          <div className="space-y-3">
            {(config.actions || []).map((action, idx) => (
              <div
                key={action.id}
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Action {idx + 1}</Badge>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Button Label"
                    value={action.label}
                    onChange={(e) => handleUpdateAction(idx, { label: e.target.value })}
                    placeholder="e.g., View Dashboard"
                    required
                  />
                  <Select
                    label="Action Type"
                    value={action.action}
                    onValueChange={(value) => handleUpdateAction(idx, { action: value as PostSubmissionAction['action'] })}
                    options={actionTypeOptions}
                    required
                  />
                </div>

                {action.action === 'start_form' && (
                  <Input
                    label="Form ID"
                    value={action.formId || ''}
                    onChange={(e) => handleUpdateAction(idx, { formId: e.target.value })}
                    placeholder="volunteer_form"
                    required
                  />
                )}

                {action.action === 'external_link' && (
                  <Input
                    label="URL"
                    value={action.url || ''}
                    onChange={(e) => handleUpdateAction(idx, { url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Buttons shown after form submission (max 3)
        </p>
      </div>

      {/* Fulfillment Settings */}
      <div className="w-full border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFulfillment}
              onChange={(e) => {
                setShowFulfillment(e.target.checked);
                if (!e.target.checked) {
                  handleChange({ fulfillment: undefined });
                } else {
                  handleChange({
                    fulfillment: { method: 'webhook' },
                  });
                }
              }}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configure Fulfillment
            </span>
          </label>
        </div>

        {showFulfillment && (
          <div className="space-y-4 pl-6 border-l-2 border-primary-200 dark:border-primary-800">
            <div className="w-full">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Webhook className="w-4 h-4" />
                Webhook URL <span className="text-red-600">*</span>
              </label>
              <Input
                value={config.fulfillment?.webhook_url || ''}
                onChange={(e) => handleFulfillmentChange({ webhook_url: e.target.value })}
                placeholder="https://integrate.myrecruiter.ai/webhook/..."
                type="url"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                POST form data to an external endpoint (e.g., n8n, Zapier, Google Sheets via webhook).
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email notifications are managed in the portal's Notifications tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
