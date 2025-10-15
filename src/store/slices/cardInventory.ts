/**
 * Card Inventory Slice
 * Manages smart response cards (mostly read-only for MVP)
 */

import type { CardInventory } from '@/types/config';
import type { SliceCreator, CardInventorySlice } from '../types';

export const createCardInventorySlice: SliceCreator<CardInventorySlice> = (set, get) => ({
  // State
  cardInventory: null,

  // Actions
  updateCardInventory: (updates: Partial<CardInventory>) => {
    set((state) => {
      if (state.cardInventory.cardInventory) {
        state.cardInventory.cardInventory = {
          ...state.cardInventory.cardInventory,
          ...updates,
        };
        state.config.markDirty();
      } else {
        // If no card inventory exists, create a new one with defaults
        state.cardInventory.cardInventory = {
          strategy: 'qualification_first',
          primary_cta: {
            type: 'form',
            title: 'Get Started',
            trigger_phrases: [],
          },
          requirements: [],
          program_cards: [],
          readiness_thresholds: {
            show_requirements: 0.3,
            show_programs: 0.5,
            show_cta: 0.7,
            show_forms: 0.8,
          },
          ...updates,
        } as CardInventory;
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Card inventory updated successfully',
    });
  },

  resetCardInventory: () => {
    set((state) => {
      state.cardInventory.cardInventory = null;
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'info',
      message: 'Card inventory reset',
    });
  },

  // Selectors
  getCardInventory: () => {
    return get().cardInventory.cardInventory;
  },
});
