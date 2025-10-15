/**
 * FormCard Component
 * Displays individual form information in a card format
 */

import React from 'react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import type { ConversationalForm } from '@/types/config';

export interface FormCardProps {
  /**
   * The form ID
   */
  formId: string;
  /**
   * The form data
   */
  form: ConversationalForm;
  /**
   * Program name to display
   */
  programName?: string;
  /**
   * Callback when edit button is clicked
   */
  onEdit: (formId: string, form: ConversationalForm) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: (formId: string, form: ConversationalForm) => void;
}

/**
 * FormCard - Displays a single form in a card format
 *
 * @example
 * ```tsx
 * <FormCard
 *   formId="volunteer_application"
 *   form={formData}
 *   programName="Volunteer Program"
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const FormCard: React.FC<FormCardProps> = ({
  formId,
  form,
  programName,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {form.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={form.enabled ? 'success' : 'secondary'}>
              {form.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {form.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {/* Program */}
          {programName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Program:</span>
              <Badge variant="info">{programName}</Badge>
            </div>
          )}

          {/* Form ID */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Form ID:</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {formId}
            </code>
          </div>

          {/* Field count */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Fields:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {form.fields.length}
            </span>
          </div>

          {/* Trigger phrases (first 3) */}
          {form.trigger_phrases.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Triggers:
              </span>
              <div className="flex flex-wrap gap-1">
                {form.trigger_phrases.slice(0, 3).map((phrase, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {phrase}
                  </Badge>
                ))}
                {form.trigger_phrases.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{form.trigger_phrases.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* CTA text */}
          {form.cta_text && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">CTA:</span>
              <span className="text-gray-700 dark:text-gray-300 italic">
                "{form.cta_text}"
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(formId, form)}
            className="flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(formId, form)}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
