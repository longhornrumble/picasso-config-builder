/**
 * ActionChipsEditor Component
 * Main container for managing Action Chips using the generic CRUD framework
 *
 * Action chips provide Tier 1 routing - explicit branch navigation via quick-access chips.
 * Following the same pattern as CTAsEditor with dictionary-based storage.
 */

import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { ActionChipFormFields } from './ActionChipFormFields';
import { ActionChipCardContent } from './ActionChipCardContent';
import { validateActionChip } from '@/lib/validation/formValidators';
import { useConfigStore } from '@/store';
import type { ActionChipEntity } from './types';
import type { EntityDependencies } from '@/lib/crud/types';
import type { ActionChip } from '@/types/config';

/**
 * ActionChipsEditor - Action Chips management interface using generic framework
 *
 * @example
 * ```tsx
 * <ActionChipsEditor />
 * ```
 */
export const ActionChipsEditor: React.FC = () => {
  // Get store slices
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const markDirty = useConfigStore((state) => state.config.markDirty);

  // Get the chips dictionary (default to empty object if not present)
  const actionChipsConfig = baseConfig?.action_chips;
  const chipsRecord = actionChipsConfig?.default_chips || {};

  // Transform Action Chips from Record<string, ActionChip> to ActionChipEntity[]
  const chips = useMemo(() => {
    return Object.entries(chipsRecord).reduce((acc, [chipId, chip]) => {
      acc[chipId] = {
        ...chip,
        chipId,
      };
      return acc;
    }, {} as Record<string, ActionChipEntity>);
  }, [chipsRecord]);

  // Store operations for Action Chips using immer from Zustand
  const { setState } = useConfigStore;

  const createChip = (chip: ActionChip, chipId: string) => {
    setState((state) => {
      if (!state.config.baseConfig) return;

      if (!state.config.baseConfig.action_chips) {
        state.config.baseConfig.action_chips = {
          enabled: true,
          default_chips: {},
        };
      }

      state.config.baseConfig.action_chips.default_chips[chipId] = {
        label: chip.label,
        value: chip.value,
        ...(chip.target_branch && { target_branch: chip.target_branch }),
      };
    });
    markDirty();
  };

  const updateChip = (chipId: string, updates: Partial<ActionChip>) => {
    setState((state) => {
      if (!state.config.baseConfig?.action_chips?.default_chips?.[chipId]) return;

      Object.assign(state.config.baseConfig.action_chips.default_chips[chipId], updates);
    });
    markDirty();
  };

  const deleteChip = (chipId: string) => {
    setState((state) => {
      if (!state.config.baseConfig?.action_chips?.default_chips) return;

      delete state.config.baseConfig.action_chips.default_chips[chipId];
    });
    markDirty();
  };

  // Configure the generic editor
  return (
    <EntityEditor<ActionChipEntity>
      initialValue={{
        chipId: '',
        label: '',
        value: '',
        target_branch: undefined,
      }}
      config={{
        // Entity metadata
        metadata: {
          entityType: 'action-chip',
          entityName: 'Action Chip',
          entityNamePlural: 'Action Chips',
          description: 'Manage quick-access action chips with explicit branch routing',
        },

        // Empty state configuration
        emptyState: {
          icon: Zap,
          title: 'No Action Chips Defined',
          description:
            'Action chips provide quick-access buttons that route users to specific conversation branches. They appear as clickable chips in the chat interface for fast navigation.',
          actionText: 'Create First Action Chip',
        },

        // Store and operations
        useStore: () => ({
          entities: chips,

          // Create: Extract chipId and pass ActionChip data separately
          createEntity: (chipEntity: ActionChipEntity) => {
            const { chipId, ...chipData } = chipEntity;
            const chip: ActionChip = {
              label: chipData.label,
              value: chipData.value,
              ...(chipData.target_branch && { target_branch: chipData.target_branch }),
            };
            createChip(chip, chipId);
          },

          // Update: Extract chipId and pass updates
          updateEntity: (chipId: string, chipEntity: ActionChipEntity) => {
            const updates: Partial<ActionChip> = {
              label: chipEntity.label,
              value: chipEntity.value,
              target_branch: chipEntity.target_branch,
            };
            updateChip(chipId, updates);
          },

          // Delete: Just pass the chipId
          deleteEntity: (chipId: string) => {
            deleteChip(chipId);
          },

          // Dependencies: Action chips don't have dependencies
          getDependencies: (): EntityDependencies => {
            return {
              canDelete: true,
              dependentEntities: [],
            };
          },
        }),

        // Validation
        validation: validateActionChip,

        // ID and name extraction
        getId: (chip) => chip.chipId,
        getName: (chip) => chip.label,

        // Domain-specific components
        FormFields: ActionChipFormFields,
        CardContent: ActionChipCardContent,
      }}
    />
  );
};
