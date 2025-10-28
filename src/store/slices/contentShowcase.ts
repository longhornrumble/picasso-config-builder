/**
 * Content Showcase Slice
 * Manages showcase items (programs, events, initiatives, campaigns)
 */

import type { ShowcaseItem } from '@/types/config';
import type { SliceCreator, ContentShowcaseSlice } from '../types';

export const createContentShowcaseSlice: SliceCreator<ContentShowcaseSlice> = (set, get) => ({
  // State
  content_showcase: [],

  // Actions
  createShowcaseItem: (item: ShowcaseItem) => {
    set((state) => {
      state.contentShowcase.content_showcase.push(item);
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `Showcase item "${item.name}" created successfully`,
    });

    // Re-run validation after creating showcase item
    get().validation.validateAll();
  },

  updateShowcaseItem: (id: string, updates: Partial<ShowcaseItem>) => {
    set((state) => {
      const index = state.contentShowcase.content_showcase.findIndex(
        (item) => item.id === id
      );
      if (index !== -1) {
        state.contentShowcase.content_showcase[index] = {
          ...state.contentShowcase.content_showcase[index],
          ...updates,
        };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Showcase item updated successfully',
    });

    // Re-run validation after updating showcase item
    get().validation.validateAll();
  },

  deleteShowcaseItem: (id: string) => {
    set((state) => {
      const index = state.contentShowcase.content_showcase.findIndex(
        (item) => item.id === id
      );
      if (index !== -1) {
        const itemName = state.contentShowcase.content_showcase[index].name;
        state.contentShowcase.content_showcase.splice(index, 1);
        state.config.markDirty();

        get().ui.addToast({
          type: 'success',
          message: `Showcase item "${itemName}" deleted`,
        });
      }
    });

    // Re-run validation after deleting showcase item
    get().validation.validateAll();
  },

  // Selectors
  getShowcaseItems: () => {
    return get().contentShowcase.content_showcase;
  },

  getShowcaseItem: (id: string) => {
    return get().contentShowcase.content_showcase.find((item) => item.id === id);
  },
});
