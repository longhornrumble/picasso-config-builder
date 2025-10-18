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

      {/* Trigger Phrases */}
      {entity.trigger_phrases && entity.trigger_phrases.length > 0 && (
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Trigger Phrases: </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {entity.trigger_phrases.slice(0, 3).map((phrase, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {phrase}
              </Badge>
            ))}
            {entity.trigger_phrases.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{entity.trigger_phrases.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Status */}
      <div>
        <Badge variant={entity.enabled ? 'success' : 'secondary'}>
          {entity.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>
    </div>
  );
};
