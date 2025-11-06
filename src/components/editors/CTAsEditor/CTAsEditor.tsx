/**
 * CTAsEditor Component
 * Main container for managing CTAs using the generic CRUD framework
 *
 * This component demonstrates the power of the generic framework:
 * - Reduced from 580 lines to ~120 lines (79% reduction)
 * - No state management boilerplate
 * - No repetitive handlers
 * - Just configuration!
 */

import React, { useMemo } from 'react';
import { MousePointerClick } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { CTAFormFields } from './CTAFormFields';
import { CTACardContent } from './CTACardContent';
import { validateCTA } from '@/lib/validation/formValidators';
import { useConfigStore } from '@/store';
import type { CTAEntity } from './types';
import type { EntityDependencies } from '@/lib/crud/types';
import type { CTADefinition } from '@/types/config';

/**
 * CTAsEditor - CTAs management interface using generic framework
 *
 * @example
 * ```tsx
 * <CTAsEditor />
 * ```
 */
export const CTAsEditor: React.FC = () => {
  // Get store slices
  const ctasRecord = useConfigStore((state) => state.ctas.ctas);
  const createCTA = useConfigStore((state) => state.ctas.createCTA);
  const updateCTA = useConfigStore((state) => state.ctas.updateCTA);
  const deleteCTA = useConfigStore((state) => state.ctas.deleteCTA);
  const getBranchesByCTA = useConfigStore((state) => state.branches.getBranchesByCTA);

  // Transform CTAs from Record<string, CTADefinition> to CTAEntity[]
  const ctas = useMemo(() => {
    return Object.entries(ctasRecord).reduce((acc, [ctaId, cta]) => {
      acc[ctaId] = {
        ...cta,
        ctaId,
      };
      return acc;
    }, {} as Record<string, CTAEntity>);
  }, [ctasRecord]);

  // Configure the generic editor
  return (
    <EntityEditor<CTAEntity>
      initialValue={{
        ctaId: '',
        label: '',
        action: 'start_form',
        type: 'form_trigger',
        formId: '',
        url: '',
        query: '',
        prompt: '',
        target_branch: undefined,
        // Note: 'style' field removed in v1.5 - position-based styling from branches
      }}
      config={{
        // Entity metadata
        metadata: {
          entityType: 'cta',
          entityName: 'CTA',
          entityNamePlural: 'CTAs',
          description: 'Manage call-to-action buttons and their behaviors',
        },

        // Empty state configuration
        emptyState: {
          icon: MousePointerClick,
          title: 'No CTAs Defined',
          description:
            'CTAs (Call-to-Actions) are buttons that trigger specific actions like starting forms, opening links, or sending queries. Create your first CTA to get started.',
          actionText: 'Create First CTA',
        },

        // Store and operations
        useStore: () => ({
          entities: ctas,

          // Create: Extract ctaId and pass CTA data separately
          createEntity: (ctaEntity: CTAEntity) => {
            const { ctaId, ...ctaData } = ctaEntity;
            const cta: CTADefinition = {
              label: ctaData.label,
              action: ctaData.action,
              type: ctaData.type,
              ...(ctaData.formId && { formId: ctaData.formId }),
              ...(ctaData.url && { url: ctaData.url }),
              ...(ctaData.query && { query: ctaData.query }),
              ...(ctaData.prompt && { prompt: ctaData.prompt }),
              ...(ctaData.target_branch && { target_branch: ctaData.target_branch }),
            };
            createCTA(cta, ctaId);
          },

          // Update: Extract ctaId and pass updates
          updateEntity: (ctaId: string, ctaEntity: CTAEntity) => {
            const updates: Partial<CTADefinition> = {
              label: ctaEntity.label,
              action: ctaEntity.action,
              type: ctaEntity.type,
              ...(ctaEntity.formId && { formId: ctaEntity.formId }),
              ...(ctaEntity.url && { url: ctaEntity.url }),
              ...(ctaEntity.query && { query: ctaEntity.query }),
              ...(ctaEntity.prompt && { prompt: ctaEntity.prompt }),
            };
            // Handle target_branch: include if defined, or explicitly set to undefined to remove
            if (ctaEntity.target_branch !== undefined) {
              updates.target_branch = ctaEntity.target_branch || undefined;
            }
            updateCTA(ctaId, updates);
          },

          // Delete: Just pass the ctaId
          deleteEntity: (ctaId: string) => {
            deleteCTA(ctaId);
          },

          // Dependencies: Check if any branches reference this CTA
          getDependencies: (ctaId: string): EntityDependencies => {
            const dependentBranches = getBranchesByCTA(ctaId);
            const branchIds = dependentBranches.map((b) => b.id);

            return {
              canDelete: branchIds.length === 0,
              dependentEntities:
                branchIds.length > 0
                  ? [
                      {
                        type: 'Branches',
                        ids: branchIds,
                        names: branchIds, // Branch IDs are their names
                      },
                    ]
                  : [],
            };
          },
        }),

        // Validation
        validation: validateCTA,

        // ID and name extraction
        getId: (cta) => cta.ctaId,
        getName: (cta) => cta.label,

        // Domain-specific components
        FormFields: CTAFormFields,
        CardContent: CTACardContent,
      }}
    />
  );
};
