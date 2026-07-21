/**
 * Action-chip store operations. Chips have no store slice — they live on
 * baseConfig.action_chips.default_chips (a dictionary; widget render order = key
 * order). All mutators go through immer setState and flip isDirty.
 */

import { useConfigStore } from '@/store';
import type { ActionChip, ActionChipsConfig } from '@/types/config';

export function createChip(chip: ActionChip, chipId: string): void {
  useConfigStore.setState((state) => {
    if (!state.config.baseConfig) return;
    if (!state.config.baseConfig.action_chips) {
      state.config.baseConfig.action_chips = { default_chips: {} } as ActionChipsConfig;
    }
    if (!state.config.baseConfig.action_chips.default_chips) {
      state.config.baseConfig.action_chips.default_chips = {};
    }
    state.config.baseConfig.action_chips.default_chips[chipId] = chip;
    state.config.isDirty = true;
  });
}

export function updateChip(chipId: string, updates: Partial<ActionChip>): void {
  useConfigStore.setState((state) => {
    const chips = state.config.baseConfig?.action_chips?.default_chips;
    if (!chips || !chips[chipId]) return;
    chips[chipId] = { ...chips[chipId], ...updates };
    state.config.isDirty = true;
  });
}

export function deleteChip(chipId: string): void {
  useConfigStore.setState((state) => {
    const chips = state.config.baseConfig?.action_chips?.default_chips;
    if (chips) delete chips[chipId];
    state.config.isDirty = true;
  });
}

/** Rebuild default_chips in the given key order (widget render order). */
export function reorderChips(orderedIds: string[]): void {
  useConfigStore.setState((state) => {
    const chips = state.config.baseConfig?.action_chips?.default_chips;
    if (!chips) return;
    const rebuilt: Record<string, ActionChip> = {};
    orderedIds.forEach((id) => { if (chips[id]) rebuilt[id] = chips[id]; });
    // Safety: keep any chips not covered by orderedIds, in their existing order.
    Object.keys(chips).forEach((id) => { if (!(id in rebuilt)) rebuilt[id] = chips[id]; });
    state.config.baseConfig!.action_chips!.default_chips = rebuilt;
    state.config.isDirty = true;
  });
}
