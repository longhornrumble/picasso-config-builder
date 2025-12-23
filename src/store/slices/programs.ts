/**
 * Programs Slice
 * Manages program entities and their CRUD operations
 */

import type { Program } from '@/types/config';
import type { SliceCreator, ProgramsSlice, Dependencies } from '../types';

export const createProgramsSlice: SliceCreator<ProgramsSlice> = (set, get) => ({
  // State
  programs: {},
  activeProgramId: null,

  // Actions
  createProgram: (program: Program) => {
    set((state) => {
      state.programs.programs[program.program_id] = program;
      state.config.markDirty();
    });

    // Show success toast
    get().ui.addToast({
      type: 'success',
      message: `Program "${program.program_name}" created successfully`,
    });

    // Re-run validation after creating program
    get().validation.validateAll();
  },

  updateProgram: (programId: string, updates: Partial<Program> | Program) => {
    let updateSucceeded = false;

    set((state) => {
      const program = state.programs.programs[programId];

      if (!program) {
        console.error('[programs.ts] Program not found:', {
          programId,
          availableProgramIds: Object.keys(state.programs.programs),
        });
        return;
      }

      // If updates contains program_id, it's a full replacement, otherwise it's a partial update
      const isFullReplacement = 'program_id' in updates;
      const newProgramId = isFullReplacement ? (updates as Program).program_id : programId;
      const programIdChanged = newProgramId !== programId;

      // If program_id changed, check for duplicates
      if (programIdChanged && state.programs.programs[newProgramId]) {
        get().ui.addToast({
          type: 'error',
          message: `Program ID "${newProgramId}" already exists`,
        });
        return;
      }

      // Build the updated program
      const updatedProgram = isFullReplacement
        ? (updates as Program)
        : { ...program, ...updates };

      // If program_id changed, handle key remapping and cascade updates
      if (programIdChanged) {
        // Remove old key
        delete state.programs.programs[programId];

        // Add with new key
        state.programs.programs[newProgramId] = updatedProgram;

        // Cascade update forms that reference this program
        Object.entries(state.forms.forms).forEach(([formId, form]) => {
          if (form.program === programId) {
            state.forms.forms[formId] = { ...form, program: newProgramId };
          }
        });

        // Update activeProgramId if it was the renamed program
        if (state.programs.activeProgramId === programId) {
          state.programs.activeProgramId = newProgramId;
        }
      } else {
        // No ID change - simple update
        state.programs.programs[programId] = updatedProgram;
      }

      state.config.markDirty();
      updateSucceeded = true;
    });

    if (updateSucceeded) {
      get().ui.addToast({
        type: 'success',
        message: 'Program updated successfully',
      });
    }

    // Re-run validation after updating program
    get().validation.validateAll();
  },

  deleteProgram: (programId: string) => {
    const dependencies = get().programs.getProgramDependencies(programId);

    // Check if program is used by any forms
    if (dependencies.forms.length > 0) {
      get().ui.addToast({
        type: 'error',
        message: `Cannot delete program. It is used by ${dependencies.forms.length} form(s).`,
      });
      return;
    }

    set((state) => {
      const programName = state.programs.programs[programId]?.program_name;
      delete state.programs.programs[programId];

      // Clear active program if deleted
      if (state.programs.activeProgramId === programId) {
        state.programs.activeProgramId = null;
      }

      state.config.markDirty();

      // Show success toast
      if (programName) {
        get().ui.addToast({
          type: 'success',
          message: `Program "${programName}" deleted successfully`,
        });
      }
    });

    // Re-run validation after deleting program
    get().validation.validateAll();
  },

  duplicateProgram: (programId: string) => {
    const program = get().programs.programs[programId];
    if (!program) {
      get().ui.addToast({
        type: 'error',
        message: 'Program not found',
      });
      return;
    }

    // Generate new ID
    const newId = `${programId}_copy_${Date.now()}`;
    const newProgram: Program = {
      ...program,
      program_id: newId,
      program_name: `${program.program_name} (Copy)`,
    };

    get().programs.createProgram(newProgram);
  },

  setActiveProgram: (programId: string | null) => {
    set((state) => {
      state.programs.activeProgramId = programId;
    });
  },

  // Selectors
  getProgram: (programId: string) => {
    return get().programs.programs[programId];
  },

  getAllPrograms: () => {
    return Object.values(get().programs.programs);
  },

  getProgramDependencies: (programId: string) => {
    const state = get();
    const dependencies: Dependencies = {
      programs: [],
      forms: [],
      ctas: [],
      branches: [],
    };

    // Find forms that reference this program
    Object.entries(state.forms.forms).forEach(([formId, form]) => {
      if (form.program === programId) {
        dependencies.forms.push(formId);
      }
    });

    return dependencies;
  },
});
