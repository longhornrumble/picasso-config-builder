/**
 * TagVocabulary Component
 *
 * Displays a table of all unique tags across topic definitions, CTA selection
 * metadata, and fallback_tags, with connectivity status for each tag.
 *
 * Accessibility:
 * - Table uses semantic <table>, <thead>, <tbody>, <th scope="col"> markup
 * - Status badges provide text labels (not icon-only)
 * - Component returns null when no tags exist, preventing an empty landmark
 */

import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@/components/ui';
import { useConfigStore } from '@/store';

// ============================================================================
// TYPES
// ============================================================================

type TagStatus = 'connected' | 'orphan-topic' | 'orphan-cta' | 'fallback';

interface TagRow {
  tag: string;
  topics: string[];
  ctas: string[];
  isFallback: boolean;
  status: TagStatus;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * TagVocabulary
 *
 * Renders a sortable-by-status table showing every unique tag string found in:
 * - topic_definitions[].tags
 * - cta_definitions[*].selection_metadata.topic_tags
 * - cta_settings.fallback_tags
 *
 * Status semantics:
 * - connected:    tag appears in at least one topic AND at least one CTA
 * - fallback:     tag is in cta_settings.fallback_tags (may also be connected)
 * - orphan-topic: tag only in topics, no CTA will match it
 * - orphan-cta:   tag only in CTAs, no topic definition uses it
 *
 * Performance: all derivation is inside a single useMemo that only re-runs
 * when topicDefinitions, ctas, or ctaSettings change.
 */
export const TagVocabulary: React.FC = () => {
  const topicDefinitions = useConfigStore((state) => state.topicDefinitions.topicDefinitions);
  const ctas = useConfigStore((state) => state.ctas.ctas);
  const ctaSettings = useConfigStore((state) => state.config.baseConfig?.cta_settings);

  const tagData = useMemo((): TagRow[] => {
    // Collect all tags from topics, CTAs, and fallback_tags
    const allTags = new Map<string, { topics: string[]; ctas: string[]; isFallback: boolean }>();

    // Topic tags
    topicDefinitions.forEach((topic) => {
      (topic.tags ?? []).forEach((tag) => {
        if (!allTags.has(tag)) {
          allTags.set(tag, { topics: [], ctas: [], isFallback: false });
        }
        allTags.get(tag)!.topics.push(topic.name);
      });
    });

    // CTA selection_metadata tags
    Object.entries(ctas).forEach(([ctaId, cta]) => {
      (cta.selection_metadata?.topic_tags ?? []).forEach((tag) => {
        if (!allTags.has(tag)) {
          allTags.set(tag, { topics: [], ctas: [], isFallback: false });
        }
        allTags.get(tag)!.ctas.push(ctaId);
      });
    });

    // Fallback tags from cta_settings
    (ctaSettings?.fallback_tags ?? []).forEach((tag) => {
      if (!allTags.has(tag)) {
        allTags.set(tag, { topics: [], ctas: [], isFallback: false });
      }
      allTags.get(tag)!.isFallback = true;
    });

    return Array.from(allTags.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, data]) => {
        let status: TagStatus = 'connected';
        if (data.isFallback) {
          status = 'fallback';
        } else if (data.topics.length > 0 && data.ctas.length === 0) {
          status = 'orphan-topic';
        } else if (data.topics.length === 0 && data.ctas.length > 0) {
          status = 'orphan-cta';
        }

        return { tag, ...data, status };
      });
  }, [topicDefinitions, ctas, ctaSettings]);

  // Don't render if there are no tags to display
  if (tagData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Vocabulary</CardTitle>
        <CardDescription>
          Tag connectivity between topic definitions and CTA selection metadata
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-label="Tag vocabulary connectivity table"
          >
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th
                  scope="col"
                  className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300"
                >
                  Tag
                </th>
                <th
                  scope="col"
                  className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300"
                >
                  Topics
                </th>
                <th
                  scope="col"
                  className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300"
                >
                  CTAs
                </th>
                <th
                  scope="col"
                  className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {tagData.map(({ tag, topics, ctas: ctaIds, status }) => (
                <tr
                  key={tag}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="py-2 px-3 font-mono text-xs text-gray-900 dark:text-gray-100">
                    {tag}
                  </td>
                  <td
                    className="py-2 px-3 text-gray-600 dark:text-gray-400"
                    title={topics.length > 0 ? topics.join(', ') : undefined}
                    aria-label={`${topics.length} topic${topics.length !== 1 ? 's' : ''}`}
                  >
                    {topics.length}
                  </td>
                  <td
                    className="py-2 px-3 text-gray-600 dark:text-gray-400"
                    title={ctaIds.length > 0 ? ctaIds.join(', ') : undefined}
                    aria-label={`${ctaIds.length} CTA${ctaIds.length !== 1 ? 's' : ''}`}
                  >
                    {ctaIds.length}
                  </td>
                  <td className="py-2 px-3">
                    {status === 'connected' && (
                      <Badge variant="success">Connected</Badge>
                    )}
                    {status === 'fallback' && (
                      <Badge variant="outline">Fallback</Badge>
                    )}
                    {status === 'orphan-topic' && (
                      <Badge variant="warning">Topic only</Badge>
                    )}
                    {status === 'orphan-cta' && (
                      <Badge variant="warning">CTA only</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
