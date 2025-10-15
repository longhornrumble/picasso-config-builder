/**
 * ProgramCard Component
 * Displays an individual program in a card format with edit/delete actions
 */

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from '@/components/ui';
import type { Program } from '@/types/config';

export interface ProgramCardProps {
  /**
   * The program to display
   */
  program: Program;
  /**
   * Number of forms using this program
   */
  formCount: number;
  /**
   * Callback when edit button is clicked
   */
  onEdit: (program: Program) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: (program: Program) => void;
}

/**
 * ProgramCard - Individual program card display
 *
 * @example
 * ```tsx
 * <ProgramCard
 *   program={program}
 *   formCount={3}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  formCount,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{program.program_name}</CardTitle>
            <CardDescription className="mt-1">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {program.program_id}
              </code>
            </CardDescription>
          </div>
          {formCount > 0 && (
            <Badge variant="info" className="shrink-0">
              {formCount} {formCount === 1 ? 'form' : 'forms'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {program.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {program.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            No description provided
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 justify-end border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(program)}
          className="flex items-center gap-1.5"
          aria-label={`Edit ${program.program_name}`}
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(program)}
          className="flex items-center gap-1.5"
          aria-label={`Delete ${program.program_name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
