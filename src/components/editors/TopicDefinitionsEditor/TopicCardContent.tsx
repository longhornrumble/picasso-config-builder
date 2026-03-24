/**
 * TopicCardContent Component
 * Domain-specific content display for topic definition cards.
 *
 * Renders inside the generic EntityList card — the header (topic name), action
 * buttons (edit / duplicate / delete), and card chrome are all handled by the
 * generic framework. This component only renders the card body.
 *
 * Layout:
 * 1. Description (truncated to ~120 chars)
 * 2. Tags as emerald pill badges (if any)
 * 3. Role badge in amber (if set)
 * 4. "Informational — no CTAs" muted label (when no tags)
 */

import React from 'react';
import { Badge } from '@/components/ui';
import type { CardContentProps } from '@/lib/crud/types';
import type { TopicEntity } from './types';

/**
 * Map a role value to a human-readable label for display.
 */
function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    give: 'give',
    receive: 'receive',
    learn: 'learn',
    connect: 'connect',
  };
  return labels[role] ?? role;
}

/**
 * TopicCardContent — card body for a single TopicDefinition entity.
 */
export const TopicCardContent: React.FC<CardContentProps<TopicEntity>> = ({
  entity: topic,
}) => {
  const hasTags = Array.isArray(topic.tags) && topic.tags.length > 0;
  const hasRole = !!topic.role;

  // Truncate description for the card preview
  const descriptionPreview =
    topic.description && topic.description.length > 120
      ? `${topic.description.slice(0, 120)}…`
      : topic.description;

  return (
    <div className="space-y-3">
      {/* Description preview */}
      {descriptionPreview ? (
        <p
          className="text-sm text-gray-600 dark:text-gray-400"
          title={topic.description}
        >
          {descriptionPreview}
        </p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No description provided
        </p>
      )}

      {/* Tags — emerald pill badges */}
      {hasTags && (
        <div className="flex flex-wrap gap-1.5" aria-label="Tags">
          {topic.tags!.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800
                dark:bg-emerald-900/40 dark:text-emerald-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: role badge + depth override indicator */}
      {(hasRole || topic.depth_override === 'action') && (
        <div className="flex flex-wrap items-center gap-1.5">
          {hasRole && (
            <Badge variant="warning" className="text-xs">
              role: {roleLabel(topic.role!)}
            </Badge>
          )}
          {topic.depth_override === 'action' && (
            <Badge variant="info" className="text-xs">
              depth: action (skip learn)
            </Badge>
          )}
        </div>
      )}

      {/* Informational topic indicator — shown only when no tags are set */}
      {!hasTags && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Informational — no CTAs
        </p>
      )}
    </div>
  );
};
