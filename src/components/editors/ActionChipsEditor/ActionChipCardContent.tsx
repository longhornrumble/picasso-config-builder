/**
 * ActionChipCardContent Component
 * Display content for action chip cards (read-only display with target_branch editing)
 */

import React from 'react';
import type { CardContentProps } from '@/lib/crud/types';
import type { ActionChipEntity } from './types';

const ACTION_LABELS: Record<string, string> = {
  send_query: 'Query',
  show_info: 'Info Message',
  show_showcase: 'Show Showcase',
};

export const ActionChipCardContent: React.FC<CardContentProps<ActionChipEntity>> = ({
  entity: chip,
}) => {
  const actionType = chip.action || 'send_query';
  const actionLabel = ACTION_LABELS[actionType] || 'Query';

  return (
    <div className="space-y-3">
      {/* Chip ID (auto-generated, read-only) */}
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {chip.chipId}
        </span>
      </div>

      {/* Action Type */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{actionLabel}</p>
        {/* Show value for send_query and show_info */}
        {actionType !== 'show_showcase' && chip.value && (
          <p className="text-sm mt-1">{chip.value}</p>
        )}
      </div>

      {/* Show Showcase - display target showcase */}
      {actionType === 'show_showcase' && chip.target_showcase_id && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Displays showcase</p>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-0.5">
            {chip.target_showcase_id}
          </p>
        </div>
      )}

      {/* Target Branch (if configured, for send_query/show_info) */}
      {actionType !== 'show_showcase' && chip.target_branch && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Routes to</p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">
            {chip.target_branch}
          </p>
        </div>
      )}

      {/* No routing configured - only show for send_query without target_branch */}
      {actionType === 'send_query' && !chip.target_branch && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ No target branch configured (will use fallback)
          </p>
        </div>
      )}

      {/* Missing showcase warning for show_showcase action */}
      {actionType === 'show_showcase' && !chip.target_showcase_id && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-red-600 dark:text-red-400">
            ⚠️ No showcase item configured
          </p>
        </div>
      )}
    </div>
  );
};
