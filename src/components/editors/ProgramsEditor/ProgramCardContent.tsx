/**
 * ProgramCardContent Component
 * Domain-specific content display for program cards
 *
 * This component only handles rendering the card body - the header,
 * actions, and layout are handled by the generic EntityList.
 */

import React from 'react';
import { Badge } from '@/components/ui';
import type { Program } from '@/types/config';
import type { CardContentProps } from '@/lib/crud/types';

export const ProgramCardContent: React.FC<CardContentProps<Program>> = ({
  entity: program,
  metadata,
}) => {
  // Get form count from metadata (if provided)
  const formCount = metadata?.formCount || 0;

  return (
    <div className="space-y-3">
      {/* Description */}
      {program.description ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {program.description}
        </p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No description provided
        </p>
      )}

      {/* Form Count Badge */}
      {formCount > 0 && (
        <div>
          <Badge variant="info">
            {formCount} {formCount === 1 ? 'form' : 'forms'}
          </Badge>
        </div>
      )}
    </div>
  );
};
