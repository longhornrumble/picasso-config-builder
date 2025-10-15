/**
 * CTACard Component
 * Displays an individual CTA in a card format with edit/delete actions
 */

import React from 'react';
import { Edit, Trash2, ExternalLink, Send, Info, FileText } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '@/components/ui';
import type { CTADefinition, CTAActionType, CTAStyle } from '@/types/config';

export interface CTACardProps {
  /**
   * The CTA ID
   */
  ctaId: string;
  /**
   * The CTA to display
   */
  cta: CTADefinition;
  /**
   * Callback when edit button is clicked
   */
  onEdit: () => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: () => void;
}

/**
 * Get the icon component for a given action type
 */
const getActionIcon = (action: CTAActionType) => {
  switch (action) {
    case 'external_link':
      return ExternalLink;
    case 'send_query':
      return Send;
    case 'show_info':
      return Info;
    case 'start_form':
      return FileText;
    default:
      return Info;
  }
};

/**
 * Get the badge variant for a given style
 */
const getStyleVariant = (style: CTAStyle): 'success' | 'info' | 'secondary' => {
  switch (style) {
    case 'primary':
      return 'success';
    case 'secondary':
      return 'info';
    case 'info':
      return 'secondary';
    default:
      return 'secondary';
  }
};

/**
 * Format action type for display
 */
const formatActionType = (action: CTAActionType): string => {
  switch (action) {
    case 'start_form':
      return 'Start Form';
    case 'external_link':
      return 'External Link';
    case 'send_query':
      return 'Send Query';
    case 'show_info':
      return 'Show Info';
    default:
      return action;
  }
};

/**
 * CTACard - Individual CTA card display
 *
 * @example
 * ```tsx
 * <CTACard
 *   ctaId="apply_now"
 *   cta={cta}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const CTACard: React.FC<CTACardProps> = ({
  ctaId,
  cta,
  onEdit,
  onDelete,
}) => {
  const ActionIcon = getActionIcon(cta.action);
  const styleVariant = getStyleVariant(cta.style);

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <ActionIcon className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{cta.label}</CardTitle>
              <CardDescription className="mt-1">
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {ctaId}
                </code>
              </CardDescription>
            </div>
          </div>
          <Badge variant={styleVariant} className="shrink-0">
            {cta.style}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Action Type */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Action Type
          </h4>
          <Badge variant="outline" className="text-xs">
            {formatActionType(cta.action)}
          </Badge>
        </div>

        {/* Action-specific content */}
        {cta.action === 'start_form' && cta.formId && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Form
            </h4>
            <Badge variant="info" className="text-xs">
              {cta.formId}
            </Badge>
          </div>
        )}

        {cta.action === 'external_link' && cta.url && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </h4>
            <a
              href={cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1"
            >
              {cta.url}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}

        {cta.action === 'send_query' && cta.query && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Query
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {cta.query}
            </p>
          </div>
        )}

        {cta.action === 'show_info' && cta.prompt && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Information Prompt
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {cta.prompt}
            </p>
          </div>
        )}

        {/* CTA Type */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            CTA Type
          </h4>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cta.type}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 justify-end border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center gap-1.5"
          aria-label={`Edit CTA ${cta.label}`}
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          className="flex items-center gap-1.5"
          aria-label={`Delete CTA ${cta.label}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
