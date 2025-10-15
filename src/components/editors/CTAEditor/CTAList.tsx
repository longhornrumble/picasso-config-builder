/**
 * CTAList Component
 * Displays a responsive grid of CTA cards
 */

import React from 'react';
import { CTACard } from './CTACard';
import type { CTADefinition } from '@/types/config';

export interface CTAListProps {
  /**
   * Record of CTAs to display
   */
  ctas: Record<string, CTADefinition>;
  /**
   * Callback when edit button is clicked on a CTA
   */
  onEdit: (ctaId: string, cta: CTADefinition) => void;
  /**
   * Callback when delete button is clicked on a CTA
   */
  onDelete: (ctaId: string, cta: CTADefinition) => void;
}

/**
 * CTAList - Responsive grid display of CTA cards
 *
 * @example
 * ```tsx
 * <CTAList
 *   ctas={ctas}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const CTAList: React.FC<CTAListProps> = ({ ctas, onEdit, onDelete }) => {
  const ctaEntries = Object.entries(ctas);

  if (ctaEntries.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {ctaEntries.map(([ctaId, cta]) => (
        <CTACard
          key={ctaId}
          ctaId={ctaId}
          cta={cta}
          onEdit={() => onEdit(ctaId, cta)}
          onDelete={() => onDelete(ctaId, cta)}
        />
      ))}
    </div>
  );
};
