/**
 * ProgramList Component
 * Displays a grid of program cards sorted alphabetically
 */

import React, { useMemo } from 'react';
import { ProgramCard } from './ProgramCard';
import type { Program } from '@/types/config';

export interface ProgramListProps {
  /**
   * Array of programs to display
   */
  programs: Program[];
  /**
   * Map of program IDs to form counts
   */
  formCounts: Record<string, number>;
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
 * ProgramList - Displays a sortable, filterable list of programs
 *
 * @example
 * ```tsx
 * <ProgramList
 *   programs={programs}
 *   formCounts={formCounts}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const ProgramList: React.FC<ProgramListProps> = ({
  programs,
  formCounts,
  onEdit,
  onDelete,
}) => {
  // Sort programs alphabetically by program_name
  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) => {
      return a.program_name.localeCompare(b.program_name);
    });
  }, [programs]);

  if (sortedPrograms.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {sortedPrograms.map((program) => (
        <ProgramCard
          key={program.program_id}
          program={program}
          formCount={formCounts[program.program_id] || 0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
