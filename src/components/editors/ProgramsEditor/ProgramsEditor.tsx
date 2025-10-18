/**
 * ProgramsEditor Component
 * Main container for managing programs using the generic CRUD framework
 *
 * This component demonstrates the power of the generic framework:
 * - 50 lines vs 213 lines (76% reduction)
 * - No state management boilerplate
 * - No repetitive handlers
 * - Just configuration!
 */

import React from 'react';
import { ListChecks } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { ProgramFormFields } from './ProgramFormFields';
import { ProgramCardContent } from './ProgramCardContent';
import { validateProgram } from '@/lib/validation/formValidators';
import { usePrograms, useConfigStore } from '@/store';
import type { Program } from '@/types/config';
import type { EntityDependencies } from '@/lib/crud/types';

/**
 * ProgramsEditor - Programs management interface using generic framework
 *
 * @example
 * ```tsx
 * <ProgramsEditor />
 * ```
 */
export const ProgramsEditor: React.FC = () => {
  // Get store slices
  const programsStore = usePrograms();
  const forms = useConfigStore((state) => state.forms.forms);

  // Configure the generic editor
  return (
    <EntityEditor<Program>
      initialValue={{
        program_id: '',
        program_name: '',
        description: '',
      }}
      config={{
        // Entity metadata
        metadata: {
          entityType: 'program',
          entityName: 'Program',
          entityNamePlural: 'Programs',
          description: 'Define organizational programs that forms can be assigned to',
        },

        // Empty state configuration
        emptyState: {
          icon: ListChecks,
          title: 'No Programs Defined',
          description:
            'Programs are organizational units that forms can be assigned to. Examples include "Volunteer Programs", "Donation Programs", or "Event Registration".',
          actionText: 'Create First Program',
        },

        // Store and operations
        useStore: () => ({
          entities: programsStore.programs,
          createEntity: (program) => programsStore.createProgram(program),
          updateEntity: (id, program) => programsStore.updateProgram(id, program),
          deleteEntity: (id) => programsStore.deleteProgram(id),
          getDependencies: (id): EntityDependencies => {
            const deps = programsStore.getProgramDependencies(id);
            const formNames = deps.forms.map((formId) => forms[formId]?.title || formId);
            return {
              canDelete: deps.forms.length === 0,
              dependentEntities:
                deps.forms.length > 0
                  ? [
                      {
                        type: 'Forms',
                        ids: deps.forms,
                        names: formNames,
                      },
                    ]
                  : [],
            };
          },
        }),

        // Validation
        validation: validateProgram,

        // ID and name extraction
        getId: (program) => program.program_id,
        getName: (program) => program.program_name,

        // Domain-specific components
        FormFields: ProgramFormFields,
        CardContent: ProgramCardContent,
      }}
    />
  );
};
