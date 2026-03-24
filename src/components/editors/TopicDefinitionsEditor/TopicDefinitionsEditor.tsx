/**
 * TopicDefinitionsEditor Component
 * Main container for managing V4.1 topic definitions using the generic CRUD framework.
 *
 * Topic definitions drive the V4.1 classification pipeline:
 *  1. The classifier reads `description` to match the user's message to a topic.
 *  2. The pool selector filters CTAs whose `selection_metadata.topic_tags` intersect
 *     with the matched topic's `tags`.
 *  3. `role` and `depth_override` further narrow the CTA pool.
 *
 * Store contract (implemented by the topicDefinitions slice — see store/slices/topicDefinitions.ts):
 *  state.topicDefinitions.topics          — Record<string, TopicDefinition>
 *  state.topicDefinitions.createTopic     — (topic: TopicDefinition) => void
 *  state.topicDefinitions.updateTopic     — (name: string, topic: TopicDefinition) => void
 *  state.topicDefinitions.deleteTopic     — (name: string) => void
 *  state.topicDefinitions.getTopicDependencies — (name: string) => EntityDependencies
 *  state.topicDefinitions.duplicateTopic  — (name: string) => void
 */

import React, { useMemo } from 'react';
import { Tags } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { TopicFormFields } from './TopicFormFields';
import { TopicCardContent } from './TopicCardContent';
import { validateTopic } from '@/lib/validation/formValidators';
import { useConfigStore } from '@/store';
import type { TopicEntity } from './types';
import type { TopicDefinition } from '@/types/config';
import type { EntityDependencies } from '@/lib/crud/types';

/**
 * TopicDefinitionsEditor — topic definitions management using the generic CRUD framework.
 *
 * @example
 * ```tsx
 * <TopicDefinitionsEditor />
 * ```
 */
export const TopicDefinitionsEditor: React.FC = () => {
  // ---------------------------------------------------------------------------
  // Access the topicDefinitions slice from the store.
  // The slice is created by store/slices/topicDefinitions.ts.
  // ---------------------------------------------------------------------------
  const topicsArray = useConfigStore(
    (state) => state.topicDefinitions.topicDefinitions
  );

  const createTopic = useConfigStore(
    (state) => state.topicDefinitions.createTopic
  );

  const updateTopic = useConfigStore(
    (state) => state.topicDefinitions.updateTopic
  );

  const deleteTopic = useConfigStore(
    (state) => state.topicDefinitions.deleteTopic
  );

  const getTopicDependenciesRaw = useConfigStore(
    (state) => state.topicDefinitions.getTopicDependencies
  );

  const duplicateTopic = useConfigStore(
    (state) => state.topicDefinitions.duplicateTopic
  );

  // ---------------------------------------------------------------------------
  // Transform Record<string, TopicDefinition> → Record<string, TopicEntity>
  // by adding the `topicName` field required by the generic framework.
  // ---------------------------------------------------------------------------
  const topicEntities = useMemo(() => {
    return topicsArray.reduce(
      (acc, topic) => {
        acc[topic.name] = { ...topic, topicName: topic.name };
        return acc;
      },
      {} as Record<string, TopicEntity>
    );
  }, [topicsArray]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <EntityEditor<TopicEntity>
      initialValue={{
        topicName: '',
        name: '',
        description: '',
        tags: [],
        role: undefined,
        depth_override: undefined,
      }}
      config={{
        // -----------------------------------------------------------------------
        // Entity metadata
        // -----------------------------------------------------------------------
        metadata: {
          entityType: 'topic',
          entityName: 'Topic',
          entityNamePlural: 'Topic Definitions',
          description:
            'Define classifier topics that drive V4.1 dynamic CTA pool selection. Each topic maps user intent to a set of tagged CTAs.',
        },

        // -----------------------------------------------------------------------
        // Empty state
        // -----------------------------------------------------------------------
        emptyState: {
          icon: Tags,
          title: 'No Topic Definitions',
          description:
            'Topic definitions teach the V4.1 classifier to recognise user intent and select the right CTAs. Create your first topic to enable dynamic CTA pool selection.',
          actionText: 'Create First Topic',
        },

        // -----------------------------------------------------------------------
        // Store bridge — maps generic CRUD operations to the topicDefinitions slice
        // -----------------------------------------------------------------------
        useStore: () => ({
          entities: topicEntities,

          createEntity: (entity: TopicEntity) => {
            const { topicName, ...rest } = entity;
            const topic: TopicDefinition = {
              ...rest,
              name: topicName,
              tags: entity.tags && entity.tags.length > 0 ? entity.tags : undefined,
              role: entity.role || undefined,
              depth_override: entity.depth_override || undefined,
            };
            createTopic(topic);
          },

          updateEntity: (name: string, entity: TopicEntity) => {
            const topic: TopicDefinition = {
              name,
              description: entity.description,
              tags: entity.tags && entity.tags.length > 0 ? entity.tags : undefined,
              role: entity.role || undefined,
              depth_override: entity.depth_override || undefined,
            };
            updateTopic(name, topic);
          },

          deleteEntity: (name: string) => {
            deleteTopic(name);
          },

          getDependencies: (name: string): EntityDependencies => {
            const dependentCTAIds = getTopicDependenciesRaw(name);
            return {
              canDelete: true,
              dependentEntities:
                dependentCTAIds.length > 0
                  ? [{ type: 'CTA', ids: dependentCTAIds, names: dependentCTAIds }]
                  : [],
            };
          },

          duplicateEntity: (name: string) => duplicateTopic(name),
        }),

        // -----------------------------------------------------------------------
        // Validation
        // -----------------------------------------------------------------------
        validation: validateTopic,

        // -----------------------------------------------------------------------
        // ID and name extraction
        // -----------------------------------------------------------------------
        getId: (topic) => topic.topicName,
        getName: (topic) => topic.topicName,

        // -----------------------------------------------------------------------
        // Domain-specific render components
        // -----------------------------------------------------------------------
        FormFields: TopicFormFields,
        CardContent: TopicCardContent,

        allowDuplicate: true,
      }}
    />
  );
};
