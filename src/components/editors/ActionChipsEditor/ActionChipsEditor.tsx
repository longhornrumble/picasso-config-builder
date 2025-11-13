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
    console.log('🔍 chips memoization running, chipsRecord:', chipsRecord);
    const result = Object.entries(chipsRecord).reduce((acc, [chipId, chip]) => {
      acc[chipId] = {
        ...chip,
        chipId,
      };
      return acc;
    }, {} as Record<string, ActionChipEntity>);
    console.log('🔍 chips memoization result:', result);
    return result;
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
        action: chip.action || 'send_query',
        value: chip.value,
        ...(chip.target_branch && { target_branch: chip.target_branch }),
        ...(chip.program_id && { program_id: chip.program_id }),
      };
    });
    markDirty();
  };

  const updateChip = (chipId: string, updates: Partial<ActionChip>) => {
    console.log('🚀 updateChip CALLED with chipId:', chipId, 'updates:', updates);

    setState((state) => {
      if (!state.config.baseConfig?.action_chips?.default_chips?.[chipId]) {
        console.log('❌ updateChip - chip not found in store:', chipId);
        return;
      }

      const currentChip = state.config.baseConfig.action_chips.default_chips[chipId];
      console.log('🔧 updateChip - current chip:', currentChip);
      console.log('🔧 updateChip - updates:', updates);

      // Build the updated chip with all fields explicitly set
      const updatedChip: ActionChip = {
        label: updates.label !== undefined ? updates.label : currentChip.label,
        action: updates.action !== undefined ? updates.action : (currentChip.action || 'send_query'),
        value: updates.value !== undefined ? updates.value : currentChip.value,
      };

      // Add optional fields if present in either updates or current chip
      if ('target_branch' in updates || 'target_branch' in currentChip) {
        updatedChip.target_branch = 'target_branch' in updates ? updates.target_branch : currentChip.target_branch;
      }

      if ('program_id' in updates || 'program_id' in currentChip) {
        updatedChip.program_id = 'program_id' in updates ? updates.program_id : currentChip.program_id;
      }

      console.log('✅ updateChip - final chip:', updatedChip);

      // Replace the chip entirely
      state.config.baseConfig.action_chips.default_chips[chipId] = updatedChip;

      console.log('💾 updateChip - chip replaced in state, verifying:', state.config.baseConfig.action_chips.default_chips[chipId]);
    });

    // Check the store AFTER setState completes
    setTimeout(() => {
      const currentStore = useConfigStore.getState();
      const verifyChip = currentStore.config.baseConfig?.action_chips?.default_chips?.[chipId];
      console.log('🔬 VERIFICATION - chip in store after setState:', verifyChip);
    }, 0);

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
        action: 'send_query',
        value: '',
        target_branch: undefined,
        program_id: undefined,
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
              action: chipData.action || 'send_query',
              value: chipData.value,
              ...(chipData.target_branch && { target_branch: chipData.target_branch }),
              ...(chipData.program_id && { program_id: chipData.program_id }),
            };
            createChip(chip, chipId);
          },

          // Update: Extract chipId and pass all fields from form
          updateEntity: (chipId: string, chipEntity: ActionChipEntity) => {
            console.log('🔄 ActionChips updateEntity called:', {
              chipId,
              chipEntity,
              action: chipEntity.action,
              program_id: chipEntity.program_id,
            });
            const updates: Partial<ActionChip> = {
              label: chipEntity.label,
              action: chipEntity.action, // Don't default here, let updateChip handle it
              value: chipEntity.value,
              target_branch: chipEntity.target_branch,
              program_id: chipEntity.program_id,
            };
            console.log('📦 Updates object:', updates);
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
