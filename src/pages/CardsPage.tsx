/**
 * CardsPage Component
 * Content Showcase editor page (formerly Card Inventory)
 */

import React from 'react';
import { ContentShowcaseEditor } from '@/components/editors/ShowcaseEditor/ContentShowcaseEditor';

/**
 * Content Showcase Page
 *
 * Editor for managing content showcase items (programs, events, initiatives, campaigns)
 * Replaces the old Card Inventory system with a simpler ad inventory model
 *
 * @example
 * ```tsx
 * <CardsPage />
 * ```
 */
export const CardsPage: React.FC = () => {
  return <ContentShowcaseEditor />;
};
