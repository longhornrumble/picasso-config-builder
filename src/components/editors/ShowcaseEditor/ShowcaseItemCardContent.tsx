/**
 * ShowcaseItemCardContent Component
 * Domain-specific content display for showcase item cards
 */

import React from 'react';
import { Badge } from '@/components/ui';
import { useConfigStore } from '@/store';
import { BookOpen, Calendar, Target, Megaphone, Tag } from 'lucide-react';
import type { CardContentProps } from '@/lib/crud/types';
import type { ShowcaseItemEntity } from './types';
import type { ShowcaseItemType } from '@/types/config';

export const ShowcaseItemCardContent: React.FC<CardContentProps<ShowcaseItemEntity>> = ({
  entity: item,
}) => {
  const ctas = useConfigStore((state) => state.ctas.ctas);

  // Get icon based on type
  const getTypeIcon = (type: ShowcaseItemType) => {
    switch (type) {
      case 'program':
        return <BookOpen className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'initiative':
        return <Target className="w-4 h-4" />;
      case 'campaign':
        return <Megaphone className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  // Get badge variant based on type
  const getTypeBadgeVariant = (
    type: ShowcaseItemType
  ): 'default' | 'success' | 'warning' | 'secondary' => {
    switch (type) {
      case 'program':
        return 'success';
      case 'event':
        return 'warning';
      case 'initiative':
        return 'default';
      case 'campaign':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-3">
      {/* Type and Enabled badges */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <Badge variant={getTypeBadgeVariant(item.type)} className="text-xs flex items-center gap-1">
          {getTypeIcon(item.type)}
          {item.type}
        </Badge>
        {!item.enabled && (
          <Badge variant="outline" className="text-xs">
            Disabled
          </Badge>
        )}
      </div>

      {/* Tagline */}
      <div>
        <p className="text-sm italic text-gray-600 dark:text-gray-400">
          {item.tagline}
        </p>
      </div>

      {/* Description */}
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Stats */}
      {item.stats && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Stats
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {item.stats}
          </p>
        </div>
      )}

      {/* Keywords */}
      {item.keywords.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Keywords
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.keywords.slice(0, 5).map((keyword, idx) => (
              <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {keyword}
              </Badge>
            ))}
            {item.keywords.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{item.keywords.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Linked CTA */}
      {item.action?.cta_id && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Linked CTA
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {ctas[item.action.cta_id]?.label || item.action.cta_id}
          </p>
        </div>
      )}

      {/* Highlights */}
      {item.highlights && item.highlights.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Highlights
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {item.highlights.slice(0, 3).map((highlight, idx) => (
              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                {highlight}
              </li>
            ))}
          </ul>
          {item.highlights.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              +{item.highlights.length - 3} more highlights
            </p>
          )}
        </div>
      )}
    </div>
  );
};
