/**
 * FormCardContent Component
 * Displays form details in a card
 */

import React from 'react';
import { Badge } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { ConversationalForm } from '@/types/config';

export interface FormCardContentProps {
  entity: ConversationalForm;
}

export const FormCardContent: React.FC<FormCardContentProps> = ({ entity }) => {
  const programs = useConfigStore((state) => state.programs.programs);
  const program = programs[entity.program];

  return (
    <div className="space-y-3">
      {/* Program Badge */}
      {program && (
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Program: </span>
          <Badge variant="outline">{program.program_name}</Badge>
        </div>
      )}

      {/* Description */}
      {entity.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{entity.description}</p>
      )}

      {/* Fields Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Fields: </span>
          <span className="font-semibold">{entity.fields.length}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Required: </span>
          <span className="font-semibold">
            {entity.fields.filter((f) => f.required).length}
          </span>
        </div>
      </div>

      {/* Trigger phrases removed - forms now use explicit CTA routing */}

      {/* Status */}
      <div>
        <Badge variant={entity.enabled ? 'success' : 'secondary'}>
          {entity.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>
    </div>
  );
};
