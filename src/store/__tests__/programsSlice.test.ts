/**
 * Programs Slice Tests
 * Tests for program CRUD operations and dependency tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Program } from '@/types/config';
import { createProgramsSlice } from '../slices/programs';
import { createFormsSlice } from '../slices/forms';
import { createUISlice } from '../slices/ui';
import { createConfigSlice } from '../slices/config';
import type { AppState } from '../types';

describe('Programs Slice', () => {
  let useStore: ReturnType<typeof create<AppState>>;

  beforeEach(() => {
    // Create a minimal store with the slices we need
    useStore = create<AppState>()(
      immer((...args) => ({
        programs: createProgramsSlice(...args),
        forms: createFormsSlice(...args),
        ctas: {} as any,
        branches: {} as any,
        cardInventory: {} as any,
        contentShowcase: {} as any,
        ui: createUISlice(...args),
        config: createConfigSlice(...args),
        validation: {} as any,
      }))
    );
  });

  describe('createProgram', () => {
    it('should create a new program', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);

      const stored = useStore.getState().programs.programs['test-program'];
      expect(stored).toEqual(program);
    });

    it('should mark config as dirty', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);

      expect(useStore.getState().config.isDirty).toBe(true);
    });

    it('should add success toast', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);

      const toasts = useStore.getState().ui.toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toContain('Test Program');
    });
  });

  describe('updateProgram', () => {
    it('should update existing program', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().programs.updateProgram('test-program', {
        program_name: 'Updated Program',
      });

      const updated = useStore.getState().programs.programs['test-program'];
      expect(updated.program_name).toBe('Updated Program');
    });

    it('should not create program if it does not exist', () => {
      useStore.getState().programs.updateProgram('nonexistent', {
        program_name: 'Should Not Exist',
      });

      expect(useStore.getState().programs.programs['nonexistent']).toBeUndefined();
    });

    it('should mark config as dirty', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().config.markClean(); // Reset dirty state

      useStore.getState().programs.updateProgram('test-program', {
        program_name: 'Updated',
      });

      expect(useStore.getState().config.isDirty).toBe(true);
    });
  });

  describe('deleteProgram', () => {
    it('should delete program without dependencies', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().programs.deleteProgram('test-program');

      expect(useStore.getState().programs.programs['test-program']).toBeUndefined();
    });

    it('should not delete program with form dependencies', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      const form = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['apply'],
        fields: [{ id: 'name', type: 'text' as const, label: 'Name', prompt: 'Name?', required: true }],
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().forms.createForm(form);

      useStore.getState().programs.deleteProgram('test-program');

      // Program should still exist
      expect(useStore.getState().programs.programs['test-program']).toBeDefined();

      // Error toast should be added
      const toasts = useStore.getState().ui.toasts;
      expect(toasts.some((t) => t.type === 'error')).toBe(true);
    });

    it('should clear active program if deleted', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().programs.setActiveProgram('test-program');
      useStore.getState().programs.deleteProgram('test-program');

      expect(useStore.getState().programs.activeProgramId).toBeNull();
    });
  });

  describe('duplicateProgram', () => {
    it('should duplicate existing program', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
        program_description: 'Test Description',
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().programs.duplicateProgram('test-program');

      const allPrograms = useStore.getState().programs.getAllPrograms();
      expect(allPrograms).toHaveLength(2);

      const duplicated = allPrograms.find((p) => p.program_id !== 'test-program');
      expect(duplicated?.program_name).toContain('Copy');
      expect(duplicated?.program_description).toBe('Test Description');
    });

    it('should show error toast if program not found', () => {
      useStore.getState().programs.duplicateProgram('nonexistent');

      const toasts = useStore.getState().ui.toasts;
      expect(toasts.some((t) => t.type === 'error')).toBe(true);
    });
  });

  describe('setActiveProgram', () => {
    it('should set active program', () => {
      useStore.getState().programs.setActiveProgram('test-program');
      expect(useStore.getState().programs.activeProgramId).toBe('test-program');
    });

    it('should clear active program', () => {
      useStore.getState().programs.setActiveProgram('test-program');
      useStore.getState().programs.setActiveProgram(null);
      expect(useStore.getState().programs.activeProgramId).toBeNull();
    });
  });

  describe('selectors', () => {
    it('should get program by ID', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      useStore.getState().programs.createProgram(program);

      const retrieved = useStore.getState().programs.getProgram('test-program');
      expect(retrieved).toEqual(program);
    });

    it('should return undefined for nonexistent program', () => {
      const retrieved = useStore.getState().programs.getProgram('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all programs', () => {
      const program1: Program = {
        program_id: 'program-1',
        program_name: 'Program 1',
      };
      const program2: Program = {
        program_id: 'program-2',
        program_name: 'Program 2',
      };

      useStore.getState().programs.createProgram(program1);
      useStore.getState().programs.createProgram(program2);

      const all = useStore.getState().programs.getAllPrograms();
      expect(all).toHaveLength(2);
    });

    it('should get program dependencies', () => {
      const program: Program = {
        program_id: 'test-program',
        program_name: 'Test Program',
      };

      const form = {
        enabled: true,
        form_id: 'test-form',
        program: 'test-program',
        title: 'Test Form',
        description: 'Test',
        trigger_phrases: ['apply'],
        fields: [{ id: 'name', type: 'text' as const, label: 'Name', prompt: 'Name?', required: true }],
      };

      useStore.getState().programs.createProgram(program);
      useStore.getState().forms.createForm(form);

      const deps = useStore.getState().programs.getProgramDependencies('test-program');
      expect(deps.forms).toHaveLength(1);
      expect(deps.forms[0]).toBe('test-form');
    });
  });
});
