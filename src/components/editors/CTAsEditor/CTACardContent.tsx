/**
 * CTACardContent Component
 * Domain-specific content display for CTA cards
 *
 * This component only handles rendering the card body - the header,
 * actions, and layout are handled by the generic EntityList.
 */

import React from 'react';
import { Badge } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { CardContentProps } from '@/lib/crud/types';
import type { CTAEntity } from './types';
import type { CTAActionType } from '@/types/config';

export const CTACardContent: React.FC<CardContentProps<CTAEntity>> = ({
  entity: cta,
}) => {
  const forms = useConfigStore((state) => state.forms.forms);

  // Get badge variant based on action type
  const getActionBadgeVariant = (
    action: CTAActionType
  ): 'default' | 'success' | 'warning' | 'secondary' => {
    switch (action) {
      case 'start_form':
        return 'success';
      case 'external_link':
        return 'default';
      case 'send_query':
        return 'warning';
      case 'show_info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-3">
      {/* Badges for action, type, style */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={getActionBadgeVariant(cta.action)} className="text-xs">
          {cta.action}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {cta.type}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {cta.style}
        </Badge>
      </div>

      {/* Action-specific information */}
      {cta.action === 'start_form' && cta.formId && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Linked Form
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {forms[cta.formId]?.title || cta.formId}
          </p>
        </div>
      )}

      {cta.action === 'external_link' && cta.url && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            URL
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={cta.url}>
            {cta.url}
          </p>
        </div>
      )}

      {cta.action === 'send_query' && cta.query && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Query
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {cta.query}
          </p>
        </div>
      )}

      {cta.action === 'show_info' && cta.prompt && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Prompt
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {cta.prompt}
          </p>
        </div>
      )}
    </div>
  );
};
