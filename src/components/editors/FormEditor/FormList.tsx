/**
 * FormList Component
 * Displays a responsive grid of form cards
 */

import React from 'react';
import { FormCard } from './FormCard';
import type { ConversationalForm, Program } from '@/types/config';

export interface FormListProps {
  /**
   * Array of forms with their IDs
   */
  forms: Array<{ id: string; form: ConversationalForm }>;
  /**
   * Programs lookup for displaying program names
   */
  programs: Record<string, Program>;
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
 * FormList - Grid display of form cards
 *
 * @example
 * ```tsx
 * <FormList
 *   forms={formList}
 *   programs={programs}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const FormList: React.FC<FormListProps> = ({
  forms,
  programs,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map(({ id, form }) => {
        const programName = programs[form.program]?.program_name;

        return (
          <FormCard
            key={id}
            formId={id}
            form={form}
            programName={programName}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};
