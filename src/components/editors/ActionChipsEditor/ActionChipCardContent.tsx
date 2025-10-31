/**
 * ActionChipCardContent Component
 * Display content for action chip cards (read-only display with target_branch editing)
 */

import React from 'react';
import type { CardContentProps } from '@/lib/crud/types';
import type { ActionChipEntity } from './types';

export const ActionChipCardContent: React.FC<CardContentProps<ActionChipEntity>> = ({
  entity: chip,
}) => {
  return (
    <div className="space-y-3">
      {/* Chip ID (auto-generated, read-only) */}
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {chip.chipId}
        </span>
      </div>

      {/* Query/Value */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Query</p>
        <p className="text-sm mt-1">{chip.value}</p>
      </div>

      {/* Target Branch (if configured) */}
      {chip.target_branch && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Routes to</p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">
            {chip.target_branch}
          </p>
        </div>
      )}

      {/* No routing configured */}
      {!chip.target_branch && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ No target branch configured (will use fallback)
          </p>
        </div>
      )}
    </div>
  );
};
