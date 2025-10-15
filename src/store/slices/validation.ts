/**
 * Validation Slice
 * Tracks validation errors and warnings across the configuration
 *
 * Updated to use the comprehensive validation engine from @/lib/validation
 */

import type { SliceCreator, ValidationSlice, ValidationError } from '../types';
import { validateConfigFromStore, getValidationSummary } from '@/lib/validation';

export const createValidationSlice: SliceCreator<ValidationSlice> = (set, get) => ({
  // State
  errors: {},
  warnings: {},
  isValid: true,
  lastValidated: null,

  // Actions
  setErrors: (entityId: string, errors: ValidationError[]) => {
    set((state) => {
      if (errors.length > 0) {
        state.validation.errors[entityId] = errors;
        state.validation.isValid = false;
      } else {
        delete state.validation.errors[entityId];
        // Recalculate isValid
        state.validation.isValid = Object.keys(state.validation.errors).length === 0;
      }
    });
  },

  setWarnings: (entityId: string, warnings: ValidationError[]) => {
    set((state) => {
      if (warnings.length > 0) {
        state.validation.warnings[entityId] = warnings;
      } else {
        delete state.validation.warnings[entityId];
      }
    });
  },

  clearErrors: (entityId: string) => {
    set((state) => {
      delete state.validation.errors[entityId];
      // Recalculate isValid
      state.validation.isValid = Object.keys(state.validation.errors).length === 0;
    });
  },

  clearWarnings: (entityId: string) => {
    set((state) => {
      delete state.validation.warnings[entityId];
    });
  },

  clearAll: () => {
    set((state) => {
      state.validation.errors = {};
      state.validation.warnings = {};
      state.validation.isValid = true;
      state.validation.lastValidated = null;
    });
  },

  validateAll: async () => {
    const state = get();

    // Use the comprehensive validation engine
    const result = validateConfigFromStore(state);

    // Group errors and warnings by entity ID
    const errorsByEntity: Record<string, ValidationError[]> = {};
    const warningsByEntity: Record<string, ValidationError[]> = {};

    result.errors.forEach((error) => {
      const entityKey = error.entityId || 'global';
      if (!errorsByEntity[entityKey]) {
        errorsByEntity[entityKey] = [];
      }
      // Convert validation engine error to store ValidationError format
      errorsByEntity[entityKey].push({
        field: error.field || '',
        message: error.message,
        severity: 'error',
      });
    });

    result.warnings.forEach((warning) => {
      const entityKey = warning.entityId || 'global';
      if (!warningsByEntity[entityKey]) {
        warningsByEntity[entityKey] = [];
      }
      // Convert validation engine warning to store ValidationError format
      warningsByEntity[entityKey].push({
        field: warning.field || '',
        message: warning.message,
        severity: 'warning',
      });
    });

    // Update validation state
    set((state) => {
      state.validation.errors = errorsByEntity;
      state.validation.warnings = warningsByEntity;
      state.validation.isValid = result.valid;
      state.validation.lastValidated = Date.now();
    });

    // Show toast with results
    const summary = getValidationSummary(result);

    if (result.summary.totalErrors > 0) {
      state.ui.addToast({
        type: 'error',
        message: summary,
      });
    } else if (result.summary.totalWarnings > 0) {
      state.ui.addToast({
        type: 'warning',
        message: summary,
      });
    } else {
      state.ui.addToast({
        type: 'success',
        message: summary,
      });
    }
  },

  // Selectors
  getErrorsForEntity: (entityId: string) => {
    return get().validation.errors[entityId] || [];
  },

  getWarningsForEntity: (entityId: string) => {
    return get().validation.warnings[entityId] || [];
  },

  hasErrors: () => {
    return Object.keys(get().validation.errors).length > 0;
  },

  hasWarnings: () => {
    return Object.keys(get().validation.warnings).length > 0;
  },
});
