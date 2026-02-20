/**
 * AvailableActionsCardContent Component
 * Domain-specific content display for vocabulary entry cards
 */

import React from 'react';
import { Badge } from '@/components/ui';
import type { CardContentProps } from '@/lib/crud/types';
import type { AvailableActionEntity } from './types';

export const AvailableActionsCardContent: React.FC<CardContentProps<AvailableActionEntity>> = ({
  entity: action,
}) => {
  return (
    <div className="space-y-3">
      {/* Type badge */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={action.type === 'form' ? 'success' : 'default'}
          className="text-xs"
        >
          {action.type === 'form' ? 'Form' : 'Link'}
        </Badge>
        {action.type === 'form' && action.direct_cta && (
          <Badge variant="warning" className="text-xs">
            Direct CTA
          </Badge>
        )}
        {action.type === 'form' && action.show_info && (
          <Badge variant="secondary" className="text-xs">
            Show Info
          </Badge>
        )}
      </div>

      {/* Form-specific details */}
      {action.type === 'form' && action.description && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Description
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {action.description}
          </p>
        </div>
      )}

      {action.type === 'form' && action.show_info && action.prompt && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Info Prompt
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {action.prompt}
          </p>
        </div>
      )}

      {action.type === 'form' && action.target_branch && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Target Branch
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {action.target_branch}
          </p>
        </div>
      )}

      {/* Link-specific details */}
      {action.type === 'link' && action.url && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            URL
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={action.url}>
            {action.url}
          </p>
        </div>
      )}
    </div>
  );
};
