/**
 * Topic Definitions Slice
 * Manages V4.1 topic definition entities and their CRUD operations.
 *
 * Topic definitions are stored as an ordered array (not a Record keyed by ID)
 * because ordering matters for the classifier — the classifier reads descriptions
 * in sequence. The `name` field serves as the identifier within the list.
 */

import type { TopicDefinition } from '@/types/config';
import type { SliceCreator, TopicDefinitionsSlice } from '../types';

export const createTopicDefinitionsSlice: SliceCreator<TopicDefinitionsSlice> = (set, get) => ({
  // State
  topicDefinitions: [],
  activeTopicName: null,

  // Actions

  createTopic: (topic: TopicDefinition) => {
    let createSucceeded = false;

    set((state) => {
      // Check for duplicate names
      const exists = state.topicDefinitions.topicDefinitions.some((t) => t.name === topic.name);
      if (exists) {
        get().ui.addToast({
          type: 'error',
          message: `Topic name "${topic.name}" already exists`,
        });
        return;
      }

      state.topicDefinitions.topicDefinitions.push(topic);
      state.config.markDirty();
      createSucceeded = true;
    });

    if (createSucceeded) {
      get().ui.addToast({
        type: 'success',
        message: `Topic "${topic.name}" created successfully`,
      });
    }

    // Re-run validation after creating topic
    get().validation.validateAll();
  },

  updateTopic: (name: string, updates: Partial<TopicDefinition>) => {
    let updateSucceeded = false;

    set((state) => {
      const index = state.topicDefinitions.topicDefinitions.findIndex((t) => t.name === name);

      if (index === -1) {
        console.error('[topicDefinitions.ts] Topic not found:', {
          name,
          availableNames: state.topicDefinitions.topicDefinitions.map((t) => t.name),
        });
        return;
      }

      // If name is changing, check for duplicates
      if (updates.name && updates.name !== name) {
        const duplicateIndex = state.topicDefinitions.topicDefinitions.findIndex(
          (t) => t.name === updates.name
        );
        if (duplicateIndex !== -1) {
          get().ui.addToast({
            type: 'error',
            message: `Topic name "${updates.name}" already exists`,
          });
          return;
        }

        // Update activeTopicName if the renamed topic was active
        if (state.topicDefinitions.activeTopicName === name) {
          state.topicDefinitions.activeTopicName = updates.name;
        }
      }

      state.topicDefinitions.topicDefinitions[index] = {
        ...state.topicDefinitions.topicDefinitions[index],
        ...updates,
      };
      state.config.markDirty();
      updateSucceeded = true;
    });

    if (updateSucceeded) {
      get().ui.addToast({
        type: 'success',
        message: 'Topic updated successfully',
      });
    }

    // Re-run validation after updating topic
    get().validation.validateAll();
  },

  deleteTopic: (name: string) => {
    set((state) => {
      const index = state.topicDefinitions.topicDefinitions.findIndex((t) => t.name === name);

      if (index === -1) {
        console.error('[topicDefinitions.ts] Topic not found for deletion:', name);
        return;
      }

      const topicName = state.topicDefinitions.topicDefinitions[index].name;
      state.topicDefinitions.topicDefinitions.splice(index, 1);

      // Clear active topic if deleted
      if (state.topicDefinitions.activeTopicName === name) {
        state.topicDefinitions.activeTopicName = null;
      }

      state.config.markDirty();

      get().ui.addToast({
        type: 'success',
        message: `Topic "${topicName}" deleted successfully`,
      });
    });

    // Re-run validation after deleting topic
    get().validation.validateAll();
  },

  duplicateTopic: (name: string) => {
    const topic = get().topicDefinitions.getTopic(name);

    if (!topic) {
      get().ui.addToast({
        type: 'error',
        message: 'Topic not found',
      });
      return;
    }

    // Generate a unique name for the copy
    const baseName = `${name}_copy`;
    let newName = baseName;
    let counter = 1;
    const existingNames = new Set(get().topicDefinitions.topicDefinitions.map((t) => t.name));
    while (existingNames.has(newName)) {
      newName = `${baseName}_${counter}`;
      counter++;
    }

    const newTopic: TopicDefinition = {
      ...topic,
      name: newName,
    };

    get().topicDefinitions.createTopic(newTopic);
  },

  reorderTopics: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const topics = state.topicDefinitions.topicDefinitions;

      if (fromIndex < 0 || fromIndex >= topics.length || toIndex < 0 || toIndex >= topics.length) {
        console.error('[topicDefinitions.ts] reorderTopics: index out of bounds', {
          fromIndex,
          toIndex,
          length: topics.length,
        });
        return;
      }

      const [removed] = topics.splice(fromIndex, 1);
      topics.splice(toIndex, 0, removed);
      state.config.markDirty();
    });
  },

  setActiveTopic: (name: string | null) => {
    set((state) => {
      state.topicDefinitions.activeTopicName = name;
    });
  },

  // Selectors

  getTopic: (name: string) => {
    return get().topicDefinitions.topicDefinitions.find((t) => t.name === name);
  },

  getAllTopics: () => {
    return get().topicDefinitions.topicDefinitions;
  },

  getTopicDependencies: (name: string) => {
    const state = get();
    const topic = state.topicDefinitions.topicDefinitions.find((t) => t.name === name);

    // Collect the tags belonging to this topic
    const topicTags = new Set(topic?.tags ?? []);

    // Find CTAs whose selection_metadata.topic_tags overlap with this topic's tags
    const dependentCTAIds: string[] = [];

    if (topicTags.size > 0) {
      Object.entries(state.ctas.ctas).forEach(([ctaId, cta]) => {
        const ctaTags = cta.selection_metadata?.topic_tags ?? [];
        const hasOverlap = ctaTags.some((tag) => topicTags.has(tag));
        if (hasOverlap) {
          dependentCTAIds.push(ctaId);
        }
      });
    }

    return dependentCTAIds;
  },
});
