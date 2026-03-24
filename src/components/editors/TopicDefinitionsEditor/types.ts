/**
 * TopicDefinitionsEditor Types
 * Extended types for the topic definitions editor to work with the generic CRUD framework.
 *
 * The store represents topic definitions as an array (TopicDefinition[]) keyed by `name`.
 * The generic CRUD framework requires a Record<string, T> keyed by a consistent ID field.
 * TopicEntity adds `topicName` as an explicit ID field so the framework can operate on it.
 */

import type { TopicDefinition } from '@/types/config';

/**
 * TopicEntity - TopicDefinition with an explicit ID field.
 *
 * `topicName` mirrors `name` and is used as the primary key by the generic CRUD framework.
 * This keeps the domain type (TopicDefinition) unmodified while satisfying BaseEntity.
 */
export interface TopicEntity extends TopicDefinition {
  /** Equals `name`. Required by the generic CRUD framework as the unique identifier field. */
  topicName: string;
}
