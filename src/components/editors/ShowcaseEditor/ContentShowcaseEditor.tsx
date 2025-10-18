/**
 * ContentShowcaseEditor Component
 * Main container for managing Content Showcase items using the generic CRUD framework
 *
 * Content Showcase is the simplified replacement for Card Inventory.
 * It manages showcase items (programs, events, initiatives, campaigns) as a simple list.
 */

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { EntityEditor } from '../generic/EntityEditor';
import { ShowcaseItemFormFields } from './ShowcaseItemFormFields';
import { ShowcaseItemCardContent } from './ShowcaseItemCardContent';
import { validateShowcaseItem } from '@/lib/validation/showcaseValidators';
import { useConfigStore } from '@/store';
import type { ShowcaseItemEntity } from './types';
import type { EntityDependencies } from '@/lib/crud/types';
import type { ShowcaseItem } from '@/types/config';

/**
 * ContentShowcaseEditor - Content Showcase management interface
 *
 * @example
 * ```tsx
 * <ContentShowcaseEditor />
 * ```
 */
export const ContentShowcaseEditor: React.FC = () => {
  // Get store slices
  const showcaseItems = useConfigStore((state) => state.contentShowcase.content_showcase);
  const createShowcaseItem = useConfigStore((state) => state.contentShowcase.createShowcaseItem);
  const updateShowcaseItem = useConfigStore((state) => state.contentShowcase.updateShowcaseItem);
  const deleteShowcaseItem = useConfigStore((state) => state.contentShowcase.deleteShowcaseItem);
  const getAllCTAs = useConfigStore((state) => state.ctas.getAllCTAs);

  // Transform showcase items array to Record<string, ShowcaseItem> for EntityEditor
  const showcaseItemsRecord = useMemo(() => {
    return showcaseItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, ShowcaseItem>);
  }, [showcaseItems]);

  // Get available CTA IDs for validation and dropdown
  const availableCtaIds = useMemo(() => {
    return getAllCTAs().map((cta) => cta.id);
  }, [getAllCTAs]);

  // Configure the generic editor
  return (
    <EntityEditor<ShowcaseItemEntity>
      initialValue={{
        id: '',
        type: 'program',
        enabled: true,
        name: '',
        tagline: '',
        description: '',
        keywords: [],
      }}
      config={{
        // Entity metadata
        metadata: {
          entityType: 'showcase_item',
          entityName: 'Showcase Item',
          entityNamePlural: 'Showcase Items',
          description: 'Manage content showcase items (programs, events, initiatives, campaigns)',
        },

        // Empty state configuration
        emptyState: {
          icon: Sparkles,
          title: 'No Showcase Items',
          description:
            'Showcase items are promotional content that can be displayed to users based on keywords. Create your first showcase item to get started.',
          actionText: 'Create First Showcase Item',
        },

        // Store and operations
        useStore: () => ({
          entities: showcaseItemsRecord,

          // Create: Add item to array
          createEntity: (item: ShowcaseItem) => {
            createShowcaseItem(item);
          },

          // Update: Update item in array
          updateEntity: (id: string, item: ShowcaseItem) => {
            updateShowcaseItem(id, item);
          },

          // Delete: Remove item from array
          deleteEntity: (itemId: string) => {
            deleteShowcaseItem(itemId);
          },

          // Dependencies: Showcase items have no dependencies
          getDependencies: (): EntityDependencies => {
            return {
              canDelete: true,
              dependentEntities: [],
            };
          },
        }),

        // Validation - pass availableCtaIds to context
        validation: (data, context) => {
          return validateShowcaseItem(data, {
            ...context,
            availableCtaIds,
          });
        },

        // ID and name extraction
        getId: (item) => item.id,
        getName: (item) => item.name,

        // Domain-specific components
        FormFields: ShowcaseItemFormFields,
        CardContent: ShowcaseItemCardContent,
      }}
    />
  );
};
