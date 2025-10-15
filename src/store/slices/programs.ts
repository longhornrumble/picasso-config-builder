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
  },

  updateProgram: (programId: string, updates: Partial<Program>) => {
    set((state) => {
      const program = state.programs.programs[programId];
      if (program) {
        state.programs.programs[programId] = { ...program, ...updates };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Program updated successfully',
    });
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
