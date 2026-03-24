/**
 * Topic Validation
 * Validates V4.1 topic definitions used by the classifier for CTA pool selection
 */

import type { TopicDefinition } from '@/types/config';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';
import { createError, createWarning } from './validationMessages';

// ============================================================================
// SINGLE TOPIC VALIDATION
// ============================================================================

/**
 * Validate a single topic definition
 *
 * @param topic - The topic to validate
 * @param index - The index of this topic in the array (used when name is unavailable)
 * @returns Validation result with errors and warnings
 */
export function validateTopic(topic: TopicDefinition, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const entityId = topic.name ? `topic-${topic.name}` : `topic-index-${index}`;

  // Error: name is empty or doesn't match snake_case identifier pattern
  if (!topic.name || topic.name.trim() === '') {
    errors.push(
      createError('Topic name is required\n\u2192 Fix: Provide a unique snake_case identifier (e.g., volunteer_programs)', 'topic', {
        field: 'name',
        entityId,
        suggestedFix: 'Use a lowercase snake_case identifier starting with a letter (e.g., volunteer_programs, job_placement)',
      })
    );
  } else if (!/^[a-z][a-z0-9_]*$/.test(topic.name)) {
    errors.push(
      createError(
        `Topic name "${topic.name}" is invalid\n\u2192 Fix: Use only lowercase letters, digits, and underscores, starting with a letter`,
        'topic',
        {
          field: 'name',
          entityId,
          suggestedFix: 'Example valid names: volunteer_programs, job_placement_services, housing_assistance',
        }
      )
    );
  }

  // Error: description is empty or under 20 characters
  if (!topic.description || topic.description.trim() === '') {
    errors.push(
      createError('Topic description is required\n\u2192 Fix: Write a natural language description that the classifier will read', 'topic', {
        field: 'description',
        entityId,
        suggestedFix: 'Provide at least 20 characters describing when this topic should match',
      })
    );
  } else if (topic.description.trim().length < 20) {
    errors.push(
      createError(
        `Topic description is too short (${topic.description.trim().length} chars, minimum 20)\n\u2192 Fix: Expand the description to improve classifier accuracy`,
        'topic',
        {
          field: 'description',
          entityId,
          suggestedFix: 'Include specific keywords and phrases that indicate when a user is asking about this topic',
        }
      )
    );
  } else if (topic.description.trim().length < 40) {
    // Warning: description under 40 characters
    warnings.push(
      createWarning(
        'Topic descriptions should include specific KB terms for classifier accuracy\n\u2192 Suggestion: Expand to 40+ characters with domain-specific vocabulary',
        'topic',
        {
          field: 'description',
          entityId,
          suggestedFix: 'Add synonyms, program names, or specific phrases users might say when asking about this topic',
        }
      )
    );
  }

  // Warning: role set but no tags — role filter has no effect without tags
  if (topic.role && (!topic.tags || topic.tags.length === 0)) {
    warnings.push(
      createWarning(
        'Role filter has no effect without tags\n\u2192 Suggestion: Add tags to this topic so the role filter can drive CTA pool selection',
        'topic',
        {
          field: 'role',
          entityId,
          suggestedFix: 'Add at least one tag to this topic that matches a CTA\'s selection_metadata.topic_tags value',
        }
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'topic',
    entityId,
  };
}

// ============================================================================
// BULK TOPIC VALIDATION
// ============================================================================

/**
 * Validate all topic definitions
 *
 * @param topics - Array of topic definitions
 * @returns Validation result with aggregated errors and warnings
 */
export function validateTopics(topics: TopicDefinition[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate each topic individually
  topics.forEach((topic, index) => {
    const result = validateTopic(topic, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  // Error: Duplicate topic names
  const namesSeen = new Map<string, number>();
  topics.forEach((topic, index) => {
    if (!topic.name) return;
    if (namesSeen.has(topic.name)) {
      errors.push(
        createError(
          `Duplicate topic name "${topic.name}" found at index ${index} (first seen at index ${namesSeen.get(topic.name)})\n\u2192 Fix: Each topic must have a unique name`,
          'topic',
          {
            field: 'name',
            entityId: `topic-${topic.name}`,
            suggestedFix: `Rename one of the "${topic.name}" topics to a unique identifier`,
          }
        )
      );
    } else {
      namesSeen.set(topic.name, index);
    }
  });

  // Warning: Fewer than 3 topics
  if (topics.length > 0 && topics.length < 3) {
    warnings.push(
      createWarning(
        `Only ${topics.length} topic${topics.length === 1 ? '' : 's'} defined — most tenants need 6-12 topics for good classifier coverage\n\u2192 Suggestion: Add more topics to improve classification accuracy`,
        'topic',
        {
          suggestedFix: 'Consider adding topics for each major service, program type, or user intent your chatbot handles',
        }
      )
    );
  }

  // Warning: All topics are tagless
  if (topics.length > 0) {
    const topicsWithTags = topics.filter((t) => t.tags && t.tags.length > 0);
    if (topicsWithTags.length === 0) {
      warnings.push(
        createWarning(
          'No topics have tags — no CTAs will be shown by the classifier\n\u2192 Suggestion: Add tags to topics that should surface CTAs',
          'topic',
          {
            suggestedFix: 'Add tags to topics and ensure CTAs have matching selection_metadata.topic_tags entries',
          }
        )
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entity: 'topic',
  };
}
