/**
 * AvailableActionsEditor Component
 * Manages AI vocabulary entries (forms and links) using the generic CRUD framework
 */

import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { AvailableActionsFormFields } from './AvailableActionsFormFields';
import { AvailableActionsCardContent } from './AvailableActionsCardContent';
import { useConfigStore } from '@/store';
import type { AvailableActionEntity } from './types';
import type { EntityDependencies } from '@/lib/crud/types';
import type { AvailableActionEntry } from '@/types/config';

export const AvailableActionsEditor: React.FC = () => {
  const actionsRecord = useConfigStore((state) => state.availableActions.actions);
  const createAction = useConfigStore((state) => state.availableActions.createAction);
  const updateAction = useConfigStore((state) => state.availableActions.updateAction);
  const deleteAction = useConfigStore((state) => state.availableActions.deleteAction);

  // Transform from Record<string, AvailableActionEntry> to Record<string, AvailableActionEntity>
  const actions = useMemo(() => {
    return Object.entries(actionsRecord).reduce((acc, [actionId, action]) => {
      acc[actionId] = {
        ...action,
        actionId,
      };
      return acc;
    }, {} as Record<string, AvailableActionEntity>);
  }, [actionsRecord]);

  return (
    <EntityEditor<AvailableActionEntity>
      initialValue={{
        actionId: '',
        type: 'form',
        label: '',
        description: '',
        direct_cta: false,
        show_info: false,
        prompt: '',
        target_branch: undefined,
        url: '',
      }}
      config={{
        metadata: {
          entityType: 'available-action',
          entityName: 'Vocabulary Entry',
          entityNamePlural: 'Vocabulary Entries',
          description: 'Define the forms and links the AI can offer in conversation via Tag & Map',
        },

        emptyState: {
          icon: BookOpen,
          title: 'No Vocabulary Entries',
          description:
            'Vocabulary entries define what forms and links the AI can offer users in conversation. Each entry becomes an action the AI can tag in its responses.',
          actionText: 'Create First Entry',
        },

        useStore: () => ({
          entities: actions,

          createEntity: (entity: AvailableActionEntity) => {
            const { actionId, ...data } = entity;
            const entry: AvailableActionEntry = {
              type: data.type,
              label: data.label,
              ...(data.type === 'form' && {
                ...(data.description && { description: data.description }),
                ...(data.direct_cta !== undefined && { direct_cta: data.direct_cta }),
                ...(data.show_info !== undefined && { show_info: data.show_info }),
                ...(data.prompt && { prompt: data.prompt }),
                ...(data.target_branch && { target_branch: data.target_branch }),
              }),
              ...(data.type === 'link' && {
                ...(data.url && { url: data.url }),
              }),
            };
            createAction(entry, actionId);
          },

          updateEntity: (actionId: string, entity: AvailableActionEntity) => {
            const updates: Partial<AvailableActionEntry> = {
              type: entity.type,
              label: entity.label,
            };
            if (entity.type === 'form') {
              updates.description = entity.description || undefined;
              updates.direct_cta = entity.direct_cta;
              updates.show_info = entity.show_info;
              updates.prompt = entity.show_info ? (entity.prompt || undefined) : undefined;
              updates.target_branch = entity.show_info ? (entity.target_branch || undefined) : undefined;
              updates.url = undefined;
            } else {
              updates.url = entity.url;
              updates.description = undefined;
              updates.direct_cta = undefined;
              updates.show_info = undefined;
              updates.prompt = undefined;
              updates.target_branch = undefined;
            }
            updateAction(actionId, updates);
          },

          deleteEntity: (actionId: string) => {
            deleteAction(actionId);
          },

          getDependencies: (): EntityDependencies => ({
            canDelete: true,
            dependentEntities: [],
          }),
        }),

        validation: (entity: AvailableActionEntity) => {
          const errors: Record<string, string> = {};
          if (!entity.actionId) errors.actionId = 'Action ID is required';
          if (!entity.label) errors.label = 'Label is required';
          if (!entity.type) errors.type = 'Type is required';
          if (entity.type === 'link' && !entity.url) errors.url = 'URL is required for link entries';
          if (entity.type === 'form' && entity.show_info && !entity.prompt) {
            errors.prompt = 'Info prompt is required when Show Info is enabled';
          }
          return errors;
        },

        getId: (action) => action.actionId,
        getName: (action) => action.label,

        FormFields: AvailableActionsFormFields,
        CardContent: AvailableActionsCardContent,
      }}
    />
  );
};
