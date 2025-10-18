/**
 * BranchCardContent Component
 * Domain-specific content display for branch cards
 *
 * This component only handles rendering the card body - the header,
 * actions, and layout are handled by the generic EntityList.
 */

import React from 'react';
import { Badge } from '@/components/ui';
import { Tag } from 'lucide-react';
import { useConfigStore } from '@/store';
import type { CardContentProps } from '@/lib/crud/types';
import type { BranchEntity } from './types';

export const BranchCardContent: React.FC<CardContentProps<BranchEntity>> = ({
  entity: branch,
}) => {
  const ctas = useConfigStore((state) => state.ctas.ctas);

  // Get CTA label by ID
  const getCTALabel = (ctaId: string): string => {
    return ctas[ctaId]?.label || ctaId;
  };

  const keywordCount = branch.detection_keywords.length;
  const secondaryCTACount = branch.available_ctas.secondary.length;

  return (
    <div className="space-y-3">
      {/* Detection Keywords */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Detection Keywords ({keywordCount})
        </p>
        {keywordCount > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {branch.detection_keywords.slice(0, 5).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs gap-1">
                <Tag className="w-2.5 h-2.5" />
                {keyword}
              </Badge>
            ))}
            {keywordCount > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{keywordCount - 5} more
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            No keywords defined
          </p>
        )}
      </div>

      {/* Primary CTA */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Primary CTA
        </p>
        <Badge variant="success" className="text-xs">
          {getCTALabel(branch.available_ctas.primary)}
        </Badge>
      </div>

      {/* Secondary CTAs */}
      {secondaryCTACount > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Secondary CTAs ({secondaryCTACount})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {branch.available_ctas.secondary.map((ctaId) => (
              <Badge key={ctaId} variant="outline" className="text-xs">
                {getCTALabel(ctaId)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
