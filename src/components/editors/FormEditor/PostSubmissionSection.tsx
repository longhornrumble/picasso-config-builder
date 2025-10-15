/**
 * PostSubmissionSection Component
 * Collapsible section for configuring post-submission behavior
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea, Alert, AlertDescription } from '@/components/ui';
import type { PostSubmissionConfig } from '@/types/config';

export interface PostSubmissionSectionProps {
  /**
   * Post-submission configuration
   */
  postSubmission?: PostSubmissionConfig;
  /**
   * Callback when configuration changes
   */
  onChange: (postSubmission?: PostSubmissionConfig) => void;
  /**
   * Validation errors
   */
  errors?: {
    confirmation_message?: string;
    next_steps?: string;
  };
  /**
   * Touched fields
   */
  touched?: Record<string, boolean>;
}

/**
 * PostSubmissionSection - Collapsible post-submission configuration
 *
 * @example
 * ```tsx
 * <PostSubmissionSection
 *   postSubmission={formData.post_submission}
 *   onChange={(config) => handleChange('post_submission', config)}
 *   errors={errors}
 *   touched={touched}
 * />
 * ```
 */
export const PostSubmissionSection: React.FC<PostSubmissionSectionProps> = ({
  postSubmission,
  onChange,
  errors,
  touched,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize with empty config if needed
  const config: PostSubmissionConfig = postSubmission || {
    confirmation_message: '',
    next_steps: [],
  };

  // Handle confirmation message change
  const handleConfirmationChange = (value: string) => {
    onChange({
      ...config,
      confirmation_message: value,
    });
  };

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-md">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Post-Submission Configuration
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Optional: Define what happens after form submission
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Placeholder for Phase 2 */}
          <Alert variant="info">
            <AlertDescription>
              <strong>Coming Soon:</strong> Post-submission configuration will allow you to:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Customize confirmation messages</li>
                <li>Define next steps for users</li>
                <li>Configure follow-up actions (start another form, external link, etc.)</li>
                <li>Set up fulfillment methods (email, webhook, DynamoDB, Google Sheets)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Basic confirmation message (simplified for now) */}
          <Textarea
            label="Confirmation Message"
            id="confirmation_message"
            placeholder="e.g., Thank you for submitting your application! We'll review it and get back to you soon."
            value={config.confirmation_message}
            onChange={(e) => handleConfirmationChange(e.target.value)}
            error={touched?.confirmation_message ? errors?.confirmation_message : undefined}
            helperText="Message shown to users after they submit the form"
            rows={4}
          />

          <Alert variant="warning">
            <AlertDescription className="text-xs">
              Advanced post-submission features (actions, fulfillment, next steps) will be
              implemented in a future update. For now, you can set a basic confirmation message.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
